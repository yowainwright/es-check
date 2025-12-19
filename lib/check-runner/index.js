const fs = require("fs");
const { parseIgnoreList, processBatchedFiles } = require("../helpers");
const { determineInvocationType } = require("../cli/utils");
const {
  parseFilePatterns,
  validateConfig,
  findFiles,
  determineEcmaVersion,
  filterIgnoredFiles,
  createFileProcessor,
  processConfigResult,
} = require("./utils");

function determineLogLevel(logger) {
  const hasLogger = logger !== null && logger !== undefined;
  if (!hasLogger) return { isDebug: false, isWarn: false };

  const hasIsLevelEnabled = typeof logger.isLevelEnabled === "function";
  if (!hasIsLevelEnabled) return { isDebug: false, isWarn: false };

  return {
    isDebug: logger.isLevelEnabled("debug"),
    isWarn: logger.isLevelEnabled("warn"),
  };
}

async function processConfig(config, context) {
  const { logger, isDebug, isWarn, isNodeAPI, allErrors } = context;

  const ignoreFilePath = config.ignoreFile || config["ignore-file"];
  const ignoreFileExists = ignoreFilePath && fs.existsSync(ignoreFilePath);
  const shouldWarnAboutIgnoreFile =
    ignoreFilePath && !ignoreFileExists && isWarn;

  if (shouldWarnAboutIgnoreFile) {
    logger.warn(
      `Warning: Ignore file '${ignoreFilePath}' does not exist or is not accessible`,
    );
  }

  const validationResult = validateConfig(config, {
    logger,
    isNodeAPI,
    allErrors,
  });
  if (!validationResult.isValid) {
    return { hasErrors: true, shouldContinue: true };
  }

  const patternsToGlob = parseFilePatterns(config.files);
  const shouldDebugLooseGlob = config.looseGlobMatching && isDebug;

  if (shouldDebugLooseGlob) {
    logger.debug("ES-Check: loose-glob-matching is set");
  }

  const globOpts = { nodir: true };
  const findFilesResult = findFiles(patternsToGlob, {
    globOpts,
    looseGlobMatching: config.looseGlobMatching,
    logger,
    isNodeAPI,
    allErrors,
  });

  if (findFilesResult.hasError) {
    return { hasErrors: true, shouldContinue: true };
  }

  const versionResult = determineEcmaVersion(config, {
    logger,
    isDebug,
    isWarn,
    isNodeAPI,
    allErrors,
  });

  if (versionResult.hasError) {
    return { hasErrors: true, shouldContinue: true };
  }

  const { ecmaVersion } = versionResult;
  const useLatestForParsing = config.checkFeatures;
  const parserEcmaVersion = useLatestForParsing ? 2025 : parseInt(ecmaVersion, 10);
  const acornOpts = { ecmaVersion: parserEcmaVersion, silent: true };

  if (isDebug) {
    logger.debug(`ES-Check: Going to check files using version ${ecmaVersion}`);
  }

  const isModule = config.module;
  if (isModule) {
    acornOpts.sourceType = "module";
    if (isDebug) logger.debug("ES-Check: esmodule is set");
  }

  const allowsHashBang = config.allowHashBang;
  if (allowsHashBang) {
    acornOpts.allowHashBang = true;
    if (isDebug) logger.debug("ES-Check: allowHashBang is set");
  }

  const pathsToIgnore = [].concat(config.not || []);
  const filteredFiles = filterIgnoredFiles(
    findFilesResult.files,
    pathsToIgnore,
    globOpts,
  );

  const ignoreList = parseIgnoreList(config);
  const hasIgnores = ignoreList.size > 0;
  const shouldDebugIgnores = hasIgnores && isDebug;

  if (shouldDebugIgnores) {
    logger.debug(
      "ES-Check: ignoring features:",
      Array.from(ignoreList).join(", "),
    );
  }

  const fileCount = filteredFiles.length;
  const hasLogger = logger !== null && logger !== undefined;

  if (hasLogger && fileCount > 0) {
    logger.info(
      `ES-Check: checking ${fileCount} file${fileCount === 1 ? "" : "s"}...`,
    );
  }

  const batchSize = parseInt(config.batchSize || "0", 10);
  const processFile = createFileProcessor(config, {
    acornOpts,
    ignoreList,
    logger,
    isDebug,
    ecmaVersion,
  });

  const results = await processBatchedFiles(
    filteredFiles,
    processFile,
    batchSize,
  );
  const errors = results.filter((result) => result !== null);

  return await processConfigResult(
    errors,
    logger,
    isNodeAPI,
    allErrors,
    ecmaVersion,
  );
}

async function runChecks(configs, loggerOrOptions) {
  const { isNodeAPI, logger } = determineInvocationType(loggerOrOptions);

  const logLevels = determineLogLevel(logger);
  const isDebug = logLevels?.isDebug || false;
  const isWarn = logLevels?.isWarn || false;

  const allErrors = [];
  const context = { logger, isDebug, isWarn, isNodeAPI, allErrors };

  const results = [];
  for (const config of configs) {
    const result = await processConfig(config, context);
    results.push(result);

    const shouldBreak = result.hasErrors && !result.shouldContinue;
    if (shouldBreak) break;
  }

  const hasErrors = results.some((r) => r.hasErrors);
  const isExiting = hasErrors && !isNodeAPI;
  const isContinuing = hasErrors && isNodeAPI;
  const isSuccess = !hasErrors && isNodeAPI;

  if (isExiting) process.exit(1);
  if (isContinuing) return { success: false, errors: allErrors };
  if (isSuccess) return { success: true, errors: [] };

  process.exit(0);
}

module.exports = {
  runChecks,
  parseFilePatterns,
  validateConfig,
  findFiles,
  determineEcmaVersion,
  filterIgnoredFiles,
  createFileProcessor,
  processConfig,
};
