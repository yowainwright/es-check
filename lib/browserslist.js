const browserslist = require("browserslist");
const { BROWSER_TO_ES_VERSION, BROWSERSLIST_TO_BCD } = require("./constants/versions");

const UNVERSIONED_BROWSER_VERSIONS = new Set(["all", "TP"]);

function resolveBrowsers(options = {}) {
  const { browserslistPath, browserslistEnv, browserslistQuery } = options;

  return browserslist(browserslistQuery ?? null, {
    config: browserslistPath,
    env: browserslistEnv,
  });
}

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
  const { browserslistPath, browserslistEnv } = options;

  try {
    const browsers = resolveBrowsers(options);

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

function parseBrowserVersion(version) {
  const hasVersion = typeof version === "string" && version.length > 0;
  if (!hasVersion) return null;

  const lowerBound = version.split("-")[0];
  const isUnversioned = UNVERSIONED_BROWSER_VERSIONS.has(lowerBound);
  if (isUnversioned) return null;

  return lowerBound;
}

function toTargetBrowser(entry) {
  const [browserslistName, version] = entry.split(" ");
  const name = BROWSERSLIST_TO_BCD[browserslistName];
  const parsedVersion = parseBrowserVersion(version);

  const isUnknownBrowser = !name;
  const isUnknownVersion = parsedVersion === null;
  const isUnknownTarget = isUnknownBrowser || isUnknownVersion;
  if (isUnknownTarget) return null;

  return { name, version: parsedVersion, browserslistName };
}

function getTargetBrowsers(options = {}) {
  let browsers;

  try {
    browsers = resolveBrowsers(options);
  } catch {
    return [];
  }

  const hasNoBrowsers = !browsers || browsers.length === 0;
  if (hasNoBrowsers) return [];

  return browsers.map(toTargetBrowser).filter(Boolean);
}

module.exports = {
  getESVersionFromBrowserslist,
  getESVersionForBrowser,
  getTargetBrowsers,
};
