const browserslist = require("browserslist");
const { BROWSER_TO_ES_VERSION } = require("./constants/versions");

const BROWSER_VERSION_ENTRIES = Object.fromEntries(
  Object.entries(BROWSER_TO_ES_VERSION).map(([browser, versions]) => [
    browser,
    Object.keys(versions)
      .map((version) => ({
        version,
        numericVersion: parseFloat(version),
      }))
      .sort((a, b) => a.numericVersion - b.numericVersion),
  ]),
);

function getESVersionForBrowser(browser, version) {
  const defaultVersion = 5;
  const browserVersions = BROWSER_VERSION_ENTRIES[browser];

  if (!browserVersions) {
    return defaultVersion;
  }

  const targetVersion = parseFloat(version);
  let matchedVersion = null;

  for (const entry of browserVersions) {
    if (entry.numericVersion <= targetVersion) {
      matchedVersion = entry.version;
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
