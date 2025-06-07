const { FEATURE_TO_POLYFILL_MAP } = require('./constants');

/**
 * Detects polyfills in the code and returns a set of polyfilled feature names
 * @param {string} code - The source code to check
 * @param {Object} logger - Winston logger instance for debug output
 * @returns {Set<string>} - Set of polyfilled feature names
 */
function detectPolyfills(code, logger) {
  const polyfills = new Set();

  if (!code) return polyfills;
  const hasImport = code.includes('import');
  const hasCoreJS = code.includes('core-js');

  if (hasImport && hasCoreJS) {
    const hasArrayToSorted = code.includes('core-js/modules/es.array.to-sorted');
    const hasObjectHasOwn = code.includes('core-js/modules/es.object.has-own');
    const hasStringReplaceAll = code.includes('core-js/modules/es.string.replace-all');
    if (hasArrayToSorted) polyfills.add('ArrayToSorted');
    if (hasObjectHasOwn) polyfills.add('ObjectHasOwn');
    if (hasStringReplaceAll) polyfills.add('StringReplaceAll');
    const hasPolyfills = polyfills.size > 0;
    if (hasPolyfills) return polyfills;

    Object.entries(FEATURE_TO_POLYFILL_MAP).reduce((acc, [featureName, patterns]) => {
      if (patterns.some(pattern => pattern.test(code))) {
        acc.add(featureName);
      }
      return acc;
    }, polyfills);
  }

  const hasMatches = ['Array.prototype', 'Object.', 'String.prototype'].some(term => code.includes(term));
  const hasPolyfill = polyfills.size > 0;
  if (!hasPolyfill && !hasMatches) {
    if (logger?.isLevelEnabled?.('debug')) {
      logger.debug('ES-Check: No polyfills detected, skipping further checks');
    }
    return polyfills;
  } else if (hasPolyfill) return polyfills;
  else if (!hasMatches) return polyfills;

  Object.entries(FEATURE_TO_POLYFILL_MAP).reduce((acc, [featureName, patterns]) => {
    if (patterns.some(pattern => pattern.test(code))) {
      acc.add(featureName);
    }
    return acc;
  }, polyfills);

  if (logger?.isLevelEnabled?.('debug') && hasPolyfill) {
    logger.debug(`ES-Check: Detected polyfills: ${Array.from(polyfills).join(', ')}`);
  }

  return polyfills;
}

/**
 * Filters unsupported features by removing those that have been polyfilled
 * @param {Array<string>} unsupportedFeatures - List of unsupported features
 * @param {Set<string>} polyfills - Set of polyfilled feature names
 * @returns {Array<string>} - Filtered list of unsupported features
 */
function filterPolyfilled(unsupportedFeatures, polyfills) {
  const hasPolyfills = polyfills && polyfills.size > 0;
  if (!hasPolyfills) return unsupportedFeatures;
  return unsupportedFeatures.filter(feature => !polyfills.has(feature));
}

module.exports = {
  detectPolyfills,
  filterPolyfilled
};
