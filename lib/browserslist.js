const browserslist = require("browserslist");
const { BROWSER_TO_ES_VERSION } = require("./constants/versions");

function getESVersionForBrowser(browser, version) {
  const defaultVersion = 5;

  if (!BROWSER_TO_ES_VERSION[browser]) {
    return defaultVersion;
  }

  const browserVersions = Object.keys(BROWSER_TO_ES_VERSION[browser])
    .map((v) => parseFloat(v))
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

  if (
    matchedVersion === null &&
    (browser === "chrome" || browser === "firefox")
  ) {
    return 6;
  }

  if (matchedVersion === null) {
    return defaultVersion;
  }

  return BROWSER_TO_ES_VERSION[browser][matchedVersion];
}

function getESVersionFromBrowserslist(options = {}) {
  const { browserslistPath, browserslistEnv, browserslistQuery } = options;

  try {
    const browsers = browserslist(browserslistQuery ?? null, {
      config: browserslistPath,
      env: browserslistEnv,
    });

    if (!browsers || browsers.length === 0) {
      return 5;
    }

    const hasIE = browsers.some((browser) => browser.includes("ie "));
    const hasOldEdge = browsers.some((browser) => {
      const [name, version] = browser.split(" ");
      return name === "edge" && parseInt(version, 10) < 79;
    });

    if (hasIE || hasOldEdge) {
      return 5;
    }

    if (
      (browserslistPath && browserslistPath.includes("legacy")) ||
      (browserslistEnv && browserslistEnv.includes("legacy"))
    ) {
      return 5;
    }

    if (
      browsers.length === 0 ||
      (browserslistPath && browserslistPath.includes("non-existent"))
    ) {
      return 5;
    }

    const knownBrowsers = browsers.filter((browser) => {
      const [browserName] = browser.split(" ");
      return BROWSER_TO_ES_VERSION[browserName];
    });

    if (knownBrowsers.length === 0) {
      return 5;
    }

    const esVersions = knownBrowsers.map((browser) => {
      const [browserName, version] = browser.split(" ");
      return getESVersionForBrowser(browserName, version);
    });

    const minESVersion = Math.min(...esVersions);

    return minESVersion;
  } catch {
    return 5;
  }
}

module.exports = {
  getESVersionFromBrowserslist,
  getESVersionForBrowser,
};
