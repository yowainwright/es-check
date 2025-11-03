const fs = require("fs");

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
        if (feature && typeof feature === "string") {
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

  /* eslint-disable no-useless-escape */
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
  es_versions="es3 es5 es6 es2015 es7 es2016 es8 es2017 es9 es2018 es10 es2019 es11 es2020 es12 es2021 es13 es2022 es14 es2023 es15 es2024 es16 es2025"

  case "\$prev" in
    ${cmdName})
      COMPREPLY=( \$(compgen -W "\$es_versions \$cmds \$opts" -- "\$cur") )
      return 0
      ;;
    completion)
      COMPREPLY=( \$(compgen -W "bash zsh" -- "\$cur") )
      return 0
      ;;
    *)
      if [[ "\$cur" == -* ]]; then
        COMPREPLY=( \$(compgen -W "\$opts" -- "\$cur") )
      else
        COMPREPLY=( \$(compgen -f -- "\$cur") )
      fi
      return 0
      ;;
  esac
}

complete -F _${cmdName.replace(/-/g, "_")}_completion ${cmdName}
`;
  /* eslint-enable no-useless-escape */
}

function generateZshCompletion(cmdName, commands, options) {
  const optionsStr = options
    .map((opt) => `"--${opt}[Option description]"`)
    .join("\n    ");
  const commandsStr = commands
    .map((cmd) => `"${cmd}:Command description"`)
    .join("\n    ");

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

  if (typeof loggerOrOptions === "object" && !hasLoggerMethods) {
    return { isNodeAPI: true, logger: loggerOrOptions.logger || null };
  }

  return { isNodeAPI: false, logger: loggerOrOptions };
}

function handleESVersionError(options) {
  const {
    errorMessage,
    logger,
    isNodeAPI,
    allErrors,
    file = "config",
  } = options;

  if (logger) {
    logger.error(errorMessage);
  }

  if (!isNodeAPI) {
    process.exit(1);
    return { shouldContinue: false, hasErrors: true };
  } else {
    allErrors.push({
      err: new Error(errorMessage),
      file,
    });
    return { shouldContinue: true, hasErrors: true };
  }
}

module.exports = {
  parseIgnoreList,
  generateBashCompletion,
  generateZshCompletion,
  determineInvocationType,
  handleESVersionError,
};
