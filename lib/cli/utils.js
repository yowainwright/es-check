const fs = require("fs");
const { BOOLEAN_FLAGS } = require("./constants");

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {};
  let positional = [];

  let i = 0;
  const hasMoreArgs = () => i < args.length;

  while (hasMoreArgs()) {
    const arg = args[i];

    const isLongOption = arg.startsWith("--");
    const isShortOption = arg.startsWith("-") && !arg.startsWith("--");

    if (isLongOption) {
      const optionParts = arg.slice(2).split("=");
      const hasEquals = optionParts.length > 1;
      if (hasEquals) {
        const [key, ...valueParts] = optionParts;
        options[key] = valueParts.join("=");
      } else {
        const key = optionParts[0];
        const isBooleanFlag = BOOLEAN_FLAGS.has(key);

        if (isBooleanFlag) {
          options[key] = true;
        } else {
          const nextArg = args[i + 1];
          const hasNextArg = nextArg !== undefined;
          const nextIsValue = hasNextArg && !nextArg.startsWith("-");

          if (nextIsValue) {
            options[key] = nextArg;
            i++;
          } else {
            options[key] = true;
          }
        }
      }
    } else if (isShortOption) {
      const flags = arg.slice(1);
      const lastFlag = flags[flags.length - 1];
      const otherFlags = flags.slice(0, -1);
      Object.assign(options, createBooleanOptions(otherFlags));

      const nextArg = args[i + 1];
      const hasNextArg = nextArg !== undefined;
      const isBooleanFlag = BOOLEAN_FLAGS.has(lastFlag);
      const nextIsValue = hasNextArg && !nextArg.startsWith("-") && !isBooleanFlag;

      if (nextIsValue) {
        options[lastFlag] = nextArg;
        i++;
      } else {
        options[lastFlag] = true;
      }
    } else {
      positional = positional.concat(arg);
    }

    i++;
  }

  return { options, positional };
}

function showHelp(version) {
  const help = `
ES Check v${version} - Check JavaScript files ES version against a specified ES version

USAGE:
  es-check <ecmaVersion> [files...]
  es-check completion [shell]

ARGUMENTS:
  ecmaVersion    ES version to check (es3, es5, es6, es2015-es2027, or checkBrowser)
  files          Glob patterns of files to check

OPTIONS:
  -V, --version                    Output version number
  -h, --help                       Display help
  --module                         Use ES modules
  --light                          Fast checking using pattern matching only
  --allowHashBang                  Treat #! as comment
  --typescript, -ts                Enable TypeScript file support
  --files <files>                  Files to check (comma-separated)
  --not <files>                    Files/folders to skip (comma-separated)
  --noColor                        Disable colors
  -v, --verbose                    Verbose mode (debug messages)
  --quiet                          Quiet mode (warnings and errors only)
  --silent                         Silent mode (no output)
  --looseGlobMatching              Don't fail if no files found
  --checkFeatures                  Check for ES version specific features
  --checkForPolyfills              Consider polyfills when checking features
  --ignorePolyfillable [library]   Ignore polyfillable features (optionally specify library: core-js)
  --ignore <features>              Features to ignore (comma-separated)
  --ignoreFile <path>              JSON file with features to ignore
  --allowList <features>           Features to allow (comma-separated)
  --checkBrowser                   Use browserslist config for ES version
  --browserslistQuery <query>      Custom browserslist query
  --browserslistPath <path>        Custom browserslist config path
  --browserslistEnv <env>          Browserslist environment (default: production)
  --config <path>                  Custom config file path
  --batchSize <number>             Files to process concurrently (0=unlimited)
  --noCache                        Disable file caching

EXAMPLES:
  es-check es5 './dist/**/*.js'
  es-check es6 './src/*.js' --module
  es-check es2020 './build/**/*.js' --checkFeatures
  es-check es2017 './dist/*.js' --checkFeatures --ignorePolyfillable=core-js
  es-check checkBrowser './dist/*.js' --browserslistQuery="last 2 versions"
  es-check es5 './dist/*.js' --not=./dist/vendor,./dist/legacy
  es-check es5 './src/**/*.{js,ts}' --typescript
  es-check es2020 './src/**/*.ts' --module -ts

COMPLETION:
  es-check completion          Generate bash completion
  es-check completion zsh      Generate zsh completion
`;
  console.log(help);
}

function showVersion(version) {
  console.log(version);
}

function buildConfig(ecmaVersionArg, filesArg, options, baseConfig) {
  const ignoreFilePath = options.ignoreFile || options["ignore-file"];
  const ignore = valueOrDefault(options.ignore, baseConfig.ignore);
  const ignoreFile = valueOrDefault(ignoreFilePath, baseConfig.ignoreFile);
  const not = parseOptionList(options.not, baseConfig.not);
  const allowList = valueOrDefault(options.allowList, baseConfig.allowList);
  const browserslistQuery = valueOrDefault(options.browserslistQuery, baseConfig.browserslistQuery);
  const browserslistPath = valueOrDefault(options.browserslistPath, baseConfig.browserslistPath);
  const browserslistEnv = valueOrDefault(options.browserslistEnv, baseConfig.browserslistEnv);
  const batchSize = valueOrDefault(options.batchSize, baseConfig.batchSize);
  const cache = resolveCacheOption(options, baseConfig);
  const light = valueOrDefault(options.light, baseConfig.light);

  const config = Object.assign({}, baseConfig, {
    module: options.module,
    allowHashBang: options.allowHashBang || options["allow-hash-bang"],
    typescript: options.typescript || options.ts,
    checkFeatures: options.checkFeatures,
    checkForPolyfills: options.checkForPolyfills,
    ignorePolyfillable: options.ignorePolyfillable,
    ignore,
    ignoreFile,
    not,
    looseGlobMatching: options.looseGlobMatching,
    allowList,
    checkBrowser: options.checkBrowser,
    browserslistQuery,
    browserslistPath,
    browserslistEnv,
    batchSize,
    cache,
    light,
  });

  const hasEcmaVersion = ecmaVersionArg !== undefined;
  if (hasEcmaVersion) {
    config.ecmaVersion = ecmaVersionArg;
  }

  const hasFilesArg = filesArg?.length > 0;
  const hasFilesOption = options.files !== undefined;
  const shouldUseFilesOption = !hasFilesArg && hasFilesOption;

  if (hasFilesArg) {
    config.files = filesArg;
  }

  if (shouldUseFilesOption) {
    config.files = parseCommaList(options.files);
  }

  return config;
}

function warnAboutIgnoreFile(ignoreFilePath, logger) {
  const ignoreFileExists = fs.existsSync(ignoreFilePath);
  const hasIgnoreFile = ignoreFilePath !== undefined && ignoreFilePath !== null;
  const isWarn = logger.isLevelEnabled("warn");
  const shouldWarn = hasIgnoreFile && !ignoreFileExists && isWarn;

  if (shouldWarn) {
    logger.warn(`Warning: Ignore file '${ignoreFilePath}' does not exist or is not accessible`);
  }
}

function getCompletionScript(shell, commands, options) {
  const isBash = shell === "bash";
  if (isBash) return generateBashCompletion("es-check", commands, options);

  const isZsh = shell === "zsh";
  if (isZsh) return generateZshCompletion("es-check", commands, options);

  return null;
}

function parseIgnoreList(options) {
  if (!options) {
    return new Set();
  }

  const ignoreList = new Set();

  if (options.ignore) {
    if (options.ignore.trim() === "") {
      return ignoreList;
    }

    options.ignore.split(",").forEach((feature) => {
      const trimmed = feature.trim();
      if (trimmed) {
        ignoreList.add(trimmed);
      }
    });
  }

  if (options.allowList) {
    if (options.allowList.trim() === "") {
      return ignoreList;
    }

    options.allowList.split(",").forEach((feature) => {
      const trimmed = feature.trim();
      if (trimmed) {
        ignoreList.add(trimmed);
      }
    });
  }

  const ignoreFilePath = options.ignoreFile || options["ignore-file"];

  if (!ignoreFilePath) {
    return ignoreList;
  }

  try {
    if (!fs.existsSync(ignoreFilePath)) {
      throw new Error(`Ignore file not found: ${ignoreFilePath}`);
    }

    const fileContent = fs.readFileSync(ignoreFilePath, "utf8");

    if (!fileContent.trim()) {
      return ignoreList;
    }

    const ignoreConfig = JSON.parse(fileContent);

    if (!ignoreConfig) {
      return ignoreList;
    }

    if (Array.isArray(ignoreConfig.features)) {
      ignoreConfig.features.forEach((feature) => {
        const isStringFeature = feature && typeof feature === "string";
        if (isStringFeature) {
          ignoreList.add(feature.trim());
        }
      });
    }
  } catch (err) {
    throw new Error(`Failed to parse ignore file: ${err.message}`);
  }

  return ignoreList;
}

function generateBashCompletion(cmdName, commands, options) {
  const cmdsStr = commands.join(" ");
  const optsStr = options.map((opt) => "--" + opt).join(" ");

  return `
# es-check bash completion script
# Install by adding to ~/.bashrc:
# source /path/to/es-check-completion.bash

_${cmdName.replace(/-/g, "_")}_completion() {
  local cur prev opts cmds
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  cmds="${cmdsStr}"
  opts="${optsStr}"
  es_versions="es3 es5 es6 es2015 es7 es2016 es8 es2017 es9 es2018 es10 es2019 es11 es2020 es12 es2021 es13 es2022 es14 es2023 es15 es2024 es16 es2025 es17 es2026 es18 es2027"

  case "$prev" in
    ${cmdName})
      COMPREPLY=( $(compgen -W "$es_versions $cmds $opts" -- "$cur") )
      return 0
      ;;
    completion)
      COMPREPLY=( $(compgen -W "bash zsh" -- "$cur") )
      return 0
      ;;
    *)
      if [[ "$cur" == -* ]]; then
        COMPREPLY=( $(compgen -W "$opts" -- "$cur") )
      else
        COMPREPLY=( $(compgen -f -- "$cur") )
      fi
      return 0
      ;;
  esac
}

complete -F _${cmdName.replace(/-/g, "_")}_completion ${cmdName}
`;
}

function generateZshCompletion(cmdName, commands, options) {
  const optionsStr = options.map((opt) => `"--${opt}[Option description]"`).join("\n    ");
  const commandsStr = commands.map((cmd) => `"${cmd}:Command description"`).join("\n    ");

  return `
#compdef ${cmdName}

_${cmdName.replace(/-/g, "_")}() {
  local -a commands options es_versions

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
    "es17:ECMAScript 2026"
    "es2026:ECMAScript 2026"
    "es18:ECMAScript 2027"
    "es2027:ECMAScript 2027"
  )

  commands=(
    ${commandsStr}
  )

  options=(
    ${optionsStr}
  )

  _arguments -C \\
    "1: :{_describe 'es version or command' es_versions commands}" \\
    "*::arg:->args" \\
    $options && return 0

  case $state in
    args)
      _files
      ;;
  esac
}

_${cmdName.replace(/-/g, "_")} "$@"
`;
}

function determineInvocationType(loggerOrOptions) {
  if (!loggerOrOptions) {
    return { isNodeAPI: true, logger: null };
  }

  const hasLoggerMethods = loggerOrOptions.info || loggerOrOptions.error;
  const isOptionsObject = typeof loggerOrOptions === "object" && !hasLoggerMethods;

  if (isOptionsObject) {
    return { isNodeAPI: true, logger: loggerOrOptions.logger || null };
  }

  return { isNodeAPI: false, logger: loggerOrOptions };
}

function handleESVersionError(options) {
  const { errorMessage, logger, isNodeAPI, allErrors, file = "config" } = options;

  if (logger) {
    logger.error(errorMessage);
  }

  if (!isNodeAPI) {
    process.exit(1);
    return { shouldContinue: false, hasErrors: true };
  } else {
    appendError(allErrors, {
      err: new Error(errorMessage),
      file,
    });
    return { shouldContinue: true, hasErrors: true };
  }
}

function parseOptionList(value, defaultValue) {
  if (!value) return defaultValue;
  return parseCommaList(value);
}

function resolveCacheOption(options, baseConfig) {
  if (options.noCache) return false;
  return valueOrDefault(baseConfig.cache, true);
}

function parseCommaList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function valueOrDefault(value, defaultValue) {
  if (value !== undefined) return value;
  return defaultValue;
}

function createBooleanOptions(flags) {
  return flags.split("").reduce((nextOptions, flag) => {
    nextOptions[flag] = true;
    return nextOptions;
  }, {});
}

function appendError(allErrors, error) {
  allErrors[allErrors.length] = error;
}

module.exports = {
  parseArgs,
  showHelp,
  showVersion,
  buildConfig,
  warnAboutIgnoreFile,
  getCompletionScript,
  parseIgnoreList,
  generateBashCompletion,
  generateZshCompletion,
  determineInvocationType,
  handleESVersionError,
};
