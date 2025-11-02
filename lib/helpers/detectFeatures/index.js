const { fastBrakeSync } = require("fast-brake/sync");
const {
  ES_FEATURES,
  POLYFILL_PATTERNS,
  IMPORT_PATTERNS,
  FEATURE_TO_POLYFILL_MAP,
} = require("./constants/index");
const esversionPlugin = require("fast-brake/plugins/esversion");

const fastbrake = fastBrakeSync({ plugins: [esversionPlugin.default] });

/**
 * Detects polyfills in the code and adds them to the polyfills Set
 * @param {string} code - The source code to check
 * @param {Set} polyfills - Set to store detected polyfills
 */
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

    if (code.includes("import") && code.includes("core-js")) {
      for (const { pattern, feature } of importPatterns) {
        if (pattern.test(code)) polyfills.add(feature);
      }
    }
  }
};

const featureNameMap = {
  let_const: ["let", "const"],
  arrow_functions: "ArrowFunctions",
  template_literals: "TemplateLiterals",
  destructuring: "Destructuring",
  classes: "class",
  extends: "extends",
  spread_rest: ["RestSpread", "ArraySpread"],
  default_parameters: "DefaultParams",
  default_params: "DefaultParams",
  for_of: "ForOf",
  import: "import",
  export: "export",
  import_export: ["import", "export"],
  async_await: "AsyncAwait",
  generators: "Generators",
  promise: "Promise",
  promise_resolve: "PromiseResolve",
  promise_reject: "PromiseReject",
  promise_any: "PromiseAny",
  promise_allSettled: "PromiseAllSettled",
  map: "Map",
  set: "Set",
  weakmap: "WeakMap",
  weakset: "WeakSet",
  symbol: "Symbol",
  proxy: "Proxy",
  reflect: "Reflect",
  weakref: "WeakRef",
  finalization_registry: "FinalizationRegistry",
  exponentiation: "ExponentOperator",
  object_spread: "ObjectSpread",
  rest_spread_properties: "ObjectSpread",
  optional_catch: "OptionalCatchBinding",
  bigint: "BigInt",
  nullish_coalescing: "NullishCoalescing",
  optional_chaining: "OptionalChaining",
  private_fields: "PrivateClassFields",
  logical_assignment: "LogicalAssignment",
  numeric_separators: "NumericSeparators",
  class_fields: "ClassFields",
  top_level_await: "TopLevelAwait",
  globalThis: "globalThis",
  array_at: "ArrayPrototypeAt",
  object_hasOwn: "ObjectHasOwn",
  string_replaceAll: "StringReplaceAll",
};

const detectFeatures = (
  code,
  ecmaVersion,
  sourceType,
  ignoreList = new Set(),
  options = {},
) => {
  const { checkForPolyfills, ast } = options;

  const polyfills = new Set();
  if (checkForPolyfills) detectPolyfills(code, polyfills);

  let detectedFeatures = [];

  if (ast && ast.features) {
    detectedFeatures = ast.features;
  } else {
    try {
      detectedFeatures = fastbrake.detect(code);
    } catch (err) {
      const error = new Error(`Failed to parse code: ${err.message}`);
      error.type = "ES-Check";
      throw error;
    }
  }

  const foundFeatures = Object.keys(ES_FEATURES).reduce((acc, f) => {
    acc[f] = false;
    return acc;
  }, {});

  detectedFeatures.forEach((feature) => {
    const mapped = featureNameMap[feature.name];

    if (mapped) {
      if (Array.isArray(mapped)) {
        mapped.forEach((name) => {
          if (ES_FEATURES[name]) {
            foundFeatures[name] = true;
          }
        });
      } else if (ES_FEATURES[mapped]) {
        foundFeatures[mapped] = true;
      }
    }
  });

  const unsupportedFeatures = [];
  Object.entries(ES_FEATURES).forEach(([featureName, { minVersion }]) => {
    const isPolyfilled = checkForPolyfills && polyfills.has(featureName);
    if (
      foundFeatures[featureName] &&
      minVersion > ecmaVersion &&
      !ignoreList.has(featureName) &&
      !isPolyfilled
    ) {
      unsupportedFeatures.push(featureName);
    }
  });

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
  if (!code || !featureMap) return polyfills;

  if (logger?.isLevelEnabled?.("debug")) {
  }

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

module.exports = detectFeatures;
module.exports.detectPolyfills = detectPolyfillsForFeatures;
module.exports.filterPolyfilled = filterPolyfilled;
