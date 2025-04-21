/**
 * Polyfill detection module for es-check
 * Only loaded when --checkForPolyfills flag is enabled
 */

/**
 * Maps feature names from ES_FEATURES to their polyfill patterns
 * This helps us identify which features are being polyfilled
 */
const FEATURE_TO_POLYFILL_MAP = {
  // Array methods
  'ArrayToSorted': [
    /Array\.prototype\.toSorted/,
    /from\s+['"]core-js\/modules\/es\.array\.to-sorted['"]/
  ],
  'ArrayFindLast': [
    /Array\.prototype\.findLast/,
    /from\s+['"]core-js\/modules\/es\.array\.find-last['"]/
  ],
  'ArrayFindLastIndex': [
    /Array\.prototype\.findLastIndex/,
    /from\s+['"]core-js\/modules\/es\.array\.find-last-index['"]/
  ],
  'ArrayAt': [
    /Array\.prototype\.at/,
    /from\s+['"]core-js\/modules\/es\.array\.at['"]/
  ],

  // String methods
  'StringReplaceAll': [
    /String\.prototype\.replaceAll/,
    /from\s+['"]core-js\/modules\/es\.string\.replace-all['"]/
  ],
  'StringMatchAll': [
    /String\.prototype\.matchAll/,
    /from\s+['"]core-js\/modules\/es\.string\.match-all['"]/
  ],
  'StringAt': [
    /String\.prototype\.at/,
    /from\s+['"]core-js\/modules\/es\.string\.at['"]/
  ],

  // Object methods
  'ObjectHasOwn': [
    /Object\.hasOwn/,
    /from\s+['"]core-js\/modules\/es\.object\.has-own['"]/
  ],

  // Promise methods
  'PromiseAny': [
    /Promise\.any/,
    /from\s+['"]core-js\/modules\/es\.promise\.any['"]/
  ],

  // RegExp methods
  'RegExpExec': [
    /RegExp\.prototype\.exec/,
    /from\s+['"]core-js\/modules\/es\.regexp\.exec['"]/
  ],

  // Global methods
  'GlobalThis': [
    /globalThis/,
    /from\s+['"]core-js\/modules\/es\.global-this['"]/
  ],
};

/**
 * Detects polyfills in the code and returns a set of polyfilled feature names
 * @param {string} code - The source code to check
 * @param {Object} logger - Winston logger instance for debug output
 * @returns {Set<string>} - Set of polyfilled feature names
 */
function detectPolyfills(code, logger) {
  const polyfills = new Set();

  // Quick check if the code is empty
  if (!code) {
    return polyfills;
  }

  // Special handling for core-js imports
  if (code.includes('import') && code.includes('core-js')) {
    // Direct check for specific import patterns
    if (code.includes('core-js/modules/es.array.to-sorted')) {
      polyfills.add('ArrayToSorted');
    }
    if (code.includes('core-js/modules/es.object.has-own')) {
      polyfills.add('ObjectHasOwn');
    }
    if (code.includes('core-js/modules/es.string.replace-all')) {
      polyfills.add('StringReplaceAll');
    }

    // If we found specific imports, return early
    if (polyfills.size > 0) {
      return polyfills;
    }

    // Otherwise, fall back to pattern matching
    for (const [featureName, patterns] of Object.entries(FEATURE_TO_POLYFILL_MAP)) {
      for (const pattern of patterns) {
        if (pattern.test(code)) {
          polyfills.add(featureName);
          break;
        }
      }
    }
  }

  // Check for polyfill patterns if no polyfills were found yet or if code contains polyfill keywords
  if (polyfills.size === 0 && (code.includes('polyfill') || code.includes('Array.prototype') || code.includes('Object.') || code.includes('String.prototype'))) {
    // Continue with pattern matching
  } else if (polyfills.size > 0) {
    // We already found polyfills, return them
    return polyfills;
  } else if (!code.includes('core-js') && !code.includes('polyfill') && !code.includes('Array.prototype')) {
    // No polyfill indicators found
    return polyfills;
  }

  // Check each feature's polyfill patterns
  for (const [featureName, patterns] of Object.entries(FEATURE_TO_POLYFILL_MAP)) {
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        polyfills.add(featureName);
        break; // Once we find one pattern match, we can move to the next feature
      }
    }
  }

  // Log detected polyfills if debug is enabled
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
