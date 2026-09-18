#!/usr/bin/env node

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { BROWSER_SUPPORT_BROWSERS, FEATURE_BCD_PATHS } from "../../constants.mjs";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const bcd = require("@mdn/browser-compat-data");
const { ES_GLOBAL_MIN_VERSION } = require("../../../lib/constants/es-features/globals");

const GLOBAL_BCD_PREFIX = "javascript.builtins.";
const VERSION_PATTERN = /^\d+(\.\d+)*$/;

function getNestedProperty(obj, path) {
  return path.split(".").reduce((current, key) => current && current[key], obj);
}

function collectFeaturePaths() {
  const globalPaths = Object.fromEntries(
    Object.keys(ES_GLOBAL_MIN_VERSION).map((name) => [name, `${GLOBAL_BCD_PREFIX}${name}`]),
  );
  return { ...globalPaths, ...FEATURE_BCD_PATHS };
}

function normalizeVersion(versionAdded) {
  const isUnknownButSupported = versionAdded === true;
  if (isUnknownButSupported) return true;

  const isUnsupported =
    versionAdded === false || versionAdded === null || versionAdded === undefined;
  if (isUnsupported) return false;

  const isPreview = versionAdded === "preview";
  if (isPreview) return false;

  const stripped = String(versionAdded).replace(/^≤/, "");
  const isValid = VERSION_PATTERN.test(stripped);
  return isValid ? stripped : false;
}

function compareVersions(a, b) {
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);
  const length = Math.max(aParts.length, bParts.length);

  let index = 0;
  while (index < length) {
    const diff = (aParts[index] || 0) - (bParts[index] || 0);
    if (diff !== 0) return diff;
    index += 1;
  }

  return 0;
}

function isStandardSupport(statement) {
  const hasFlags = Boolean(statement.flags);
  const hasAlternateName = Boolean(statement.alternative_name);
  const hasPrefix = Boolean(statement.prefix);
  return !hasFlags && !hasAlternateName && !hasPrefix;
}

function pickEarliestVersion(statements) {
  const candidates = statements
    .filter(isStandardSupport)
    .map((statement) => normalizeVersion(statement.version_added));

  const hasUnknownSupport = candidates.includes(true);
  if (hasUnknownSupport) return true;

  const versions = candidates.filter((candidate) => typeof candidate === "string");
  const hasNoVersion = versions.length === 0;
  if (hasNoVersion) return false;

  return versions.reduce((earliest, version) =>
    compareVersions(version, earliest) < 0 ? version : earliest,
  );
}

function resolveSupport(compatData) {
  const support = compatData?.__compat?.support;
  if (!support) return null;

  const entries = BROWSER_SUPPORT_BROWSERS.map((browser) => {
    const statements = support[browser];
    if (!statements) return null;
    return [browser, pickEarliestVersion([].concat(statements))];
  }).filter(Boolean);

  const hasNoEntries = entries.length === 0;
  if (hasNoEntries) return null;

  return Object.fromEntries(entries);
}

function generateBrowserSupport() {
  const featurePaths = collectFeaturePaths();
  const browserSupport = {};

  for (const [featureName, bcdPath] of Object.entries(featurePaths)) {
    const compatData = getNestedProperty(bcd, bcdPath);
    const resolved = resolveSupport(compatData);
    if (!resolved) {
      throw new Error(`No browser-compat-data found for ${featureName} at ${bcdPath}`);
    }
    browserSupport[featureName] = resolved;
  }

  return browserSupport;
}

function formatVersion(version) {
  return typeof version === "string" ? `"${version}"` : String(version);
}

function formatFeature(featureName, support) {
  const lines = Object.entries(support).map(
    ([browser, version]) => `    ${browser}: ${formatVersion(version)},`,
  );
  return `  ${featureName}: {\n${lines.join("\n")}\n  },`;
}

function createModuleTemplate(browserSupport) {
  const sortedFeatures = Object.keys(browserSupport).sort();
  const body = sortedFeatures
    .map((featureName) => formatFeature(featureName, browserSupport[featureName]))
    .join("\n");

  return `const FEATURE_BROWSER_SUPPORT = {
${body}
};

module.exports = { FEATURE_BROWSER_SUPPORT };
`;
}

function getOutputPath() {
  return join(__dirname, "../../../lib/constants/es-features/browserSupport.js");
}

function main() {
  const browserSupport = generateBrowserSupport();
  writeFileSync(getOutputPath(), createModuleTemplate(browserSupport));
}

main();
