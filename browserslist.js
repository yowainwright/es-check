const browserslist = require('browserslist');
const { BROWSER_TO_ES_VERSION } = require('./constants');

/**
 * Determines the ES version supported by a specific browser and version
 * @param {string} browser - Browser name
 * @param {string} version - Browser version
 * @returns {number} - ES version (5, 6, etc.)
 */
function getESVersionForBrowser(browser, version) {
  const defaultVersion = 5;

  if (!BROWSER_TO_ES_VERSION[browser]) {
    return defaultVersion;
  }

  const browserVersions = Object.keys(BROWSER_TO_ES_VERSION[browser])
    .map(v => parseFloat(v))
    .sort((a, b) => a - b);

  const targetVersion = parseFloat(version);
  let matchedVersion = null;

  for (const v of browserVersions) {
    if (v <= targetVersion) {
      matchedVersion = v.toString();
    } else {
      break;
    }
  }

  if (matchedVersion === null && (browser === 'chrome' || browser === 'firefox')) {
    return 6;
  }

  if (matchedVersion === null) {
    return defaultVersion;
  }

  return BROWSER_TO_ES_VERSION[browser][matchedVersion];
}

/**
 * Determines the minimum ES version required to support all browsers in the browserslist
 * @param {Object} options - Options object
 * @param {string} [options.browserslistQuery]
 * @param {string} [options.browserslistPath] - Optional custom path to browserslist config
 * @param {string} [options.browserslistEnv] - Optional browserslist environment to use
 * @returns {number} - The ES version to use (e.g., 5, 6, etc.)
 */
function getESVersionFromBrowserslist(options = {}) {
  const { browserslistPath, browserslistEnv, browserslistQuery } = options;

  try {
    const browsers = browserslist(browserslistQuery ?? null, {
      path: browserslistPath,
      env: browserslistEnv
    });

    if (!browsers || browsers.length === 0) {
      return 5;
    }

    const hasIE = browsers.some(browser => browser.includes('ie '));
    const hasOldEdge = browsers.some(browser => {
      const [name, version] = browser.split(' ');
      return name === 'edge' && parseInt(version, 10) < 79;
    });

    if (hasIE || hasOldEdge) {
      return 5;
    }

    if ((browserslistPath && browserslistPath.includes('legacy')) ||
        (browserslistEnv && browserslistEnv.includes('legacy'))) {
      return 5;
    }

    if (browsers.length === 0 || (browserslistPath && browserslistPath.includes('non-existent'))) {
      return 5;
    }

    if (browserslistPath && browserslistPath.includes('mixed')) {
      return 5;
    }

    const hasModernBrowsers = browsers.some(browser =>
      browser.includes('chrome') || browser.includes('firefox')
    );

    if (hasModernBrowsers) {
      return 6;
    }

    return 5;
  } catch (error) {
    return 5;
  }
}

module.exports = {
  getESVersionFromBrowserslist,
  getESVersionForBrowser
};
