const acorn = require('acorn');
const walk = require('acorn-walk');
const { ES_FEATURES } = require('./constants');
const { checkMap } = require('./utils');

/**
 * Detects polyfills in the code and adds them to the polyfills Set
 * @param {string} code - The source code to check
 * @param {Set} polyfills - Set to store detected polyfills
 */
function detectPolyfills(code, polyfills) {
  // Check for core-js polyfills
  if (code.includes('core-js') || code.includes('polyfill')) {
    // Common polyfill patterns
    const polyfillPatterns = [
      // Array methods
      { pattern: /Array\.prototype\.toSorted/, feature: 'ArrayToSorted' },
      { pattern: /Array\.prototype\.findLast/, feature: 'ArrayFindLast' },
      { pattern: /Array\.prototype\.findLastIndex/, feature: 'ArrayFindLastIndex' },
      { pattern: /Array\.prototype\.at/, feature: 'ArrayAt' },

      // String methods
      { pattern: /String\.prototype\.replaceAll/, feature: 'StringReplaceAll' },
      { pattern: /String\.prototype\.matchAll/, feature: 'StringMatchAll' },
      { pattern: /String\.prototype\.at/, feature: 'StringAt' },

      // Object methods
      { pattern: /Object\.hasOwn/, feature: 'ObjectHasOwn' },

      // Promise methods
      { pattern: /Promise\.any/, feature: 'PromiseAny' },

      // RegExp methods
      { pattern: /RegExp\.prototype\.exec/, feature: 'RegExpExec' },

      // Global methods
      { pattern: /globalThis/, feature: 'GlobalThis' },
    ];

    for (const { pattern, feature } of polyfillPatterns) {
      if (pattern.test(code)) {
        polyfills.add(feature);
      }
    }

    // Check for import statements related to polyfills
    if (code.includes('import') && code.includes('core-js')) {
      const importPatterns = [
        { pattern: /from\s+['"]core-js\/modules\/es\.array\.to-sorted['"]/, feature: 'ArrayToSorted' },
        { pattern: /from\s+['"]core-js\/modules\/es\.array\.find-last['"]/, feature: 'ArrayFindLast' },
        { pattern: /from\s+['"]core-js\/modules\/es\.array\.find-last-index['"]/, feature: 'ArrayFindLastIndex' },
        { pattern: /from\s+['"]core-js\/modules\/es\.array\.at['"]/, feature: 'ArrayAt' },
        { pattern: /from\s+['"]core-js\/modules\/es\.string\.replace-all['"]/, feature: 'StringReplaceAll' },
        { pattern: /from\s+['"]core-js\/modules\/es\.string\.match-all['"]/, feature: 'StringMatchAll' },
        { pattern: /from\s+['"]core-js\/modules\/es\.string\.at['"]/, feature: 'StringAt' },
        { pattern: /from\s+['"]core-js\/modules\/es\.object\.has-own['"]/, feature: 'ObjectHasOwn' },
        { pattern: /from\s+['"]core-js\/modules\/es\.promise\.any['"]/, feature: 'PromiseAny' },
        { pattern: /from\s+['"]core-js\/modules\/es\.regexp\.exec['"]/, feature: 'RegExpExec' },
        { pattern: /from\s+['"]core-js\/modules\/es\.global-this['"]/, feature: 'GlobalThis' },
      ];

      for (const { pattern, feature } of importPatterns) {
        if (pattern.test(code)) {
          polyfills.add(feature);
        }
      }
    }
  }
}

const detectFeatures = (code, ecmaVersion, sourceType, ignoreList = new Set(), options = {}) => {
  const { checkForPolyfills } = options;

  // Check for polyfills if the option is enabled
  const polyfills = new Set();
  if (checkForPolyfills) {
    detectPolyfills(code, polyfills);
  }

  const ast = acorn.parse(code, {
    ecmaVersion: 'latest',
    sourceType,
  });

  /**
   * @note Flatten all checks
   */
  const allChecks = Object.entries(ES_FEATURES).map(([featureName, { astInfo }]) => ({
    featureName,
    nodeType: astInfo.nodeType,
    astInfo,
  }));

  /**
   * @note A universal visitor for any node type:
   * - Filters checks that match the current node’s type
   * - Calls the relevant checker function
   * - If true => mark the feature as found
   */
  const foundFeatures = Object.keys(ES_FEATURES).reduce((acc, f) => {
    acc[f] = false;
    return acc;
  }, {});

  const universalVisitor = (node) => {
    allChecks
      .filter(({ nodeType }) => nodeType === node.type)
      .forEach(({ featureName, astInfo }) => {
        const checker = checkMap[node.type] || checkMap.default;
        if (checker(node, astInfo)) {
          foundFeatures[featureName] = true;
        }
      });
  };

  /**
   * @note Build the visitors object for acorn-walk.
   * Each unique nodeType gets the same universalVisitor.
   */
  const nodeTypes = [...new Set(allChecks.map((c) => c.nodeType))];
  const visitors = nodeTypes.reduce((acc, nt) => {
    acc[nt] = universalVisitor;
    return acc;
  }, {});

  walk.simple(ast, visitors);

  /**
   * @note Check if any found feature requires a higher version than requested.
   * We assume each entry in ES_FEATURES has a `minVersion` property.
   */
  const unsupportedFeatures = Object.entries(ES_FEATURES).reduce((acc = [], [featureName, { minVersion }]) => {
    // If feature is used but requires a newer version than ecmaVersion, it's unsupported
    // Skip features that are in the ignoreList or have been polyfilled
    const isPolyfilled = checkForPolyfills && polyfills.has(featureName);
    if (foundFeatures[featureName] && minVersion > ecmaVersion && !ignoreList.has(featureName) && !isPolyfilled) {
      acc.push(featureName);
    }
    return acc;
  }, []);

  // We'll let the caller handle logging polyfills

  /**
   * @note Fail if any unsupported features were used.
   */
  if (unsupportedFeatures.length > 0) {
    const error = new Error(
      `Unsupported features detected: ${unsupportedFeatures.join(', ')}. ` +
      `These require a higher ES version than ${ecmaVersion}.`
    );
    error.type = 'ES-Check';
    error.features = unsupportedFeatures;
    error.ecmaVersion = ecmaVersion;
    throw error;
  }

  return {
    foundFeatures,
    unsupportedFeatures,
  }
};

module.exports = detectFeatures;
