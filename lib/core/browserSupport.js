const { FEATURE_BROWSER_SUPPORT } = require("../constants/browserslist");

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

  return keepLowestVersionPerBrowser(unsupported).map((browser) => {
    const requiredVersion = getRequiredVersion(browser.version, support[browser.name]);
    return { name: browser.name, version: browser.version, requiredVersion };
  });
}

function isVersionSupported(targetVersion, versionAdded) {
  if (Array.isArray(versionAdded)) {
    return versionAdded.some((period) => isSupportPeriod(targetVersion, period));
  }
  const isSupportedWithoutVersion = versionAdded === true;
  if (isSupportedWithoutVersion) return true;

  const isNeverSupported = versionAdded === false;
  if (isNeverSupported) return false;

  return compareVersions(targetVersion, versionAdded) >= 0;
}

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

function formatFeatureWithBrowsers(featureName, unsupportedBrowsers) {
  const hasNoBrowsers = !unsupportedBrowsers || unsupportedBrowsers.length === 0;
  if (hasNoBrowsers) return featureName;

  const requirements = unsupportedBrowsers.map(formatBrowserRequirement).join(", ");
  return `${featureName} (${requirements})`;
}

function formatBrowserRequirement({ name, version, requiredVersion }) {
  const isNeverSupported = requiredVersion === false;
  if (isNeverSupported) return `${name} ${version} has no support`;
  return `${name} ${version} requires ${requiredVersion}`;
}

function formatTargetBrowsers(targetBrowsers) {
  return targetBrowsers.map((browser) => `${browser.name} ${browser.version}`).join(", ");
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

function getRequiredVersion(targetVersion, support) {
  if (!Array.isArray(support)) return support;
  const next = support.find((period) => {
    const added = period.version_added;
    if (typeof added !== "string") return false;
    return compareVersions(targetVersion, added) < 0;
  });
  return next?.version_added || false;
}

function isSupportPeriod(targetVersion, period) {
  const added = period.version_added;
  if (added === false) return false;
  const supportsStart = added === true || compareVersions(targetVersion, added) >= 0;
  if (!supportsStart) return false;
  const removed = period.version_removed;
  if (removed === true) return false;
  if (!removed) return true;
  return compareVersions(targetVersion, removed) < 0;
}

module.exports = {
  compareVersions,
  isVersionSupported,
  getUnsupportedBrowsers,
  formatBrowserRequirement,
  formatFeatureWithBrowsers,
  formatTargetBrowsers,
};
