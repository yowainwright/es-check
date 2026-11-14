const {
  ES_FEATURES,
  POLYFILL_PATTERNS,
  IMPORT_PATTERNS,
  FEATURE_TO_POLYFILL_MAP,
  MAP_CONSTRUCTORS,
  ES_GLOBAL_MIN_VERSION,
  POLYFILLABLE_FEATURES,
  CORE_JS_POLYFILLABLE,
  FEATURE_BROWSER_SUPPORT,
  POLYFILL_RECEIVER_BUILTINS,
} = require("../constants");
const { detectFeaturesFromAST, detectInstalledPropertiesFromAST } = require("./ast");
const { getUnsupportedBrowsers, formatFeatureWithBrowsers } = require("./browserSupport");

const FEATURE_BUILTIN =
  /^(ArrayBuffer|Array|DataView|Date|Error|Iterator|JSON|Map|Math|Object|Promise|RegExp|Set|String|Uint8Array)/;

const detectFeatures = (code, ecmaVersion, sourceType, ignoreList = new Set(), options = {}) => {
  const { checkForPolyfills, ast, ignorePolyfillable, targetBrowsers } = options;

  if (!ast) {
    const error = new Error("AST is required for feature detection");
    error.type = "ES-Check";
    throw error;
  }

  const polyfills = new Set();
  const featureReceivers = checkForPolyfills ? new Map() : undefined;
  const foundFeatures = detectFeaturesFromAST(ast, code, featureReceivers);
  if (checkForPolyfills) {
    detectPolyfills(code, polyfills);
    detectInstalledPolyfills(ast, polyfills, featureReceivers);
  }

  const polyfillableSet = ignorePolyfillable ? getPolyfillableFeatures(ignorePolyfillable) : null;

  const browserDetails = {};

  function isUnsupportedFeature(name, minVersion) {
    const wasFound = foundFeatures[name];
    if (!wasFound) return false;

    const unsupportedBrowsers = getUnsupportedBrowsers(name, targetBrowsers);
    const lacksBrowserSupport = unsupportedBrowsers.length > 0;
    const support = FEATURE_BROWSER_SUPPORT[name];
    const hasBrowserTargets = targetBrowsers?.length > 0;
    const hasCompleteBrowserData =
      hasBrowserTargets && targetBrowsers.every((browser) => support?.[browser.name] !== undefined);
    const requiresHigherVersion = !hasCompleteBrowserData && minVersion > ecmaVersion;
    const shouldReport = requiresHigherVersion || lacksBrowserSupport;
    if (!shouldReport) return false;

    const isIgnored = ignoreList.has(name);
    const isPolyfilled = checkForPolyfills && polyfills.has(name);
    const isPolyfillableIgnored = polyfillableSet && polyfillableSet.has(name);
    const isAllowed = isIgnored || isPolyfilled || isPolyfillableIgnored;
    if (isAllowed) return false;

    if (lacksBrowserSupport) browserDetails[name] = unsupportedBrowsers;
    return true;
  }

  const unsupportedStandardFeatures = Object.entries(ES_FEATURES)
    .filter(([name, { minVersion }]) => isUnsupportedFeature(name, minVersion))
    .map(([name]) => name);

  const unsupportedGlobalFeatures = Object.entries(ES_GLOBAL_MIN_VERSION)
    .filter(([name]) => !ES_FEATURES[name])
    .filter(([name, minVersion]) => isUnsupportedFeature(name, minVersion))
    .map(([name]) => name);

  const unsupportedFeatures = unsupportedStandardFeatures.concat(unsupportedGlobalFeatures);

  if (unsupportedFeatures.length > 0) {
    const hasBrowserDetails = Object.keys(browserDetails).length > 0;
    const featureList = unsupportedFeatures
      .map((name) => formatFeatureWithBrowsers(name, browserDetails[name]))
      .join(", ");
    const reason = hasBrowserDetails
      ? `These require a higher ES version than ${ecmaVersion} or are not supported by the target browsers.`
      : `These require a higher ES version than ${ecmaVersion}.`;
    const error = new Error(`Unsupported features detected: ${featureList}. ${reason}`);
    error.type = "ES-Check";
    error.features = unsupportedFeatures;
    error.browserDetails = browserDetails;
    error.ecmaVersion = ecmaVersion;
    throw error;
  }

  return {
    foundFeatures,
    unsupportedFeatures,
    browserDetails,
  };
};

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
        const requiredPatterns = [].concat(pattern);
        const hasImports = requiredPatterns.every((entry) => entry.test(code));
        if (hasImports) polyfills.add(feature);
      }
    }
  }
};

const detectInstalledPolyfills = (ast, polyfills, featureReceivers) => {
  const installedPaths = detectInstalledPropertiesFromAST(ast);
  Object.entries(ES_FEATURES).forEach(([feature, { astInfo }]) => {
    const receivers = featureReceivers.get(feature);
    const isInstalled = isInstalledFeature(feature, astInfo, installedPaths, receivers);
    const isMismatch = hasMismatchedPolyfillReceiver(feature, astInfo, receivers);
    if (isInstalled) polyfills.add(feature);
    else if (isMismatch) polyfills.delete(feature);
  });
};

function hasMismatchedPolyfillReceiver(feature, astInfo, receivers) {
  if (astInfo?.object) return false;
  const builtin = feature.match(FEATURE_BUILTIN)?.[0];
  if (!builtin) return false;
  return Array.from(receivers || []).some((kind) => {
    const receiverBuiltin = POLYFILL_RECEIVER_BUILTINS[kind];
    const isUnknownArrayReceiver = builtin === "Array" && !receiverBuiltin;
    if (isUnknownArrayReceiver) return true;
    const isMismatch = Boolean(receiverBuiltin) && receiverBuiltin !== builtin;
    return isMismatch;
  });
}

const isInstalledFeature = (feature, astInfo, installedPaths, receivers) => {
  const nodeTypes = [].concat(astInfo?.nodeType || []);
  const isMethod = nodeTypes.includes("CallExpression") && Boolean(astInfo.property);
  if (!isMethod) return false;
  if (astInfo.object) return installedPaths.has(`${astInfo.object}.${astInfo.property}`);
  if (astInfo.requireMapReceiver) {
    const constructors = Array.from(MAP_CONSTRUCTORS);
    return constructors.every((name) =>
      installedPaths.has(`${name}.prototype.${astInfo.property}`),
    );
  }

  const builtin = feature.match(FEATURE_BUILTIN)?.[0];
  if (!builtin) return false;

  return hasInstalledPrototype(builtin, astInfo.property, installedPaths, receivers);
};

function hasInstalledPrototype(builtin, property, installedPaths, receivers) {
  const receiverBuiltins = Array.from(receivers || [], (kind) => POLYFILL_RECEIVER_BUILTINS[kind]);
  const hasUnknownArrayReceiver = builtin === "Array" && receiverBuiltins.includes(undefined);
  if (hasUnknownArrayReceiver) return false;
  const targets = receiverBuiltins.length > 0 ? receiverBuiltins : [builtin];
  return targets.every((target) => {
    const owner = target || builtin;
    return installedPaths.has(`${owner}.prototype.${property}`);
  });
}

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

module.exports = detectFeatures;

module.exports.detectPolyfills = detectPolyfillsForFeatures;

module.exports.filterPolyfilled = filterPolyfilled;

module.exports.filterPolyfillableFeatures = filterPolyfillableFeatures;

module.exports.getPolyfillableFeatures = getPolyfillableFeatures;
