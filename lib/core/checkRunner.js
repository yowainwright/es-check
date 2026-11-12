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
} = require("./index");
const { determineInvocationType } = require("../cli/utils");
const {
  ECMA_VERSION_MAP,
  ECMA_VERSION_TO_NUMBER,
  LATEST_PARSER_VERSION,
} = require("../constants/es");

let polyfillDetector = null;

function runChecks(configs, loggerOrOptions) {
  const { isNodeAPI, logger } = determineInvocationType(loggerOrOptions);

  const logLevels = determineLogLevel(logger);
  const isDebug = logLevels?.isDebug || false;
  const isWarn = logLevels?.isWarn || false;

  const allErrors = [];
  const context = { logger, isDebug, isWarn, isNodeAPI, allErrors };

  let results = [];
  for (const config of configs) {
    const result = processConfig(config, context);
    results = results.concat(result);

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

function processConfig(config, context) {
  const { logger, isDebug, isWarn, isNodeAPI, allErrors } = context;

  const ignoreFilePath = config.ignoreFile || config["ignore-file"];
  const ignoreFileExists = ignoreFilePath && fs.existsSync(ignoreFilePath);
  const shouldWarnAboutIgnoreFile = ignoreFilePath && !ignoreFileExists && isWarn;

  if (shouldWarnAboutIgnoreFile) {
    logger.warn(`Warning: Ignore file '${ignoreFilePath}' does not exist or is not accessible`);
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

  const { ecmaVersion, targetBrowsers } = versionResult;
  const useLatestForParsing = config.checkFeatures;
  const targetEsVersion = parseInt(ecmaVersion, 10);

  const parserEcmaVersion = useLatestForParsing ? LATEST_PARSER_VERSION : targetEsVersion;
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
  const filteredFiles = filterIgnoredFiles(findFilesResult.files, pathsToIgnore, globOpts);

  const ignoreList = parseIgnoreList(config);
  const hasIgnores = ignoreList.size > 0;
  const shouldDebugIgnores = hasIgnores && isDebug;

  if (shouldDebugIgnores) {
    logger.debug("ES-Check: ignoring features:", Array.from(ignoreList).join(", "));
  }

  const fileCount = filteredFiles.length;
  const hasLogger = logger !== null && logger !== undefined;
  const shouldLogFileCount = hasLogger && fileCount > 0;

  if (shouldLogFileCount) {
    logger.info(`ES-Check: checking ${fileCount} file${fileCount === 1 ? "" : "s"}...`);
  }

  const batchSize = parseInt(config.batchSize || "0", 10);
  const processFile = createFileProcessor(config, {
    acornOpts,
    ignoreList,
    logger,
    isDebug,
    ecmaVersion,
    targetBrowsers,
  });

  const results = processBatchedFiles(filteredFiles, processFile, batchSize);
  const errors = results.filter((result) => result !== null);

  return processConfigResult(errors, logger, isNodeAPI, allErrors, ecmaVersion);
}

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
    logger.error("No ecmaScript version or checkBrowser option specified in configuration");
  }

  if (isExiting) process.exit(1);

  appendError(allErrors, {
    err: new Error("No ecmaScript version or checkBrowser option specified in configuration"),
    file: "config",
  });

  return { isValid: false };
}

function findFiles(patterns, options) {
  const { globOpts, looseGlobMatching, logger, isNodeAPI, allErrors } = options;

  const hasFilePatterns = patterns.length > 0;
  const shouldEnforceFilePatterns = !hasFilePatterns && !looseGlobMatching;
  const hasLogger = logger !== null && logger !== undefined;
  const isExiting = !isNodeAPI;
  const shouldLogMissingPatterns = shouldEnforceFilePatterns && hasLogger;
  const shouldExitMissingPatterns = shouldEnforceFilePatterns && isExiting;

  if (shouldLogMissingPatterns) {
    logger.error("ES-Check: No file patterns specified to check.");
  }

  if (shouldExitMissingPatterns) process.exit(1);

  if (shouldEnforceFilePatterns) {
    appendError(allErrors, {
      err: new Error("No file patterns specified to check"),
      file: "config",
    });
    return { files: [], hasError: true };
  }

  let hasPatternWithNoFiles = false;
  const matchPattern = (pattern) => {
    const globbedFiles = glob.sync(pattern, globOpts);
    const noFilesFound = globbedFiles.length === 0;
    const shouldErrorOnNoFiles = noFilesFound && !looseGlobMatching;

    if (shouldErrorOnNoFiles) {
      hasPatternWithNoFiles = true;
      handleMissingFiles(pattern, options);
    }

    return globbedFiles;
  };
  const allMatchedFiles = patterns.map(matchPattern).flat();

  const noMatchedFiles = allMatchedFiles.length === 0;
  const shouldErrorOnNoMatchedFiles = noMatchedFiles && hasFilePatterns && !looseGlobMatching;
  const shouldWarnOnNoMatchedFiles = noMatchedFiles && looseGlobMatching;
  const shouldLogNoMatchedFiles = shouldErrorOnNoMatchedFiles && hasLogger;
  const shouldExitNoMatchedFiles = shouldErrorOnNoMatchedFiles && isExiting;
  const shouldLogNoMatchedFilesWarning = shouldWarnOnNoMatchedFiles && hasLogger;

  if (shouldLogNoMatchedFiles) {
    logger.error(
      `ES-Check: Did not find any files to check across all patterns: ${patterns.join(", ")}.`,
    );
  }

  if (shouldExitNoMatchedFiles) process.exit(1);

  if (shouldErrorOnNoMatchedFiles) {
    appendError(allErrors, {
      err: new Error(`Did not find any files to check across all patterns: ${patterns.join(", ")}`),
      file: "glob",
    });
    return { files: [], hasError: true };
  }

  if (shouldLogNoMatchedFilesWarning) {
    logger.warn("ES-Check: No file patterns specified or no files found (running in loose mode).");
  }

  return { files: allMatchedFiles, hasError: hasPatternWithNoFiles };
}

function determineEcmaVersion(config, options) {
  const { logger, isDebug, isWarn, isNodeAPI, allErrors } = options;
  const { ecmaVersion: expectedEcmaVersion, checkBrowser } = config;

  const isBrowserslistCheck = Boolean(expectedEcmaVersion === "checkBrowser" || checkBrowser);

  if (isBrowserslistCheck) {
    const browserslistOptions = {
      browserslistQuery: config.browserslistQuery,
      browserslistPath: config.browserslistPath,
      browserslistEnv: config.browserslistEnv,
    };
    let browserslistError = null;
    let ecmaVersion = null;
    let targetBrowsers = [];

    try {
      const { getESVersionFromBrowserslist, getTargetBrowsers } = require("./browserslist");
      const esVersionFromBrowserslist = getESVersionFromBrowserslist(browserslistOptions);
      ecmaVersion = esVersionFromBrowserslist.toString();
      targetBrowsers = getTargetBrowsers(browserslistOptions);
    } catch (err) {
      browserslistError = err;
    }

    const hasError = browserslistError !== null;
    const hasNoError = !hasError;
    const shouldDebug = hasNoError && isDebug;

    if (shouldDebug) {
      const { formatTargetBrowsers } = require("./browserSupport");
      logger.debug(
        `ES-Check: Using ES${ecmaVersion} based on browserslist configuration (target browsers: ${formatTargetBrowsers(targetBrowsers)})`,
      );
    }

    if (hasError) {
      handleBrowserslistError(browserslistError, {
        logger,
        isNodeAPI,
        allErrors,
      });
      return { ecmaVersion: null, targetBrowsers: [], hasError: true };
    }

    return { ecmaVersion, targetBrowsers, hasError: false };
  }

  const mappedVersion = ECMA_VERSION_MAP[expectedEcmaVersion];
  const isInvalidVersion = !mappedVersion;
  const isLegacyVersion = expectedEcmaVersion === "es3" || expectedEcmaVersion === "es4";
  const hasLegacyWarning = isLegacyVersion && isWarn;

  if (hasLegacyWarning) {
    logger.warn(
      `ES-Check: ${expectedEcmaVersion} is not fully supported by the parser. Treating as ES5.`,
    );
  }

  if (isInvalidVersion) {
    handleInvalidVersion({ logger, isNodeAPI, allErrors });
    return { ecmaVersion: null, targetBrowsers: [], hasError: true };
  }

  const ecmaVersion = String(ECMA_VERSION_TO_NUMBER[mappedVersion]);
  return { ecmaVersion, targetBrowsers: [], hasError: false };
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

  const shouldKeepFile = (filePath) => {
    let index = 0;
    while (index < expandedPathsToIgnore.length) {
      const ignoreValue = expandedPathsToIgnore[index];
      const pathParts = filePath.split(ignoreValue);
      const includesIgnoreValue = pathParts.length > 1;
      if (includesIgnoreValue) return false;
      index += 1;
    }

    return true;
  };

  return files.filter(shouldKeepFile);
}

function createFileProcessor(config, options) {
  const { acornOpts, ignoreList, logger, isDebug, ecmaVersion, targetBrowsers } = options;

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
      targetBrowsers,
    );
  };
}

function processConfigResult(errors, logger, isNodeAPI, allErrors, ecmaVersion) {
  const hasFileErrors = errors.length > 0;

  if (hasFileErrors) {
    logErrors(errors, logger);
    appendErrors(allErrors, errors);

    const isExiting = !isNodeAPI;
    if (isExiting) {
      process.exit(1);
    }

    return { hasErrors: true, shouldContinue: false };
  }

  const hasLogger = logger !== null && logger !== undefined;
  if (hasLogger) {
    const versionLabel = ecmaVersion ? `ES${ecmaVersion}` : "the specified ES version";
    logger.info(`✓ ES-Check passed! All files are ${versionLabel} compatible.`);
  }

  return { hasErrors: false, shouldContinue: true };
}

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

function handleMissingFiles(pattern, options) {
  const { logger, isNodeAPI, allErrors } = options;
  const hasLogger = logger !== null && logger !== undefined;
  const isExiting = !isNodeAPI;

  if (hasLogger) {
    logger.error(`ES-Check: Did not find any files to check for pattern: ${pattern}.`);
  }

  if (isExiting) process.exit(1);

  appendError(allErrors, {
    err: new Error(`Did not find any files to check for pattern: ${pattern}`),
    file: "glob",
  });
}

function handleBrowserslistError(browserslistError, options) {
  const { logger, isNodeAPI, allErrors } = options;
  const hasLogger = logger !== null && logger !== undefined;
  const isExiting = !isNodeAPI;

  if (hasLogger) {
    logger.error(`Error determining ES version from browserslist: ${browserslistError.message}`);
  }

  if (isExiting) process.exit(1);

  appendError(allErrors, {
    err: new Error(`Error determining ES version from browserslist: ${browserslistError.message}`),
    file: "browserslist",
  });
}

function handleInvalidVersion(options) {
  const { logger, isNodeAPI, allErrors } = options;
  const hasLogger = logger !== null && logger !== undefined;
  const isExiting = !isNodeAPI;

  if (hasLogger) {
    logger.error("Invalid ecmaScript version, please pass a valid version, use --help for help");
  }

  if (isExiting) process.exit(1);

  appendError(allErrors, {
    err: new Error("Invalid ecmaScript version"),
    file: "config",
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
  targetBrowsers,
) {
  const needsFullAST = config.checkFeatures;
  const parserOptions = needsFullAST
    ? acornOpts
    : Object.assign({}, acornOpts, {
        locations: false,
        ranges: false,
        onComment: null,
      });

  const {
    ast,
    sourceCode,
    error: parseError,
  } = parseCode(code, parserOptions, acorn, file, config);
  const hasParseError = parseError !== null;
  const shouldDebugError = hasParseError && isDebug;

  if (shouldDebugError) {
    logger.debug(`ES-Check: failed to parse file: ${file} \n - error: ${parseError.err}`);
  }

  if (hasParseError) return parseError;

  const shouldCheckFeatures = config.checkFeatures;
  if (!shouldCheckFeatures) return null;

  const parseSourceType = acornOpts.sourceType || "script";
  const esVersion = parseInt(ecmaVersion, 10);

  let foundFeatures;
  let unsupportedFeatures;

  try {
    const result = detectFeatures(sourceCode, esVersion, parseSourceType, ignoreList, {
      ast,
      checkForPolyfills: config.checkForPolyfills,
      ignorePolyfillable: config.ignorePolyfillable,
      targetBrowsers,
    });
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

  const shouldCheckPolyfills = config.checkForPolyfills && unsupportedFeatures.length > 0;

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

  let filteredUnsupportedFeatures = polyfillDetector.filterPolyfilled(
    unsupportedFeatures,
    polyfills,
  );

  const hasPolyfillReduction =
    isDebug && filteredUnsupportedFeatures.length !== unsupportedFeatures.length;

  if (hasPolyfillReduction) {
    logger.debug(
      `ES-Check: Polyfills reduced unsupported features from ${unsupportedFeatures.length} to ${filteredUnsupportedFeatures.length}`,
    );
  }

  if (config.ignorePolyfillable) {
    const beforeIgnorePolyfillable = filteredUnsupportedFeatures.length;
    filteredUnsupportedFeatures = polyfillDetector.filterPolyfillableFeatures(
      filteredUnsupportedFeatures,
      config.ignorePolyfillable,
    );

    const hasPolyfillableReduction =
      isDebug && filteredUnsupportedFeatures.length !== beforeIgnorePolyfillable;

    if (hasPolyfillableReduction) {
      logger.debug(
        `ES-Check: Ignoring polyfillable features reduced unsupported features from ${beforeIgnorePolyfillable} to ${filteredUnsupportedFeatures.length}`,
      );
    }
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

function logErrors(errors, logger) {
  const hasLogger = logger !== null && logger !== undefined;
  if (!hasLogger) return;

  logger.error(`ES-Check: there were ${errors.length} ES version matching errors.`);

  const { mapErrorPosition } = require("./sourcemap");

  for (const error of errors) {
    const hasLocation = error.line !== null && error.line !== undefined;
    const mapped = hasLocation
      ? mapErrorPosition(error.file, error.line, error.column)
      : { file: error.file, line: error.line, column: error.column };

    const locationInfo = hasLocation ? ` at ${mapped.file}:${mapped.line}:${mapped.column}` : "";

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

function appendErrors(allErrors, errors) {
  let index = 0;
  while (index < errors.length) {
    appendError(allErrors, errors[index]);
    index += 1;
  }
}

function appendError(allErrors, error) {
  allErrors[allErrors.length] = error;
}

module.exports = {
  runChecks,
  processConfig,
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
