const {
  ES_FEATURES,
  POLYFILL_PATTERNS,
  IMPORT_PATTERNS,
  FEATURE_TO_POLYFILL_MAP,
} = require("./constants");
const { getPolyfillableFeatures } = require("./constants/polyfillableFeatures");
const { detectFeaturesFromAST } = require("./helpers/astDetector");

const detectPolyfills = (
  code,
  polyfills,
  {
    polyfillPatterns = POLYFILL_PATTERNS,
    importPatterns = IMPORT_PATTERNS,
  } = {},
) => {
  if (code.includes("core-js") || code.includes("polyfill")) {
    for (const { pattern, feature } of polyfillPatterns) {
      if (pattern.test(code)) polyfills.add(feature);
    }

    const hasCoreJsModuleRef =
      (code.includes("import") || code.includes("require")) &&
      code.includes("core-js");
    if (hasCoreJsModuleRef) {
      for (const { pattern, feature } of importPatterns) {
        if (pattern.test(code)) polyfills.add(feature);
      }
    }
  }
};

const detectFeatures = (
  code,
  ecmaVersion,
  sourceType,
  ignoreList = new Set(),
  options = {},
) => {
  const { checkForPolyfills, ast } = options;

  if (!ast) {
    const error = new Error("AST is required for feature detection");
    error.type = "ES-Check";
    throw error;
  }

  const polyfills = new Set();
  if (checkForPolyfills) detectPolyfills(code, polyfills);

  const foundFeatures = detectFeaturesFromAST(ast);

  const unsupportedFeatures = Object.entries(ES_FEATURES)
    .filter(
      ([name, { minVersion }]) =>
        foundFeatures[name] &&
        minVersion > ecmaVersion &&
        !ignoreList.has(name) &&
        !(checkForPolyfills && polyfills.has(name)),
    )
    .map(([name]) => name);

  if (unsupportedFeatures.length > 0) {
    const error = new Error(
      `Unsupported features detected: ${unsupportedFeatures.join(", ")}. ` +
        `These require a higher ES version than ${ecmaVersion}.`,
    );
    error.type = "ES-Check";
    error.features = unsupportedFeatures;
    error.ecmaVersion = ecmaVersion;
    throw error;
  }

  return {
    foundFeatures,
    unsupportedFeatures,
  };
};

function detectPolyfillsForFeatures(
  code,
  logger,
  featureMap = FEATURE_TO_POLYFILL_MAP,
) {
  const polyfills = new Set();
  if (!code || !featureMap) return polyfills;

  const polyfillFeatures = Object.entries(featureMap);
  polyfillFeatures.forEach(([feature, patterns]) => {
    const isPolyfilled = patterns.some((pattern) => pattern.test(code));
    if (isPolyfilled) polyfills.add(feature);
  });

  if (logger?.isLevelEnabled?.("debug")) {
    const hasPolyfills = polyfills.size > 0;
    if (hasPolyfills)
      logger.debug(
        `ES-Check: Detected polyfills: ${Array.from(polyfills).join(", ")}`,
      );
    else logger.debug("ES-Check: No polyfills detected.");
  }

  return polyfills;
}

const filterPolyfilled = (unsupportedFeatures, polyfills) => {
  const hasPolyfills = polyfills && polyfills.size > 0;
  if (!hasPolyfills) return unsupportedFeatures;
  return unsupportedFeatures.filter((feature) => !polyfills.has(feature));
};

const filterPolyfillableFeatures = (unsupportedFeatures, ignorePolyfillable) => {
  if (!ignorePolyfillable) return unsupportedFeatures;

  const polyfillableSet = getPolyfillableFeatures(ignorePolyfillable);
  return unsupportedFeatures.filter((feature) => !polyfillableSet.has(feature));
};

module.exports = detectFeatures;
module.exports.detectPolyfills = detectPolyfillsForFeatures;
module.exports.filterPolyfilled = filterPolyfilled;
module.exports.filterPolyfillableFeatures = filterPolyfillableFeatures;
