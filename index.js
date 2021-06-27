#!/usr/bin/env node

'use strict'

const prog = require('caporal')
const acorn = require('acorn')
const glob = require('glob')
const fs = require('fs')
const path = require('path')

const pkg = require('./package.json')
const argsArray = process.argv

/**
 * es-check 🏆
 * ----
 * @description
 * - define the EcmaScript version to check for against a glob of JavaScript files
 * - match the EcmaScript version option against a glob of files
 *   to to test the EcmaScript version of each file
 * - error failures
 */
prog
  .version(pkg.version)
  .argument(
    '[ecmaVersion]',
    'ecmaVersion to check files against. Can be: es3, es4, es5, es6/es2015, es7/es2016, es8/es2017, es9/es2018, es10/es2019'
  )
  .argument(
    '[files...]',
    'a glob of files to to test the EcmaScript version against'
  )
  .option('--module', 'use ES modules')
  .option(
    '--allow-hash-bang',
    'if the code starts with #! treat it as a comment'
  )
  .option('--not', 'folder or file names to skip', prog.LIST)
  .action((args, options, logger) => {
    const configFilePath = path.resolve(process.cwd(), '.escheckrc')

    /**
     * @note
     * Check for a configuration file.
     * - If one exists, default to those options
     * - If no command line arguments are passed in
     */
    const config = fs.existsSync(configFilePath)
      ? JSON.parse(fs.readFileSync(configFilePath))
      : {}
    const expectedEcmaVersion = args.ecmaVersion
      ? args.ecmaVersion
      : config.ecmaVersion
    const files = args.files.length ? args.files : [].concat(config.files)
    const esmodule = options.module ? options.module : config.module
    const allowHashBang = options.allowHashBang
      ? options.allowHashBang
      : config.allowHashBang
    const pathsToIgnore = options.not.length
      ? options.not
      : [].concat(config.not || [])

    if (!expectedEcmaVersion) {
      logger.error(
        'No ecmaScript version passed in or found in .escheckrc. Please set your ecmaScript version in the CLI or in .escheckrc'
      )
      process.exit(1)
    }

    if (!files || !files.length) {
      logger.error(
        'No files were passed in please pass in a list of files to es-check!'
      )
      process.exit(1)
    }

    /**
     * @note define ecmaScript version
     */
    let ecmaVersion
    switch (expectedEcmaVersion) {
      case 'es3':
        ecmaVersion = '3'
        break
      case 'es4':
        ecmaVersion = '4'
        break
      case 'es5':
        ecmaVersion = '5'
        break
      case 'es6':
        ecmaVersion = '6'
        break
      case 'es7':
        ecmaVersion = '7'
        break
      case 'es8':
        ecmaVersion = '8'
        break
      case 'es9':
        ecmaVersion = '9'
        break
      case 'es10':
        ecmaVersion = '10'
        break
      case 'es11':
        ecmaVersion = '11'
        break
      case 'es12':
        ecmaVersion = '12'
        break
      case 'es2015':
        ecmaVersion = '6'
        break
      case 'es2016':
        ecmaVersion = '7'
        break
      case 'es2017':
        ecmaVersion = '8'
        break
      case 'es2018':
        ecmaVersion = '9'
        break
      case 'es2019':
        ecmaVersion = '10'
        break
      case 'es2020':
        ecmaVersion = '2020'
        break
      case 'es2021':
        ecmaVersion = '2021'
        break
      default:
        logger.error(
          'Invalid ecmaScript version, please pass a valid version, use --help for help'
        )
        process.exit(1)
    }

    const errArray = []
    const globOpts = { nodir: true }
    const acornOpts = { ecmaVersion, silent: true }

    const expandedPathsToIgnore = pathsToIgnore.reduce((result, path) => {
      if (path.includes('*')) {
        return result.concat(glob.sync(path, globOpts))
      } else {
        return result.concat(path)
      }
    }, [])

    const filterForIgnore = (globbedFiles) => {
      if (expandedPathsToIgnore && expandedPathsToIgnore.length > 0) {
        const filtered = globbedFiles.filter(
          (filePath) =>
            !expandedPathsToIgnore.some((ignoreValue) =>
              filePath.includes(ignoreValue)
            )
        )
        return filtered
      }
      return globbedFiles
    }

    logger.debug(`ES-Check: Going to check files using version ${ecmaVersion}`)

    if (esmodule) {
      acornOpts.sourceType = 'module'
      logger.debug('ES-Check: esmodule is set')
    }

    if (allowHashBang) {
      acornOpts.allowHashBang = true
      logger.debug('ES-Check: allowHashBang is set')
    }

    files.forEach((pattern) => {
      const globbedFiles = glob.sync(pattern, globOpts)

      if (globbedFiles.length === 0) {
        logger.error(
          `ES-Check: Did not find any files to check for ${pattern}.`
        )
        process.exit(1)
      }

      const filteredFiles = filterForIgnore(globbedFiles)

      filteredFiles.forEach((file) => {
        const code = fs.readFileSync(file, 'utf8')

        logger.debug(`ES-Check: checking ${file}`)
        try {
          acorn.parse(code, acornOpts)
        } catch (err) {
          logger.debug(
            `ES-Check: failed to parse file: ${file} \n - error: ${err}`
          )
          const errorObj = {
            err,
            stack: err.stack,
            file
          }
          errArray.push(errorObj)
        }
      })
    })

    if (errArray.length > 0) {
      logger.error(
        `ES-Check: there were ${errArray.length} ES version matching errors.`
      )
      errArray.forEach((o) => {
        logger.info(`
          ES-Check Error:
          ----
          · erroring file: ${o.file}
          · error: ${o.err}
          · see the printed err.stack below for context
          ----\n
          ${o.stack}
        `)
      })
      process.exit(1)
    }
    logger.info(`ES-Check: there were no ES version matching errors!  🎉`)
  })

prog.parse(argsArray)
