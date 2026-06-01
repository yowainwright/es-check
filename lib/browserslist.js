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

  let versionIndex = 0;
  while (versionIndex < browserVersions.length) {
    const v = browserVersions[versionIndex];
    if (v <= targetVersion) {
      matchedVersion = v.toString();
    } else {
      break;
    }
    versionIndex += 1;
  }

  const hasNoMatchedVersion = matchedVersion === null;
  const isModernDefaultBrowser = browser === "chrome" || browser === "firefox";
  const shouldUseModernDefault = hasNoMatchedVersion && isModernDefaultBrowser;

  if (shouldUseModernDefault) {
    return 6;
  }

  if (hasNoMatchedVersion) {
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

    const hasNoBrowsers = !browsers || browsers.length === 0;
    if (hasNoBrowsers) {
      return 5;
    }

    const hasIE = browsers.some((browser) => browser.includes("ie "));
    const hasOldEdge = browsers.some((browser) => {
      const [name, version] = browser.split(" ");
      const isEdge = name === "edge";
      const edgeVersion = parseInt(version, 10);
      const isOldEdge = edgeVersion < 79;
      return isEdge && isOldEdge;
    });

    const hasLegacyBrowser = hasIE || hasOldEdge;
    if (hasLegacyBrowser) {
      return 5;
    }

    const hasLegacyPath = browserslistPath && browserslistPath.includes("legacy");
    const hasLegacyEnv = browserslistEnv && browserslistEnv.includes("legacy");
    const hasLegacyConfig = hasLegacyPath || hasLegacyEnv;

    if (hasLegacyConfig) {
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
