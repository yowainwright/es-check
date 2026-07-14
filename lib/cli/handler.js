const fs = require("fs");
const { loadConfig } = require("../config");
const { runChecks } = require("../check-runner");
const { createLogger, generateBashCompletion, generateZshCompletion } = require("../helpers");
const { JS_VERSIONS } = require("../constants/versions");
const { SUPPORTED_SHELLS, COMPLETION_OPTIONS } = require("./constants");

function valueOrDefault(value, defaultValue) {
  if (value !== undefined) return value;
  return defaultValue;
}

function parseCommaList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionList(value, defaultValue) {
  if (!value) return defaultValue;
  return parseCommaList(value);
}

function resolveCacheOption(options, baseConfig) {
  if (options.noCache) return false;
  return valueOrDefault(baseConfig.cache, true);
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

async function handleMainCommand(ecmaVersionArg, filesArg, options) {
  const logger = createLogger(options);

  const hasBothFilesInputs = filesArg?.length > 0 && options.files;
  if (hasBothFilesInputs) {
    logger.error("Cannot pass in both [files...] argument and --files flag at the same time!");
    process.exit(1);
  }

  const validEcmaVersionValues = new Set(JS_VERSIONS);
  const isCheckBrowser = options.checkBrowser;
  const hasEcmaVersion = ecmaVersionArg !== undefined;
  const isInvalidEcmaVersion = hasEcmaVersion && !validEcmaVersionValues.has(ecmaVersionArg);
  const shouldTreatAsFile = isCheckBrowser && isInvalidEcmaVersion;

  let adjustedEcmaVersion = ecmaVersionArg;
  let adjustedFiles = filesArg;

  if (shouldTreatAsFile) {
    adjustedFiles = [ecmaVersionArg].concat(filesArg);
    adjustedEcmaVersion = "checkBrowser";
  }

  const configs = await loadConfig(options.config);
  const baseConfig = configs[0] || {};

  const hasCommandLineArgs = adjustedEcmaVersion || adjustedFiles?.length || options.files;

  if (hasCommandLineArgs) {
    const ignoreFilePath = options.ignoreFile || options["ignore-file"];
    warnAboutIgnoreFile(ignoreFilePath, logger);

    const singleConfig = buildConfig(adjustedEcmaVersion, adjustedFiles, options, baseConfig);
    return runChecks([singleConfig], logger);
  }

  const hasNoConfigs = configs.length === 0;
  if (hasNoConfigs) {
    logger.error("No configuration found. Please provide command line arguments or a config file.");
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

  const completionScript = getCompletionScript(shell, commands, options);

  logger.info(completionScript);
}

function getCompletionScript(shell, commands, options) {
  const isBash = shell === "bash";
  if (isBash) return generateBashCompletion("es-check", commands, options);

  const isZsh = shell === "zsh";
  if (isZsh) return generateZshCompletion("es-check", commands, options);

  return null;
}

module.exports = {
  handleMainCommand,
  handleCompletionCommand,
  buildConfig,
  warnAboutIgnoreFile,
};
