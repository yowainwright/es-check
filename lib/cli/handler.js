const fs = require("fs");
const { loadConfig } = require("../config");
const { runChecks } = require("../check-runner");
const {
  createLogger,
  generateBashCompletion,
  generateZshCompletion,
} = require("../helpers");
const { JS_VERSIONS } = require("../constants/versions");
const { SUPPORTED_SHELLS, COMPLETION_OPTIONS } = require("./constants");

function buildConfig(ecmaVersionArg, filesArg, options, baseConfig) {
  const ignoreFilePath = options.ignoreFile || options["ignore-file"];

  const config = {
    ...baseConfig,
    module: options.module,
    allowHashBang: options.allowHashBang || options["allow-hash-bang"],
    typescript: options.typescript || options.ts,
    checkFeatures: options.checkFeatures,
    checkForPolyfills: options.checkForPolyfills,
    ignorePolyfillable: options.ignorePolyfillable,
    ignore: options.ignore !== undefined ? options.ignore : baseConfig.ignore,
    ignoreFile:
      ignoreFilePath !== undefined ? ignoreFilePath : baseConfig.ignoreFile,
    not: options.not
      ? options.not
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean)
      : baseConfig.not,
    looseGlobMatching: options.looseGlobMatching,
    allowList:
      options.allowList !== undefined
        ? options.allowList
        : baseConfig.allowList,
    checkBrowser: options.checkBrowser,
    browserslistQuery:
      options.browserslistQuery !== undefined
        ? options.browserslistQuery
        : baseConfig.browserslistQuery,
    browserslistPath:
      options.browserslistPath !== undefined
        ? options.browserslistPath
        : baseConfig.browserslistPath,
    browserslistEnv:
      options.browserslistEnv !== undefined
        ? options.browserslistEnv
        : baseConfig.browserslistEnv,
    batchSize:
      options.batchSize !== undefined
        ? options.batchSize
        : baseConfig.batchSize,
    cache: options.noCache
      ? false
      : baseConfig.cache !== undefined
        ? baseConfig.cache
        : true,
    light: options.light !== undefined ? options.light : baseConfig.light,
  };

  const hasEcmaVersion = ecmaVersionArg !== undefined;
  if (hasEcmaVersion) {
    config.ecmaVersion = ecmaVersionArg;
  }

  const hasFilesArg = filesArg?.length > 0;
  const hasFilesOption = options.files !== undefined;

  if (hasFilesArg) {
    config.files = filesArg;
  }

  if (!hasFilesArg && hasFilesOption) {
    config.files = options.files
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
  }

  return config;
}

function warnAboutIgnoreFile(ignoreFilePath, logger) {
  const ignoreFileExists = fs.existsSync(ignoreFilePath);
  const hasIgnoreFile = ignoreFilePath !== undefined && ignoreFilePath !== null;
  const isWarn = logger.isLevelEnabled("warn");
  const shouldWarn = hasIgnoreFile && !ignoreFileExists && isWarn;

  if (shouldWarn) {
    logger.warn(
      `Warning: Ignore file '${ignoreFilePath}' does not exist or is not accessible`,
    );
  }
}

async function handleMainCommand(ecmaVersionArg, filesArg, options) {
  const logger = createLogger(options);

  const hasBothFilesInputs = filesArg?.length > 0 && options.files;
  if (hasBothFilesInputs) {
    logger.error(
      "Cannot pass in both [files...] argument and --files flag at the same time!",
    );
    process.exit(1);
  }

  const validEcmaVersionValues = new Set(JS_VERSIONS);
  const isCheckBrowser = options.checkBrowser;
  const hasEcmaVersion = ecmaVersionArg !== undefined;
  const isInvalidEcmaVersion =
    hasEcmaVersion && !validEcmaVersionValues.has(ecmaVersionArg);
  const shouldTreatAsFile = isCheckBrowser && isInvalidEcmaVersion;

  let adjustedEcmaVersion = ecmaVersionArg;
  let adjustedFiles = filesArg;

  if (shouldTreatAsFile) {
    adjustedFiles = [ecmaVersionArg, ...filesArg];
    adjustedEcmaVersion = "checkBrowser";
  }

  const configs = await loadConfig(options.config);
  const baseConfig = configs[0] || {};

  const hasCommandLineArgs =
    adjustedEcmaVersion || adjustedFiles?.length || options.files;

  if (hasCommandLineArgs) {
    const ignoreFilePath = options.ignoreFile || options["ignore-file"];
    warnAboutIgnoreFile(ignoreFilePath, logger);

    const singleConfig = buildConfig(
      adjustedEcmaVersion,
      adjustedFiles,
      options,
      baseConfig,
    );
    return runChecks([singleConfig], logger);
  }

  const hasNoConfigs = configs.length === 0;
  if (hasNoConfigs) {
    logger.error(
      "No configuration found. Please provide command line arguments or a config file.",
    );
    process.exit(1);
  }

  return runChecks(configs, logger);
}

function handleCompletionCommand(shell) {
  const logger = createLogger();

  const isSupportedShell = SUPPORTED_SHELLS.includes(shell);

  if (!isSupportedShell) {
    logger.error(
      `Shell "${shell}" not supported for completion. Supported shells: ${SUPPORTED_SHELLS.join(", ")}`,
    );
    process.exit(1);
  }

  const commands = ["completion"];
  const options = COMPLETION_OPTIONS;

  const isBash = shell === "bash";
  const isZsh = shell === "zsh";

  const completionScript = isBash
    ? generateBashCompletion("es-check", commands, options)
    : isZsh
      ? generateZshCompletion("es-check", commands, options)
      : null;

  logger.info(completionScript);
}

module.exports = {
  handleMainCommand,
  handleCompletionCommand,
  buildConfig,
  warnAboutIgnoreFile,
};
