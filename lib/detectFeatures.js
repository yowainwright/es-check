const {
  ES_FEATURES,
  POLYFILL_PATTERNS,
  IMPORT_PATTERNS,
  FEATURE_TO_POLYFILL_MAP,
} = require("./constants");
const {
  POLYFILLABLE_FEATURES,
  CORE_JS_POLYFILLABLE,
} = require("./constants/polyfillableFeatures");
const {
  createFeatureDetectionContext,
  detectFeaturesFromAST,
} = require("./helpers/astDetector");

function createEmptyFeatureResult(features = ES_FEATURES) {
  const foundFeatures = Object.create(null);
  for (const key of Object.keys(features)) {
    foundFeatures[key] = false;
  }
  return foundFeatures;
}

function getRelevantUnsupportedFeatures(
  ecmaVersion,
  ignoreList,
  polyfills,
  checkForPolyfills,
  polyfillableSet,
) {
  const relevant = {};
  for (const [name, feature] of Object.entries(ES_FEATURES)) {
    const shouldSkip =
      feature.minVersion <= ecmaVersion ||
      ignoreList.has(name) ||
      (checkForPolyfills && polyfills.has(name)) ||
      (polyfillableSet && polyfillableSet.has(name));

    if (!shouldSkip) relevant[name] = feature;
  }
  return relevant;
}

function createFeatureDetectionPlan(
  ecmaVersion,
  ignoreList = new Set(),
  {
    checkForPolyfills = false,
    polyfills = new Set(),
    ignorePolyfillable = null,
  } = {},
) {
  const polyfillableSet = ignorePolyfillable
    ? getPolyfillableFeatures(ignorePolyfillable)
    : null;
  const featuresToDetect = getRelevantUnsupportedFeatures(
    ecmaVersion,
    ignoreList,
    polyfills,
    checkForPolyfills,
    polyfillableSet,
  );

  return {
    featuresToDetect,
    detectionContext: createFeatureDetectionContext(featuresToDetect),
  };
}

function getPolyfillableFeatures(library) {
  if (!library) {
    return POLYFILLABLE_FEATURES;
  }

  let normalizedLibrary;
  try {
    normalizedLibrary =
      typeof library === "string"
        ? library.toLowerCase()
        : String(library).toLowerCase();
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
  const { checkForPolyfills, ast, ignorePolyfillable } = options;
  const onlyUnsupportedFeatures = options.onlyUnsupportedFeatures === true;
  const featureDetectionPlan = options.featureDetectionPlan;

  if (!ast) {
    const error = new Error("AST is required for feature detection");
    error.type = "ES-Check";
    throw error;
  }

  const polyfills = new Set();
  if (checkForPolyfills) detectPolyfills(code, polyfills);

  const polyfillableSet = ignorePolyfillable
    ? getPolyfillableFeatures(ignorePolyfillable)
    : null;

  const canUseFeatureDetectionPlan =
    onlyUnsupportedFeatures && featureDetectionPlan && !checkForPolyfills;
  const featuresToDetect = canUseFeatureDetectionPlan
    ? featureDetectionPlan.featuresToDetect
    : onlyUnsupportedFeatures
      ? getRelevantUnsupportedFeatures(
          ecmaVersion,
          ignoreList,
          polyfills,
          checkForPolyfills,
          polyfillableSet,
        )
      : ES_FEATURES;

  const hasFeaturesToDetect = Object.keys(featuresToDetect).length > 0;
  const foundFeatures = hasFeaturesToDetect
    ? detectFeaturesFromAST(
        ast,
        canUseFeatureDetectionPlan
          ? featureDetectionPlan.detectionContext
          : createFeatureDetectionContext(featuresToDetect),
      )
    : createEmptyFeatureResult(featuresToDetect);

  const unsupportedFeatures = Object.entries(featuresToDetect)
    .filter(
      ([name, { minVersion }]) =>
        foundFeatures[name] &&
        minVersion > ecmaVersion &&
        !ignoreList.has(name) &&
        !(checkForPolyfills && polyfills.has(name)) &&
        !(polyfillableSet && polyfillableSet.has(name)),
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

const filterPolyfillableFeatures = (
  unsupportedFeatures,
  ignorePolyfillable,
) => {
  if (!ignorePolyfillable) return unsupportedFeatures;

  const polyfillableSet = getPolyfillableFeatures(ignorePolyfillable);
  return unsupportedFeatures.filter((feature) => !polyfillableSet.has(feature));
};

module.exports = detectFeatures;
module.exports.detectPolyfills = detectPolyfillsForFeatures;
module.exports.filterPolyfilled = filterPolyfilled;
module.exports.filterPolyfillableFeatures = filterPolyfillableFeatures;
module.exports.getPolyfillableFeatures = getPolyfillableFeatures;
module.exports.createFeatureDetectionPlan = createFeatureDetectionPlan;
