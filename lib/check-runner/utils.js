const acorn = require("acorn");
const glob = require("fast-glob");
const fs = require("fs");
const {
  detectFeatures,
  polyfillDetector: polyfillDetectorModule,
  parseIgnoreList,
  processBatchedFiles,
  readFile,
  parseCode,
} = require("../helpers");
const {
  ECMA_VERSION_MAP,
  ECMA_VERSION_TO_NUMBER,
} = require("../constants/versions");

let polyfillDetector = null;

function parseFilePatterns(configFilesValue) {
  const hasNoValue = !configFilesValue;
  if (hasNoValue) return [];

  const isArray = Array.isArray(configFilesValue);
  if (isArray) {
    return configFilesValue.map((p) => String(p).trim()).filter(Boolean);
  }

  const isString = typeof configFilesValue === "string";
  if (isString) {
    return configFilesValue
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }

  return [];
}

function validateConfig(config, options) {
  const { logger, isNodeAPI, allErrors } = options;

  const hasEcmaVersion = Boolean(config.ecmaVersion);
  const hasBrowserCheck = Boolean(config.checkBrowser);
  const missingVersionSpecification = !hasEcmaVersion && !hasBrowserCheck;
  const isValid = !missingVersionSpecification;

  if (isValid) return { isValid: true };

  const hasLogger = logger !== null && logger !== undefined;
  const isExiting = !isNodeAPI;

  if (hasLogger) {
    logger.error(
      "No ecmaScript version or checkBrowser option specified in configuration",
    );
  }

  if (isExiting) process.exit(1);

  allErrors.push({
    err: new Error(
      "No ecmaScript version or checkBrowser option specified in configuration",
    ),
    file: "config",
  });

  return { isValid: false };
}

function handleMissingFiles(pattern, options) {
  const { logger, isNodeAPI, allErrors } = options;
  const hasLogger = logger !== null && logger !== undefined;
  const isExiting = !isNodeAPI;

  if (hasLogger) {
    logger.error(
      `ES-Check: Did not find any files to check for pattern: ${pattern}.`,
    );
  }

  if (isExiting) process.exit(1);

  allErrors.push({
    err: new Error(`Did not find any files to check for pattern: ${pattern}`),
    file: "glob",
  });
}

function findFiles(patterns, options) {
  const { globOpts, looseGlobMatching, logger, isNodeAPI, allErrors } = options;

  const hasFilePatterns = patterns.length > 0;
  const shouldEnforceFilePatterns = !hasFilePatterns && !looseGlobMatching;
  const hasLogger = logger !== null && logger !== undefined;
  const isExiting = !isNodeAPI;

  if (shouldEnforceFilePatterns && hasLogger) {
    logger.error("ES-Check: No file patterns specified to check.");
  }

  if (shouldEnforceFilePatterns && isExiting) process.exit(1);

  if (shouldEnforceFilePatterns) {
    allErrors.push({
      err: new Error("No file patterns specified to check"),
      file: "config",
    });
    return { files: [], hasError: true };
  }

  let hasPatternWithNoFiles = false;
  const allMatchedFiles = patterns.flatMap((pattern) => {
    const globbedFiles = glob.sync(pattern, globOpts);
    const noFilesFound = globbedFiles.length === 0;
    const shouldErrorOnNoFiles = noFilesFound && !looseGlobMatching;

    if (shouldErrorOnNoFiles) {
      hasPatternWithNoFiles = true;
      handleMissingFiles(pattern, options);
    }

    return globbedFiles;
  });

  const noMatchedFiles = allMatchedFiles.length === 0;
  const shouldErrorOnNoMatchedFiles =
    noMatchedFiles && hasFilePatterns && !looseGlobMatching;
  const shouldWarnOnNoMatchedFiles = noMatchedFiles && looseGlobMatching;

  if (shouldErrorOnNoMatchedFiles && hasLogger) {
    logger.error(
      `ES-Check: Did not find any files to check across all patterns: ${patterns.join(", ")}.`,
    );
  }

  if (shouldErrorOnNoMatchedFiles && isExiting) process.exit(1);

  if (shouldErrorOnNoMatchedFiles) {
    allErrors.push({
      err: new Error(
        `Did not find any files to check across all patterns: ${patterns.join(", ")}`,
      ),
      file: "glob",
    });
    return { files: [], hasError: true };
  }

  if (shouldWarnOnNoMatchedFiles && hasLogger) {
    logger.warn(
      "ES-Check: No file patterns specified or no files found (running in loose mode).",
    );
  }

  return { files: allMatchedFiles, hasError: hasPatternWithNoFiles };
}

function handleBrowserslistError(browserslistError, options) {
  const { logger, isNodeAPI, allErrors } = options;
  const hasLogger = logger !== null && logger !== undefined;
  const isExiting = !isNodeAPI;

  if (hasLogger) {
    logger.error(
      `Error determining ES version from browserslist: ${browserslistError.message}`,
    );
  }

  if (isExiting) process.exit(1);

  allErrors.push({
    err: new Error(
      `Error determining ES version from browserslist: ${browserslistError.message}`,
    ),
    file: "browserslist",
  });
}

function handleInvalidVersion(options) {
  const { logger, isNodeAPI, allErrors } = options;
  const hasLogger = logger !== null && logger !== undefined;
  const isExiting = !isNodeAPI;

  if (hasLogger) {
    logger.error(
      "Invalid ecmaScript version, please pass a valid version, use --help for help",
    );
  }

  if (isExiting) process.exit(1);

  allErrors.push({
    err: new Error("Invalid ecmaScript version"),
    file: "config",
  });
}

function determineEcmaVersion(config, options) {
  const { logger, isDebug, isWarn, isNodeAPI, allErrors } = options;
  const { ecmaVersion: expectedEcmaVersion, checkBrowser } = config;

  const isBrowserslistCheck = Boolean(
    expectedEcmaVersion === "checkBrowser" || checkBrowser,
  );

  if (isBrowserslistCheck) {
    const browserslistQuery = config.browserslistQuery;
    let browserslistError = null;
    let ecmaVersion = null;

    try {
      const { getESVersionFromBrowserslist } = require("../browserslist");
      const esVersionFromBrowserslist = getESVersionFromBrowserslist({
        browserslistQuery,
        browserslistPath: config.browserslistPath,
        browserslistEnv: config.browserslistEnv,
      });
      ecmaVersion = esVersionFromBrowserslist.toString();
    } catch (err) {
      browserslistError = err;
    }

    const hasError = browserslistError !== null;
    const hasNoError = !hasError;
    const shouldDebug = hasNoError && isDebug;

    if (shouldDebug) {
      logger.debug(
        `ES-Check: Using ES${ecmaVersion} based on browserslist configuration`,
      );
    }

    if (hasError) {
      handleBrowserslistError(browserslistError, {
        logger,
        isNodeAPI,
        allErrors,
      });
      return { ecmaVersion: null, hasError: true };
    }

    return { ecmaVersion, hasError: false };
  }

  const mappedVersion = ECMA_VERSION_MAP[expectedEcmaVersion];
  const isInvalidVersion = !mappedVersion;
  const isLegacyVersion =
    expectedEcmaVersion === "es3" || expectedEcmaVersion === "es4";
  const hasLegacyWarning = isLegacyVersion && isWarn;

  if (hasLegacyWarning) {
    logger.warn(
      `ES-Check: ${expectedEcmaVersion} is not fully supported by the parser. Treating as ES5.`,
    );
  }

  if (isInvalidVersion) {
    handleInvalidVersion({ logger, isNodeAPI, allErrors });
    return { ecmaVersion: null, hasError: true };
  }

  const ecmaVersion = String(ECMA_VERSION_TO_NUMBER[mappedVersion]);
  return { ecmaVersion, hasError: false };
}

function filterIgnoredFiles(files, pathsToIgnore, globOpts) {
  const hasNoIgnores = pathsToIgnore.length === 0;
  if (hasNoIgnores) return files;

  const expandedPathsToIgnore = pathsToIgnore.flatMap((path) => {
    const hasWildcard = path.includes("*");
    return hasWildcard ? glob.sync(path, globOpts) : [path];
  });

  const hasNoExpandedIgnores = expandedPathsToIgnore.length === 0;
  if (hasNoExpandedIgnores) return files;

  return files.filter((filePath) => {
    return !expandedPathsToIgnore.some((ignoreValue) =>
      filePath.includes(ignoreValue),
    );
  });
}

function processFullAST(
  code,
  acornOpts,
  file,
  config,
  ignoreList,
  ecmaVersion,
  isDebug,
  logger,
) {
  const needsFullAST = config.checkFeatures;
  const parserOptions = needsFullAST
    ? acornOpts
    : { ...acornOpts, locations: false, ranges: false, onComment: null };

  const { ast, error: parseError } = parseCode(
    code,
    parserOptions,
    acorn,
    file,
    config,
  );
  const hasParseError = parseError !== null;
  const shouldDebugError = hasParseError && isDebug;

  if (shouldDebugError) {
    logger.debug(
      `ES-Check: failed to parse file: ${file} \n - error: ${parseError.err}`,
    );
  }

  if (hasParseError) return parseError;

  const shouldCheckFeatures = config.checkFeatures;
  if (!shouldCheckFeatures) return null;

  const parseSourceType = acornOpts.sourceType || "script";
  const esVersion = parseInt(ecmaVersion, 10);

  let foundFeatures;
  let unsupportedFeatures;

  try {
    const result = detectFeatures(
      code,
      esVersion,
      parseSourceType,
      ignoreList,
      { ast, checkForPolyfills: config.checkForPolyfills },
    );
    foundFeatures = result.foundFeatures;
    unsupportedFeatures = result.unsupportedFeatures;
  } catch (err) {
    const isESCheckFeatureError = err.type === "ES-Check" && err.features;
    if (isESCheckFeatureError) {
      return { err, file, stack: err.stack };
    }
    throw err;
  }

  if (isDebug) {
    const stringifiedFeatures = JSON.stringify(foundFeatures, null, 2);
    logger.debug(`Features found in ${file}: ${stringifiedFeatures}`);
  }

  const shouldCheckPolyfills =
    config.checkForPolyfills && unsupportedFeatures.length > 0;

  if (!shouldCheckPolyfills) {
    const isSupported = unsupportedFeatures.length === 0;
    if (isSupported) return null;

    const error = new Error(
      `Unsupported features used: ${unsupportedFeatures.join(", ")} but your target is ES${ecmaVersion}.`,
    );
    return { err: error, file, stack: error.stack };
  }

  if (!polyfillDetector) {
    polyfillDetector = polyfillDetectorModule;
  }

  const polyfills = polyfillDetector.detectPolyfills(
    code,
    logger || { debug: () => {}, isLevelEnabled: () => false },
  );

  const filteredUnsupportedFeatures = polyfillDetector.filterPolyfilled(
    unsupportedFeatures,
    polyfills,
  );

  const hasReduction =
    isDebug &&
    filteredUnsupportedFeatures.length !== unsupportedFeatures.length;

  if (hasReduction) {
    logger.debug(
      `ES-Check: Polyfills reduced unsupported features from ${unsupportedFeatures.length} to ${filteredUnsupportedFeatures.length}`,
    );
  }

  const isSupported = filteredUnsupportedFeatures.length === 0;

  if (!isSupported) {
    const error = new Error(
      `Unsupported features used: ${filteredUnsupportedFeatures.join(", ")} but your target is ES${ecmaVersion}.`,
    );
    return { err: error, file, stack: error.stack };
  }

  return null;
}

function createFileProcessor(config, options) {
  const { acornOpts, ignoreList, logger, isDebug, ecmaVersion } = options;

  return (file) => {
    const useCache = config.cache !== false;
    const { content: code, error: readError } = readFile(file, fs, useCache);

    const hasReadError = readError !== null;
    if (hasReadError) return readError;

    if (isDebug) {
      logger.debug(`ES-Check: checking ${file}`);
    }

    return processFullAST(
      code,
      acornOpts,
      file,
      config,
      ignoreList,
      ecmaVersion,
      isDebug,
      logger,
    );
  };
}

function logErrors(errors, logger) {
  const hasLogger = logger !== null && logger !== undefined;
  if (!hasLogger) return;

  logger.error(
    `ES-Check: there were ${errors.length} ES version matching errors.`,
  );

  const { mapErrorPosition } = require("../helpers/sourcemap");

  for (const error of errors) {
    const hasLocation = error.line !== null && error.line !== undefined;
    const mapped = hasLocation
      ? mapErrorPosition(error.file, error.line, error.column)
      : { file: error.file, line: error.line, column: error.column };

    const locationInfo = hasLocation
      ? ` at ${mapped.file}:${mapped.line}:${mapped.column}`
      : "";

    logger.info(`
      ES-Check Error:
      ----
      · erroring file: ${mapped.file}${locationInfo}
      · error: ${error.err}
      · see the printed err.stack below for context
      ----\n
      ${error.stack}
    `);
  }
}

function processConfigResult(
  errors,
  logger,
  isNodeAPI,
  allErrors,
  ecmaVersion,
) {
  const hasFileErrors = errors.length > 0;

  if (hasFileErrors) {
    logErrors(errors, logger);
    allErrors.push(...errors);

    const isExiting = !isNodeAPI;
    if (isExiting) {
      process.exit(1);
    }

    return { hasErrors: true, shouldContinue: false };
  }

  const hasLogger = logger !== null && logger !== undefined;
  if (hasLogger) {
    const versionLabel = ecmaVersion
      ? `ES${ecmaVersion}`
      : "the specified ES version";
    logger.info(`✓ ES-Check passed! All files are ${versionLabel} compatible.`);
  }

  return { hasErrors: false, shouldContinue: true };
}

module.exports = {
  parseFilePatterns,
  validateConfig,
  findFiles,
  determineEcmaVersion,
  filterIgnoredFiles,
  createFileProcessor,
  processConfigResult,
  parseIgnoreList,
  processBatchedFiles,
};
