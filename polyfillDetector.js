const { FEATURE_TO_POLYFILL_MAP } = require('./constants');

/**
 * Detects polyfills in the code and returns a set of polyfilled feature names.
 *
 * @param {string} code - The source code to check.
 * @param {object} logger - A required logger instance.
 * @param {object} [featureMap=FEATURE_TO_POLYFILL_MAP] - The map of features.
 * @returns {Set<string>} - A set of polyfilled feature names.
 */
function detectPolyfills(code, logger, featureMap = FEATURE_TO_POLYFILL_MAP) {
    const polyfills = new Set();
    if (!code || !featureMap) return polyfills;

    // Since logger is required, we can use it without checking for its existence.
    // The optional chaining (?.) is still good practice for properties like isLevelEnabled.
    if (logger?.isLevelEnabled?.('debug')) {
        // We can log at the beginning if needed, or at the end.
    }

    const polyfillFeatures = Object.entries(featureMap);
    polyfillFeatures.forEach(([feature, patterns]) => {
      const isPolyfilled = patterns.some(pattern => pattern.test(code));
      if (isPolyfilled) polyfills.add(feature);
    });

    if (logger?.isLevelEnabled?.('debug')) {
      const hasPolyfills = polyfills.size > 0;
      if (hasPolyfills) logger.debug(`ES-Check: Detected polyfills: ${Array.from(polyfills).join(', ')}`);
      else logger.debug('ES-Check: No polyfills detected.');
    }

    return polyfills;
}

/**
 * Filters unsupported features by removing those that have been polyfilled.
 * @param {Array<string>} unsupportedFeatures - List of unsupported features
 * @param {Set<string>} polyfills - Set of polyfilled feature names
 * @returns {Array<string>} - Filtered list of unsupported features
 */
const filterPolyfilled = (unsupportedFeatures, polyfills) => {
  const hasPolyfills = polyfills && polyfills.size > 0;
  if (!hasPolyfills) return unsupportedFeatures;
  return unsupportedFeatures.filter(feature => !polyfills.has(feature));
}

module.exports = {
  detectPolyfills,
  filterPolyfilled
};
