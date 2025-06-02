const { FEATURE_TO_POLYFILL_MAP } = require('./constants');

/**
 * Detects polyfills in the code and returns a set of polyfilled feature names
 * @param {string} code - The source code to check
 * @param {Object} logger - Winston logger instance for debug output
 * @returns {Set<string>} - Set of polyfilled feature names
 */
function detectPolyfills(code, logger) {
  const polyfills = new Set();

  if (!code) {
    return polyfills;
  }

  if (code.includes('import') && code.includes('core-js')) {
    if (code.includes('core-js/modules/es.array.to-sorted')) {
      polyfills.add('ArrayToSorted');
    }
    if (code.includes('core-js/modules/es.object.has-own')) {
      polyfills.add('ObjectHasOwn');
    }
    if (code.includes('core-js/modules/es.string.replace-all')) {
      polyfills.add('StringReplaceAll');
    }

    if (polyfills.size > 0) {
      return polyfills;
    }

    for (const [featureName, patterns] of Object.entries(FEATURE_TO_POLYFILL_MAP)) {
      for (const pattern of patterns) {
        if (pattern.test(code)) {
          polyfills.add(featureName);
          break;
        }
      }
    }
  }

  if (polyfills.size === 0 && (code.includes('polyfill') || code.includes('Array.prototype') || code.includes('Object.') || code.includes('String.prototype'))) {
  } else if (polyfills.size > 0) {
    return polyfills;
  } else if (!code.includes('core-js') && !code.includes('polyfill') && !code.includes('Array.prototype')) {
    return polyfills;
  }

  for (const [featureName, patterns] of Object.entries(FEATURE_TO_POLYFILL_MAP)) {
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        polyfills.add(featureName);
        break;
      }
    }
  }

  if (logger?.isLevelEnabled?.('debug') && polyfills.size > 0) {
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
  if (!polyfills || polyfills.size === 0) {
    return unsupportedFeatures;
  }

  return unsupportedFeatures.filter(feature => !polyfills.has(feature));
}

module.exports = {
  detectPolyfills,
  filterPolyfilled
};
