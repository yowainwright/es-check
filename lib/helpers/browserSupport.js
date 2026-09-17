const { FEATURE_BROWSER_SUPPORT } = require("../constants/es-features/browserSupport");

function compareVersions(a, b) {
  const aParts = String(a).split(".").map(Number);
  const bParts = String(b).split(".").map(Number);
  const length = Math.max(aParts.length, bParts.length);

  let index = 0;
  while (index < length) {
    const diff = (aParts[index] || 0) - (bParts[index] || 0);
    if (diff !== 0) return diff;
    index += 1;
  }

  return 0;
}

function isVersionSupported(targetVersion, versionAdded) {
  const isSupportedWithoutVersion = versionAdded === true;
  if (isSupportedWithoutVersion) return true;

  const isNeverSupported = versionAdded === false;
  if (isNeverSupported) return false;

  return compareVersions(targetVersion, versionAdded) >= 0;
}

function keepLowestVersionPerBrowser(browsers) {
  const lowestByName = new Map();

  browsers.forEach((browser) => {
    const current = lowestByName.get(browser.name);
    const isLower = !current || compareVersions(browser.version, current.version) < 0;
    if (isLower) lowestByName.set(browser.name, browser);
  });

  return Array.from(lowestByName.values());
}

function getUnsupportedBrowsers(
  featureName,
  targetBrowsers,
  browserSupport = FEATURE_BROWSER_SUPPORT,
) {
  const support = browserSupport[featureName];
  const hasNoTargets = !targetBrowsers || targetBrowsers.length === 0;
  const hasNoData = !support || hasNoTargets;
  if (hasNoData) return [];

  const unsupported = targetBrowsers.filter((browser) => {
    const versionAdded = support[browser.name];
    const hasBrowserData = versionAdded !== undefined;
    if (!hasBrowserData) return false;
    return !isVersionSupported(browser.version, versionAdded);
  });

  return keepLowestVersionPerBrowser(unsupported).map((browser) => ({
    name: browser.name,
    version: browser.version,
    requiredVersion: support[browser.name],
  }));
}

function formatBrowserRequirement({ name, version, requiredVersion }) {
  const isNeverSupported = requiredVersion === false;
  if (isNeverSupported) return `${name} ${version} has no support`;
  return `${name} ${version} requires ${requiredVersion}`;
}

function formatFeatureWithBrowsers(featureName, unsupportedBrowsers) {
  const hasNoBrowsers = !unsupportedBrowsers || unsupportedBrowsers.length === 0;
  if (hasNoBrowsers) return featureName;

  const requirements = unsupportedBrowsers.map(formatBrowserRequirement).join(", ");
  return `${featureName} (${requirements})`;
}

function formatTargetBrowsers(targetBrowsers) {
  return targetBrowsers.map((browser) => `${browser.name} ${browser.version}`).join(", ");
}

module.exports = {
  compareVersions,
  isVersionSupported,
  getUnsupportedBrowsers,
  formatBrowserRequirement,
  formatFeatureWithBrowsers,
  formatTargetBrowsers,
};
