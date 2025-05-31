#!/usr/bin/env node

'use strict'

const { program, Option } = require('commander')
const acorn = require('acorn')
const glob = require('fast-glob')
const fs = require('fs')
const supportsColor = require('supports-color')
const winston = require('winston')
const detectFeatures = require('./detectFeatures')
let polyfillDetector = null; // Lazy-loaded only when needed
const pkg = require('./package.json')
const { lilconfig } = require('lilconfig');
const { parseIgnoreList } = require('./utils');

// Register completion command (hidden from help)
program.configureOutput({
  writeOut: (str) => process.stdout.write(str),
  writeErr: (str) => process.stderr.write(str),
  outputError: (str, write) => write(str)
});

program.showHelpAfterError();
program.enablePositionalOptions();
program.showSuggestionAfterError();

/**
 * es-check 🏆
 * ----
 * @description
 * - define the EcmaScript version to check for against a glob of JavaScript files
 * - match the EcmaScript version option against a glob of files
 *   to to test the EcmaScript version of each file
 * - error failures
 */
// Add completion command
program
  .command('completion')
  .description('generate shell completion script')
  .argument('[shell]', 'shell type: bash, zsh', 'bash')
  .action((shell) => {
    // Generate completion script for the specified shell
    let completionScript;

    // Get all available commands and options
    const commands = ['completion'];
    const options = [];

    // Extract all options from the program
    program.options.forEach(opt => {
      const flag = opt.long || opt.short;
      if (flag) {
        options.push(flag.replace(/^-+/, ''));
      }
    });

    switch (shell) {
      case 'bash':
        completionScript = generateBashCompletion('es-check', commands, options);
        break;
      case 'zsh':
        completionScript = generateZshCompletion('es-check', commands, options);
        break;
      default:
        console.error(`Shell "${shell}" not supported for completion. Supported shells: bash, zsh`);
        process.exit(1);
    }

    console.log(completionScript);
  });

// Generate bash completion script
function generateBashCompletion(cmdName, commands, options) {
  const cmdsStr = commands.join(' ');
  const optsStr = options.map(opt => '--' + opt).join(' ');

  return `
# es-check bash completion script
# Install by adding to ~/.bashrc:
# source /path/to/es-check-completion.bash

_es_check_completion() {
  local cur prev opts cmds
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  # List of commands
  cmds="${cmdsStr}"

  # List of options
  opts="${optsStr}"

  # ES versions
  es_versions="es3 es5 es6 es2015 es7 es2016 es8 es2017 es9 es2018 es10 es2019 es11 es2020 es12 es2021 es13 es2022 es14 es2023"

  # Handle special cases based on previous argument
  case "\$prev" in
    ${cmdName})
      # After the main command, suggest ES versions or commands
      COMPREPLY=( \$(compgen -W "\$es_versions \$cmds \$opts" -- "\$cur") )
      return 0
      ;;
    completion)
      # After 'completion' command, suggest shell types
      COMPREPLY=( \$(compgen -W "bash zsh" -- "\$cur") )
      return 0
      ;;
    *)
      # Default case: suggest options or files
      if [[ "\$cur" == -* ]]; then
        # If current word starts with a dash, suggest options
        COMPREPLY=( \$(compgen -W "\$opts" -- "\$cur") )
      else
        # Otherwise suggest files
        COMPREPLY=( \$(compgen -f -- "\$cur") )
      fi
      return 0
      ;;
  esac
}

complete -F _es_check_completion ${cmdName}
`;
}

// Generate zsh completion script
function generateZshCompletion(cmdName, commands, options) {
  const optionsStr = options.map(opt => `"--${opt}[Option description]"`).join('\n    ');
  const commandsStr = commands.map(cmd => `"${cmd}:Command description"`).join('\n    ');

  return `
#compdef ${cmdName}

_es_check() {
  local -a commands options es_versions

  # ES versions
  es_versions=(
    "es3:ECMAScript 3"
    "es5:ECMAScript 5"
    "es6:ECMAScript 2015"
    "es2015:ECMAScript 2015"
    "es7:ECMAScript 2016"
    "es2016:ECMAScript 2016"
    "es8:ECMAScript 2017"
    "es2017:ECMAScript 2017"
    "es9:ECMAScript 2018"
    "es2018:ECMAScript 2018"
    "es10:ECMAScript 2019"
    "es2019:ECMAScript 2019"
    "es11:ECMAScript 2020"
    "es2020:ECMAScript 2020"
    "es12:ECMAScript 2021"
    "es2021:ECMAScript 2021"
    "es13:ECMAScript 2022"
    "es2022:ECMAScript 2022"
    "es14:ECMAScript 2023"
    "es2023:ECMAScript 2023"
  )

  # Commands
  commands=(
    ${commandsStr}
  )

  # Options
  options=(
    ${optionsStr}
  )

  # Handle subcommands
  if (( CURRENT > 2 )); then
    case \${words[2]} in
      completion)
        _arguments "1:shell:(bash zsh)"
        return
        ;;
    esac
  fi

  # Main completion
  _arguments -C \\
    "1: :{_describe 'command or ES version' es_versions -- commands}" \\
    "*:: :->args"

  case \$state in
    args)
      _arguments -s : \\
        \$options \\
        "*:file:_files"
      ;;
  esac
}

_es_check
`;
}

program
  .version(pkg.version)
  .argument(
    '[ecmaVersion]',
    'ecmaVersion to check files against. Can be: es3, es4, es5, es6/es2015, es7/es2016, es8/es2017, es9/es2018, es10/es2019, es11/es2020, es12/es2021, es13/es2022, es14/es2023, checkBrowser',
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
  .option('--checkForPolyfills', 'consider polyfills when checking features (only works with --checkFeatures)', false)
  .option(
    '--silent',
    'silent mode: does not output anything, giving no indication of success or failure other than the exit code', false
  )
  .option('--ignore <features>', 'comma-separated list of features to ignore, e.g., "ErrorCause,TopLevelAwait"')
  .addOption(new Option('--ignore-file <path>', 'path to JSON file containing features to ignore').hideHelp())
  .option('--ignoreFile <path>', 'path to JSON file containing features to ignore')
  .option('--allowList <features>', 'comma-separated list of features to allow even in lower ES versions, e.g., "const,let"')
  .addOption(new Option('--checkBrowser', 'use browserslist configuration to determine ES version, use checkBrowser argument instead of ecmaVersion').hideHelp())
  .option('--browserslistQuery <query>', 'browserslist query')
  .option('--browserslistPath <path>', 'path to custom browserslist configuration')
  .option('--browserslistEnv <env>', 'browserslist environment to use')
  .option('--config <path>', 'path to custom .escheckrc config file')

async function loadConfig(customConfigPath) {
  try {
    // If a custom config path is provided, load it directly
    if (customConfigPath) {
      try {
        const content = fs.readFileSync(customConfigPath, 'utf8');
        const config = JSON.parse(content);
        // Ensure we always return an array of configs
        return Array.isArray(config) ? config : [config];
      } catch (err) {
        throw new Error(`Error loading custom config file ${customConfigPath}: ${err.message}`);
      }
    }

    // Otherwise use lilconfig to search for config files
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

    const configs = await loadConfig(options.config);

    // If command line arguments are provided, they override all configs
    if (ecmaVersionArg || filesArg?.length || options.files) {
      // Get ignoreFile from either camelCase or kebab-case option
      const ignoreFilePath = options.ignoreFile || options['ignore-file'];

      // If ignoreFile is specified but doesn't exist, warn the user
      if (ignoreFilePath && !fs.existsSync(ignoreFilePath) && logger.isLevelEnabled('warn')) {
        logger.warn(`Warning: Ignore file '${ignoreFilePath}' does not exist or is not accessible`);
      }


      const singleConfig = {
        ecmaVersion: ecmaVersionArg,
        files: filesArg?.length ? filesArg : options.files?.split(','),
        module: options.module,
        allowHashBang: options.allowHashBang || options['allow-hash-bang'],
        not: options.not?.split(','),
        looseGlobMatching: options.looseGlobMatching || options['loose-glob-matching'],
        checkFeatures: options.checkFeatures,
        checkForPolyfills: options.checkForPolyfills,
        ignore: options.ignore,
        ignoreFile: options.ignoreFile || options['ignore-file'],
        allowList: options.allowList,
        checkBrowser: options.checkBrowser,
        browserslistQuery: options.browserslistQuery,
        browserslistPath: options.browserslistPath,
        browserslistEnv: options.browserslistEnv
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
    // Basic validation of config values
    const expectedEcmaVersion = config.ecmaVersion;
    const files = [].concat(config.files || []);
    const esmodule = config.module;
    const allowHashBang = config.allowHashBang;
    const pathsToIgnore = [].concat(config.not || []);
    const looseGlobMatching = config.looseGlobMatching;
    const checkFeatures = config.checkFeatures;
    const checkForPolyfills = config.checkForPolyfills;

    // Get ignoreFile from either camelCase or kebab-case option
    const ignoreFilePath = config.ignoreFile || config['ignore-file'];

    // If ignoreFile is specified but doesn't exist, warn the user
    if (ignoreFilePath && !fs.existsSync(ignoreFilePath) && logger.isLevelEnabled('warn')) {
      logger.warn(`Warning: Ignore file '${ignoreFilePath}' does not exist or is not accessible`);
    }

    if (!expectedEcmaVersion && !config.checkBrowser) {
      logger.error('No ecmaScript version or checkBrowser option specified in configuration');
      process.exit(1);
    }

    if (!files.length) {
      logger.error('No files specified in configuration');
      process.exit(1);
    }

    if (looseGlobMatching && logger.isLevelEnabled('debug')) {
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

    const isBrowserslistCheck = config.checkBrowser || expectedEcmaVersion === 'checkBrowser';
    if (isBrowserslistCheck) {
      try {
        const { getESVersionFromBrowserslist } = require('./browserslist');
        const esVersionFromBrowserslist = getESVersionFromBrowserslist({
          browserslistQuery: config.browserslistQuery,
          browserslistPath: config.browserslistPath,
          browserslistEnv: config.browserslistEnv
        });

        // Override the ecmaVersion with the browserslist-determined version
        ecmaVersion = esVersionFromBrowserslist.toString();

        if (logger.isLevelEnabled('debug')) {
          logger.debug(`ES-Check: Using ES${ecmaVersion} based on browserslist configuration`);
        }
      } catch (err) {
        logger.error(`Error determining ES version from browserslist: ${err.message}`);
        process.exit(1);
      }
    } else {
      // Use the specified ES version
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
    }

    const errArray = []
    const acornOpts = { ecmaVersion: parseInt(ecmaVersion, 10), silent: true }

    if (logger.isLevelEnabled('debug')) {
      logger.debug(`ES-Check: Going to check files using version ${ecmaVersion}`)
    }

    if (esmodule) {
      acornOpts.sourceType = 'module'
      if (logger.isLevelEnabled('debug')) {
        logger.debug('ES-Check: esmodule is set')
      }
    }

    if (allowHashBang) {
      acornOpts.allowHashBang = true
      if (logger.isLevelEnabled('debug')) {
        logger.debug('ES-Check: allowHashBang is set')
      }
    }

    const expandedPathsToIgnore = pathsToIgnore.reduce((result, path) =>
      path.includes('*') ? result.concat(glob.sync(path, globOpts)) : result.concat(path)
    , [])

    const filterForIgnore = (globbedFiles) => {
      if (expandedPathsToIgnore && expandedPathsToIgnore.length > 0) {
        return globbedFiles.filter(
          (filePath) => !expandedPathsToIgnore.some((ignoreValue) => filePath.includes(ignoreValue))
        );
      }
      return globbedFiles;
    }

    const filteredFiles = filterForIgnore(allMatchedFiles)

    const ignoreList = parseIgnoreList(config);

    // Only log ignored features if debug logging is enabled and there are features to ignore
    if (ignoreList.size > 0 && logger.isLevelEnabled('debug')) {
      logger.debug('ES-Check: ignoring features:', Array.from(ignoreList).join(', '));
    }

    filteredFiles.forEach((file) => {
      const code = fs.readFileSync(file, 'utf8')
      if (logger.isLevelEnabled('debug')) {
        logger.debug(`ES-Check: checking ${file}`)
      }
      try {
        acorn.parse(code, acornOpts)
      } catch (err) {
        if (logger.isLevelEnabled('debug')) {
          logger.debug(`ES-Check: failed to parse file: ${file} \n - error: ${err}`)
        }
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

      // Run the standard feature detection
      const { foundFeatures, unsupportedFeatures } = detectFeatures(
        code,
        esVersion,
        parseSourceType,
        ignoreList
      );

      if (logger.isLevelEnabled('debug')) {
        const stringifiedFeatures = JSON.stringify(foundFeatures, null, 2);
        logger.debug(`Features found in ${file}: ${stringifiedFeatures}`);
      }

      // Check for polyfills if enabled
      let filteredUnsupportedFeatures = unsupportedFeatures;
      if (checkForPolyfills && unsupportedFeatures.length > 0) {
        // Lazy-load the polyfill detector only when needed
        if (!polyfillDetector) {
          polyfillDetector = require('./polyfillDetector');
        }

        // Detect polyfills in the code
        const polyfills = polyfillDetector.detectPolyfills(code, logger);

        // Filter out polyfilled features from unsupported features
        filteredUnsupportedFeatures = polyfillDetector.filterPolyfilled(unsupportedFeatures, polyfills);

        if (logger.isLevelEnabled('debug') && filteredUnsupportedFeatures.length !== unsupportedFeatures.length) {
          logger.debug(`ES-Check: Polyfills reduced unsupported features from ${unsupportedFeatures.length} to ${filteredUnsupportedFeatures.length}`);
        }
      }

      const isSupported = filteredUnsupportedFeatures.length === 0;
      if (!isSupported) {
        const error = new Error(`Unsupported features used: ${filteredUnsupportedFeatures.join(', ')} but your target is ES${ecmaVersion}.`);
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
      hasErrors = true;
      process.exit(1)
    }
    logger.info(`ES-Check: there were no ES version matching errors!  🎉`)
  }

  if (hasErrors) {
    process.exit(1);
  }
}

program.parse()
