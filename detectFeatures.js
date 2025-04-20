const acorn = require('acorn');
const walk = require('acorn-walk');
const { ES_FEATURES } = require('./constants');
const { checkMap } = require('./utils');

const detectFeatures = (code, ecmaVersion, sourceType, ignoreList = new Set()) => {
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
    if (foundFeatures[featureName] && minVersion > ecmaVersion) {
      acc.push(featureName);
    }
    return acc;
  }, []);

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
