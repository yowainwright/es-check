#!/usr/bin/env node

'use strict'

const { program, Option } = require('commander')
const acorn = require('acorn')
const glob = require('fast-glob')
const fs = require('fs')
const supportsColor = require('supports-color')
const winston = require('winston')
const detectFeatures = require('./detectFeatures')
const pkg = require('./package.json')
const { lilconfig } = require('lilconfig');

/**
 * es-check 🏆
 * ----
 * @description
 * - define the EcmaScript version to check for against a glob of JavaScript files
 * - match the EcmaScript version option against a glob of files
 *   to to test the EcmaScript version of each file
 * - error failures
 */
program
  .version(pkg.version)
  .argument(
    '[ecmaVersion]',
    'ecmaVersion to check files against. Can be: es3, es4, es5, es6/es2015, es7/es2016, es8/es2017, es9/es2018, es10/es2019, es11/es2020, es12/es2021, es13/es2022, es14/es2023',
  )
  .argument('[files...]', 'a glob of files to to test the EcmaScript version against')
  .option('--module', 'use ES modules')
  .addOption(new Option('--allow-hash-bang', 'if the code starts with #! treat it as a comment').default(false).hideHelp())
  .option('--allowHashBang', 'if the code starts with #! treat it as a comment', false)
  .option('--files <files>', 'a glob of files to to test the EcmaScript version against (alias for [files...])')
  .option('--not <files>', 'folder or file names to skip')
  .addOption(new Option('--no-color', 'disable use of colors in output').default(false).hideHelp())
  .option('--noColor', 'disable use of colors in output', false)
  .option('-v, --verbose', 'verbose mode: will also output debug messages', false)
  .option('--quiet', 'quiet mode: only displays warn and error messages', false)
  .option('--looseGlobMatching', 'doesn\'t fail if no files are found in some globs/files', false)
  .option('--checkFeatures', 'check features of es version', false)
  .option(
    '--silent',
    'silent mode: does not output anything, giving no indication of success or failure other than the exit code', false
  )

async function loadConfig() {
  try {
    const configExplorer = lilconfig('escheck', {
      searchPlaces: ['.escheckrc', '.escheckrc.json', 'package.json'],
      loaders: {
        '.escheckrc': (filepath, content) => {
          try {
            return JSON.parse(content);
          } catch (err) {
            throw new Error(`Invalid JSON in ${filepath}`);
          }
        }
      }
    });

    const result = await configExplorer.search();
    if (!result) return [{}];

    const config = result.config;
    // Ensure we always return an array of configs
    return Array.isArray(config) ? config : [config];
  } catch (err) {
    logger.error(`Error loading config: ${err.message}`);
    process.exit(1);
  }
}

program
  .action(async (ecmaVersionArg, filesArg, options) => {
    const noColor = options?.noColor || options?.['no-color'] || false;
    const logger = winston.createLogger()
    logger.add(
      new winston.transports.Console({
        silent: options.silent,
        level: options.verbose ? 'silly' : options.quiet ? 'warn' : 'info',
        format: winston.format.combine(
          ...(supportsColor.stdout || !noColor ? [winston.format.colorize()] : []),
          winston.format.simple(),
        ),
      }),
    )

    if (filesArg && filesArg.length && options.files) {
      logger.error('Cannot pass in both [files...] argument and --files flag at the same time!')
      process.exit(1)
    }

    const configs = await loadConfig();
    
    // If command line arguments are provided, they override all configs
    if (ecmaVersionArg || filesArg?.length || options.files) {
      const singleConfig = {
        ecmaVersion: ecmaVersionArg,
        files: filesArg?.length ? filesArg : options.files?.split(','),
        module: options.module,
        allowHashBang: options.allowHashBang || options['allow-hash-bang'],
        not: options.not?.split(','),
        looseGlobMatching: options.looseGlobMatching || options['loose-glob-matching'],
        checkFeatures: options.checkFeatures
      };
      return runChecks([singleConfig], logger);
    }

    // Otherwise use config file
    if (!configs.length) {
      logger.error('No configuration found. Please provide command line arguments or a config file.');
      process.exit(1);
    }

    return runChecks(configs, logger);
  })

async function runChecks(configs, logger) {
  let hasErrors = false;

  for (const config of configs) {
    const expectedEcmaVersion = config.ecmaVersion;
    const files = [].concat(config.files || []);
    const esmodule = config.module;
    const allowHashBang = config.allowHashBang;
    const pathsToIgnore = [].concat(config.not || []);
    const looseGlobMatching = config.looseGlobMatching;
    const checkFeatures = config.checkFeatures;

    if (!expectedEcmaVersion) {
      logger.error('No ecmaScript version specified in configuration');
      process.exit(1);
    }

    if (!files.length) {
      logger.error('No files specified in configuration');
      process.exit(1);
    }

    if (looseGlobMatching) {
      logger.debug('ES-Check: loose-glob-matching is set')
    }

    const globOpts = { nodir: true }
    let allMatchedFiles = []
    files.forEach((pattern) => {
      const globbedFiles = glob.sync(pattern, globOpts);
      if (globbedFiles.length === 0 && !looseGlobMatching) {
        logger.error(`ES-Check: Did not find any files to check for ${pattern}.`)
        process.exit(1)
      }
      allMatchedFiles = allMatchedFiles.concat(globbedFiles);
    }, []);

    if (allMatchedFiles.length === 0) {
      logger.error(`ES-Check: Did not find any files to check for ${files}.`)
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
        logger.error('ES4 is not supported.')
        process.exit(1)
      case 'es5':
        ecmaVersion = '5'
        break
      case 'es6':
      case 'es2015':
        ecmaVersion = '6'
        break
      case 'es7':
      case 'es2016':
        ecmaVersion = '7'
        break
      case 'es8':
      case 'es2017':
        ecmaVersion = '8'
        break
      case 'es9':
      case 'es2018':
        ecmaVersion = '9'
        break
      case 'es10':
      case 'es2019':
        ecmaVersion = '10'
        break
      case 'es11':
      case 'es2020':
        ecmaVersion = '11'
        break
      case 'es12':
      case 'es2021':
        ecmaVersion = '12'
        break
      case 'es13':
      case 'es2022':
        ecmaVersion = '13'
        break
      case 'es14':
      case 'es2023':
        ecmaVersion = '14'
        break
      default:
        logger.error('Invalid ecmaScript version, please pass a valid version, use --help for help')
        process.exit(1)
    }

    const errArray = []
    const acornOpts = { ecmaVersion: parseInt(ecmaVersion, 10), silent: true }

    logger.debug(`ES-Check: Going to check files using version ${ecmaVersion}`)

    if (esmodule) {
      acornOpts.sourceType = 'module'
      logger.debug('ES-Check: esmodule is set')
    }

    if (allowHashBang) {
      acornOpts.allowHashBang = true
      logger.debug('ES-Check: allowHashBang is set')
    }

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
          (filePath) => !expandedPathsToIgnore.some((ignoreValue) => filePath.includes(ignoreValue)),
        )
        return filtered
      }
      return globbedFiles
    }

    const filteredFiles = filterForIgnore(allMatchedFiles)

    filteredFiles.forEach((file) => {
      const code = fs.readFileSync(file, 'utf8')
      logger.debug(`ES-Check: checking ${file}`)
      try {
        acorn.parse(code, acornOpts)
      } catch (err) {
        logger.debug(`ES-Check: failed to parse file: ${file} \n - error: ${err}`)
        const errorObj = {
          err,
          stack: err.stack,
          file,
        }
        errArray.push(errorObj);
        return;
      }

      if (!checkFeatures) return;
      const parseSourceType = acornOpts.sourceType || 'script';
      const esVersion = parseInt(ecmaVersion, 10);
      const { foundFeatures, unsupportedFeatures } = detectFeatures(code, esVersion, parseSourceType);
      const stringifiedFeatures = JSON.stringify(foundFeatures, null, 2);
      logger.debug(`Features found in ${file}: ${stringifiedFeatures}`);
      const isSupported = unsupportedFeatures.length === 0;
      if (!isSupported) {
        const error = new Error(`Unsupported features used: ${unsupportedFeatures.join(', ')} but your target is ES${ecmaVersion}.`);
        errArray.push({
          err: error,
          file,
          stack: error.stack
        });
      }
    })

    if (errArray.length > 0) {
      logger.error(`ES-Check: there were ${errArray.length} ES version matching errors.`)
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
  }

  if (hasErrors) {
    process.exit(1);
  }
}

program.parse()
