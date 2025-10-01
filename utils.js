const fs = require('fs');
const winston = require('winston');
const supportsColor = require('supports-color');

/**
 * Parse ignore list from options
 * @param {Object} options - Options object
 * @param {string} [options.ignore] - Comma-separated list of features to ignore
 * @param {string} [options.ignoreFile] - Path to JSON file containing features to ignore
 * @returns {Set<string>} Set of features to ignore
 */
function parseIgnoreList(options) {
  if (!options) {
    return new Set();
  }

  const ignoreList = new Set();

  if (options.ignore) {
    if (options.ignore.trim() === '') {
      return ignoreList;
    }

    options.ignore.split(',').forEach(feature => {
      const trimmed = feature.trim();
      if (trimmed) {
        ignoreList.add(trimmed);
      }
    });
  }

  if (options.allowList) {
    if (options.allowList.trim() === '') {
      return ignoreList;
    }

    options.allowList.split(',').forEach(feature => {
      const trimmed = feature.trim();
      if (trimmed) {
        ignoreList.add(trimmed);
      }
    });
  }

  const ignoreFilePath = options.ignoreFile || options['ignore-file'];

  if (!ignoreFilePath) {
    return ignoreList;
  }

  try {
    if (!fs.existsSync(ignoreFilePath)) {
      throw new Error(`Ignore file not found: ${ignoreFilePath}`);
    }

    const fileContent = fs.readFileSync(ignoreFilePath, 'utf8');

    if (!fileContent.trim()) {
      return ignoreList;
    }

    const ignoreConfig = JSON.parse(fileContent);

    if (!ignoreConfig) {
      return ignoreList;
    }

    if (Array.isArray(ignoreConfig.features)) {
      ignoreConfig.features.forEach(feature => {
        if (feature && typeof feature === 'string') {
          ignoreList.add(feature.trim());
        }
      });
    }
  } catch (err) {
    throw new Error(`Failed to parse ignore file: ${err.message}`);
  }

  return ignoreList;
}

function checkVarKindMatch(node, astInfo) {
  if (!astInfo.kind) return false;
  return node.kind === astInfo.kind;
}

function checkCalleeMatch(node, astInfo) {
  if (!astInfo.callee) return false;
  if (!node.callee) return false;
  if (node.callee.type !== 'Identifier') return false;
  return node.callee.name === astInfo.callee;
}

function checkOperatorMatch(node, astInfo) {
  if (!astInfo.operator) return false;
  return node.operator === astInfo.operator;
}

function checkDefault() {
  return true;
}

const checkMap = {
  VariableDeclaration: checkVarKindMatch,
  LogicalExpression: checkOperatorMatch,
  ArrowFunctionExpression: checkDefault,
  CallExpression: (node, astInfo) => {
    if (node.callee.type === 'MemberExpression') {
      if (astInfo.object && astInfo.property) {
        return (
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === astInfo.object &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === astInfo.property
        );
      } else if (astInfo.property) {
        if (
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === astInfo.property
        ) {
          if (astInfo.excludeObjects && node.callee.object.type === 'Identifier') {
            const objectName = node.callee.object.name;
            if (astInfo.excludeObjects.includes(objectName)) {
              return false;
            }
          }
          return true;
        }
        return false;
      }

      return false;
    } else if (node.callee.type === 'Identifier') {
      const { callee } = astInfo;
      if (callee && node.callee.name === callee) {
        return true;
      }
    }
    return false;
  },
  NewExpression: (node, astInfo) => {
    if (!astInfo.callee) {
      return false;
    }

    if (!node.callee || node.callee.type !== 'Identifier') {
      return false;
    }

    if (node.callee.name !== astInfo.callee) {
      return false;
    }

    if (astInfo.hasOptionsCause) {
      if (!node.arguments || node.arguments.length < 2) {
        return false;
      }

      const secondArg = node.arguments[1];
      if (secondArg.type !== 'ObjectExpression') {
        return false;
      }

      return secondArg.properties.some(prop =>
        prop.key &&
        prop.key.type === 'Identifier' &&
        prop.key.name === 'cause'
      );
    }

    return true;
  },
  default: () => false
};

/**
 * Create a configured logger instance
 * @param {Object} options - Options object
 * @param {boolean} [options.noColor] - Disable color output
 * @param {boolean} [options['no-color']] - Disable color output (kebab-case alternative)
 * @param {boolean} [options.verbose] - Enable verbose logging
 * @param {boolean} [options.quiet] - Enable quiet mode (only warnings and errors)
 * @param {boolean} [options.silent] - Disable all output
 * @returns {winston.Logger} Configured logger instance
 */
function createLogger(options = {}) {
  const noColor = options?.noColor || options?.['no-color'] || false;
  const level = options?.verbose ? 'debug' : options?.quiet ? 'warn' : 'info';

  return winston.createLogger({
    transports: [
      new winston.transports.Console({
        silent: options.silent || false,
        level,
        stderrLevels: ['error', 'warn'],
        format: winston.format.combine(
          ...(supportsColor.stdout && !noColor ? [winston.format.colorize()] : []),
          winston.format.simple(),
        ),
      })
    ]
  });
}

/**
 * Generate bash completion script for es-check
 * @param {string} cmdName - Command name
 * @param {string[]} commands - List of subcommands
 * @param {string[]} options - List of options
 * @returns {string} Bash completion script
 */
function generateBashCompletion(cmdName, commands, options) {
  const cmdsStr = commands.join(' ');
  const optsStr = options.map(opt => '--' + opt).join(' ');

  return `
# es-check bash completion script
# Install by adding to ~/.bashrc:
# source /path/to/es-check-completion.bash

_${cmdName.replace(/-/g, '_')}_completion() {
  local cur prev opts cmds
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  # List of commands
  cmds="${cmdsStr}"

  # List of options
  opts="${optsStr}"

  # ES versions
  es_versions="es3 es5 es6 es2015 es7 es2016 es8 es2017 es9 es2018 es10 es2019 es11 es2020 es12 es2021 es13 es2022 es14 es2023 es15 es2024 es16 es2025"

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

complete -F _${cmdName.replace(/-/g, '_')}_completion ${cmdName}
`;
}

/**
 * Generate zsh completion script for es-check
 * @param {string} cmdName - Command name
 * @param {string[]} commands - List of subcommands
 * @param {string[]} options - List of options
 * @returns {string} Zsh completion script
 */
function generateZshCompletion(cmdName, commands, options) {
  const optionsStr = options.map(opt => `"--${opt}[Option description]"`).join('\n    ');
  const commandsStr = commands.map(cmd => `"${cmd}:Command description"`).join('\n    ');

  return `
#compdef ${cmdName}

_${cmdName.replace(/-/g, '_')}() {
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
    "es15:ECMAScript 2024"
    "es2024:ECMAScript 2024"
    "es16:ECMAScript 2025"
    "es2025:ECMAScript 2025"
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

_${cmdName.replace(/-/g, '_')}
`;
}

/**
 * Process files in batches for better performance
 * @param {string[]} files - Array of file paths to process
 * @param {Function} processor - Async function to process each file
 * @param {number} batchSize - Number of files to process concurrently (0 for unlimited)
 * @returns {Promise<Array>} Array of results from processing all files
 */
async function processBatchedFiles(files, processor, batchSize = 0) {
  if (batchSize <= 0) {
    return Promise.all(files.map(processor));
  }
  
  const results = [];
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  
  return results;
}

const SimpleCache = require('./cache');
const fileCache = new SimpleCache(500, 60000);

/**
 * Read file asynchronously with error handling
 * @param {string} file - File path to read
 * @param {Object} fs - File system module
 * @param {boolean} useCache - Whether to use file cache (default: false)
 * @returns {Promise<{content: string, error: null} | {content: null, error: Object}>}
 */
async function readFileAsync(file, fs, useCache = false) {
  if (useCache) {
    const cached = fileCache.get(file);
    if (cached !== undefined) {
      return cached;
    }
  }
  
  try {
    const content = await fs.promises.readFile(file, 'utf8');
    const result = { content, error: null };
    
    if (useCache) {
      fileCache.set(file, result);
    }
    
    return result;
  } catch (err) {
    const result = { 
      content: null, 
      error: {
        err,
        file,
        stack: err.stack
      }
    };
    
    if (useCache) {
      fileCache.set(file, result);
    }
    
    return result;
  }
}

/**
 * Clear the file cache
 */
function clearFileCache() {
  fileCache.clear();
}

/**
 * Get file cache statistics
 */
function getFileCacheStats() {
  return fileCache.getStats();
}

const ECMA_VERSION_MAP = {
  5: 'es5',
  6: 'es2015',
  7: 'es2016',
  8: 'es2017',
  9: 'es2018',
  10: 'es2019',
  11: 'es2020',
  12: 'es2021',
  13: 'es2022',
  14: 'es2023',
  15: 'es2024',
  16: 'es2025',
  2015: 'es2015',
  2016: 'es2016',
  2017: 'es2017',
  2018: 'es2018',
  2019: 'es2019',
  2020: 'es2020',
  2021: 'es2021',
  2022: 'es2022',
  2023: 'es2023',
  2024: 'es2024',
  2025: 'es2025',
  es5: 'es5',
  es6: 'es2015',
  es7: 'es2016',
  es8: 'es2017',
  es9: 'es2018',
  es10: 'es2019',
  es11: 'es2020',
  es12: 'es2021',
  es13: 'es2022',
  es14: 'es2023',
  es15: 'es2024',
  es16: 'es2025',
  es2015: 'es2015',
  es2016: 'es2016',
  es2017: 'es2017',
  es2018: 'es2018',
  es2019: 'es2019',
  es2020: 'es2020',
  es2021: 'es2021',
  es2022: 'es2022',
  es2023: 'es2023',
  es2024: 'es2024',
  es2025: 'es2025'
};

/**
 * Convert ecmaVersion to fast-brake target format
 * @param {number|string} ecmaVersion - Version from acorn options
 * @returns {string} Target version for fast-brake
 */
function getTargetVersion(ecmaVersion) {
  return ECMA_VERSION_MAP[ecmaVersion] || 'es5';
}

/**
 * Parse code with Acorn and handle errors
 * @param {string} code - Code to parse
 * @param {Object} acornOpts - Parsing options
 * @param {Object} acorn - Acorn parser instance
 * @param {string} file - File path for error reporting
 * @returns {{ast: Object, error: null} | {ast: null, error: Object}}
 */
function parseCode(code, acornOpts, acorn, file) {
  try {
    const ast = acorn.parse(code, acornOpts);
    return { ast, error: null };
  } catch (err) {
    return {
      ast: null,
      error: {
        err,
        stack: err.stack,
        file
      }
    };
  }
}

function determineInvocationType(loggerOrOptions) {
  if (!loggerOrOptions) {
    return { isNodeAPI: true, logger: null };
  }
  
  const hasLoggerMethods = loggerOrOptions.info || loggerOrOptions.error;
  
  if (typeof loggerOrOptions === 'object' && !hasLoggerMethods) {
    return { isNodeAPI: true, logger: loggerOrOptions.logger || null };
  }
  
  return { isNodeAPI: false, logger: loggerOrOptions };
}

/**
 * Determine log levels based on logger capabilities
 * @param {Object|null} logger - Logger object
 * @returns {Object|null} Object with log level flags or null if no logger
 */
function determineLogLevel(logger) {
  if (!logger || !logger.isLevelEnabled) {
    return null;
  }
  
  return {
    isDebug: logger.isLevelEnabled('debug'),
    isWarn: logger.isLevelEnabled('warn'),
    isInfo: logger.isLevelEnabled('info'),
    isError: logger.isLevelEnabled('error')
  };
}

/**
 * Handle ES version errors uniformly for different error types
 * @param {Object} options - Options object
 * @param {string} options.errorType - Type of error ('browserslist', 'es3', 'default')
 * @param {string} options.errorMessage - Error message to display
 * @param {Object|null} options.logger - Logger object
 * @param {boolean} options.isNodeAPI - Whether running as Node API
 * @param {Array} options.allErrors - Array to collect errors
 * @param {string} [options.file='config'] - File reference for error
 * @returns {{shouldContinue: boolean, hasErrors: boolean}}
 */
function handleESVersionError(options) {
  const { errorType, errorMessage, logger, isNodeAPI, allErrors, file = 'config' } = options;
  
  if (logger) {
    logger.error(errorMessage);
  }
  
  if (!isNodeAPI) {
    process.exit(1);
    return { shouldContinue: false, hasErrors: true };
  } else {
    allErrors.push({ 
      err: new Error(errorMessage), 
      file 
    });
    return { shouldContinue: true, hasErrors: true };
  }
}

const { fastBrakeSync } = require('fast-brake/sync');
const esversionPlugin = require('fast-brake/plugins/esversion');
const fastbrake = fastBrakeSync({ plugins: [esversionPlugin.default] });

function parseLightMode(code, ecmaVersion, isModule, allowHashBang, file) {
  const targetVersion = getTargetVersion(ecmaVersion);

  const codeToCheck = allowHashBang && code.startsWith('#!')
    ? code.slice(code.indexOf('\n') + 1)
    : code;

  try {
    const isCompatible = fastbrake.check(codeToCheck, {
      target: targetVersion,
      sourceType: isModule ? 'module' : 'script'
    });

    if (!isCompatible) {
      return {
        error: {
          err: new Error(`Code contains features incompatible with ${targetVersion}`),
          stack: '',
          file
        }
      };
    }

    return { error: null };
  } catch (err) {
    return {
      error: {
        err: new Error(`Failed to check code in light mode: ${err.message}`),
        stack: err.stack || '',
        file
      }
    };
  }
}

module.exports = {
  parseIgnoreList,
  checkVarKindMatch,
  checkCalleeMatch,
  checkOperatorMatch,
  checkDefault,
  checkMap,
  createLogger,
  generateBashCompletion,
  generateZshCompletion,
  processBatchedFiles,
  readFileAsync,
  clearFileCache,
  getFileCacheStats,
  parseCode,
  parseLightMode,
  determineInvocationType,
  determineLogLevel,
  handleESVersionError
};
