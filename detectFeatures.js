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
  if (code.includes('core-js') || code.includes('polyfill')) {
    const polyfillPatterns = [
      { pattern: /Array\.prototype\.toSorted/, feature: 'ArrayToSorted' },
      { pattern: /Array\.prototype\.findLast/, feature: 'ArrayFindLast' },
      { pattern: /Array\.prototype\.findLastIndex/, feature: 'ArrayFindLastIndex' },
      { pattern: /Array\.prototype\.at/, feature: 'ArrayAt' },
      { pattern: /String\.prototype\.replaceAll/, feature: 'StringReplaceAll' },
      { pattern: /String\.prototype\.matchAll/, feature: 'StringMatchAll' },
      { pattern: /String\.prototype\.at/, feature: 'StringAt' },
      { pattern: /Object\.hasOwn/, feature: 'ObjectHasOwn' },
      { pattern: /Promise\.any/, feature: 'PromiseAny' },
      { pattern: /RegExp\.prototype\.exec/, feature: 'RegExpExec' },
      { pattern: /globalThis/, feature: 'GlobalThis' },
    ];

    for (const { pattern, feature } of polyfillPatterns) {
      if (pattern.test(code)) {
        polyfills.add(feature);
      }
    }

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

  const polyfills = new Set();
  if (checkForPolyfills) {
    detectPolyfills(code, polyfills);
  }

  const ast = acorn.parse(code, {
    ecmaVersion: 'latest',
    sourceType,
  });

  const allChecks = Object.entries(ES_FEATURES).map(([featureName, { astInfo }]) => ({
    featureName,
    nodeType: astInfo.nodeType,
    astInfo,
  }));

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

  const nodeTypes = [...new Set(allChecks.map((c) => c.nodeType))];
  const visitors = nodeTypes.reduce((acc, nt) => {
    acc[nt] = universalVisitor;
    return acc;
  }, {});

  walk.simple(ast, visitors);

  const unsupportedFeatures = Object.entries(ES_FEATURES).reduce((acc = [], [featureName, { minVersion }]) => {
    const isPolyfilled = checkForPolyfills && polyfills.has(featureName);
    if (foundFeatures[featureName] && minVersion > ecmaVersion && !ignoreList.has(featureName) && !isPolyfilled) {
      acc.push(featureName);
    }
    return acc;
  }, []);

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
