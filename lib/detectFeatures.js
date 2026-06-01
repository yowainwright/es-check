const {
  ES_FEATURES,
  POLYFILL_PATTERNS,
  IMPORT_PATTERNS,
  FEATURE_TO_POLYFILL_MAP,
} = require("./constants");
const { POLYFILLABLE_FEATURES, CORE_JS_POLYFILLABLE } = require("./constants/polyfillableFeatures");
const { detectFeaturesFromAST } = require("./helpers/astDetector");

function getPolyfillableFeatures(library) {
  if (!library) {
    return POLYFILLABLE_FEATURES;
  }

  let normalizedLibrary;
  try {
    normalizedLibrary =
      typeof library === "string" ? library.toLowerCase() : String(library).toLowerCase();
  } catch {
    return POLYFILLABLE_FEATURES;
  }

  if (normalizedLibrary === "core-js") {
    return CORE_JS_POLYFILLABLE;
  }

  return POLYFILLABLE_FEATURES;
}

const detectPolyfills = (
  code,
  polyfills,
  { polyfillPatterns = POLYFILL_PATTERNS, importPatterns = IMPORT_PATTERNS } = {},
) => {
  const hasPolyfillHint = code.includes("core-js") || code.includes("polyfill");
  if (hasPolyfillHint) {
    for (const { pattern, feature } of polyfillPatterns) {
      if (pattern.test(code)) polyfills.add(feature);
    }

    const hasCoreJsModuleRef =
      (code.includes("import") || code.includes("require")) && code.includes("core-js");
    if (hasCoreJsModuleRef) {
      for (const { pattern, feature } of importPatterns) {
        if (pattern.test(code)) polyfills.add(feature);
      }
    }
  }
};

const detectFeatures = (code, ecmaVersion, sourceType, ignoreList = new Set(), options = {}) => {
  const { checkForPolyfills, ast, ignorePolyfillable } = options;

  if (!ast) {
    const error = new Error("AST is required for feature detection");
    error.type = "ES-Check";
    throw error;
  }

  const polyfills = new Set();
  if (checkForPolyfills) detectPolyfills(code, polyfills);

  const foundFeatures = detectFeaturesFromAST(ast);

  const polyfillableSet = ignorePolyfillable ? getPolyfillableFeatures(ignorePolyfillable) : null;

  function isUnsupportedFeature(name, minVersion) {
    const wasFound = foundFeatures[name];
    const requiresHigherVersion = minVersion > ecmaVersion;
    const isIgnored = ignoreList.has(name);
    const isPolyfilled = checkForPolyfills && polyfills.has(name);
    const isPolyfillableIgnored = polyfillableSet && polyfillableSet.has(name);

    const isAllowed = isIgnored || isPolyfilled || isPolyfillableIgnored;
    const shouldReport = wasFound && requiresHigherVersion;
    if (!shouldReport) return false;
    return !isAllowed;
  }

  const unsupportedFeatures = Object.entries(ES_FEATURES)
    .filter(([name, { minVersion }]) => isUnsupportedFeature(name, minVersion))
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

function detectPolyfillsForFeatures(code, logger, featureMap = FEATURE_TO_POLYFILL_MAP) {
  const polyfills = new Set();
  const hasNoPolyfillInput = !code || !featureMap;
  if (hasNoPolyfillInput) return polyfills;

  const polyfillFeatures = Object.entries(featureMap);
  let index = 0;
  while (index < polyfillFeatures.length) {
    const [feature, patterns] = polyfillFeatures[index];
    const isPolyfilled = hasMatchingPattern(code, patterns);
    if (isPolyfilled) polyfills.add(feature);
    index += 1;
  }

  if (logger?.isLevelEnabled?.("debug")) {
    const hasPolyfills = polyfills.size > 0;
    if (hasPolyfills)
      logger.debug(`ES-Check: Detected polyfills: ${Array.from(polyfills).join(", ")}`);
    else logger.debug("ES-Check: No polyfills detected.");
  }

  return polyfills;
}

function hasMatchingPattern(code, patterns) {
  let index = 0;
  while (index < patterns.length) {
    const pattern = patterns[index];
    if (pattern.test(code)) return true;
    index += 1;
  }

  return false;
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
module.exports.getPolyfillableFeatures = getPolyfillableFeatures;
