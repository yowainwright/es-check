#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const bcd = require("@mdn/browser-compat-data");
const { ES_FEATURES } = require("../lib/constants");

const ES_VERSION_TO_YEAR = {
  5: 2009,
  6: 2015,
  7: 2016,
  8: 2017,
  9: 2018,
  10: 2019,
  11: 2020,
  12: 2021,
  13: 2022,
  14: 2023,
  15: 2024,
  16: 2025,
  17: 2026,
};

const CHROME_TO_ES = {
  46: 6,
  55: 7,
  58: 8,
  60: 9,
  75: 10,
  80: 11,
  85: 12,
  93: 13,
  97: 14,
  117: 15,
  136: 16,
  150: 17,
};

function isValidChromeVersion(chromeVersion) {
  return chromeVersion && chromeVersion !== false;
}

function parseChromeVersion(chromeVersion) {
  return parseInt(chromeVersion, 10);
}

function findBestESMatch(chromeVersion) {
  let bestMatch = 5;
  for (const [chromeV, esV] of Object.entries(CHROME_TO_ES)) {
    if (chromeVersion >= parseInt(chromeV, 10)) {
      bestMatch = esV;
    }
  }
  return bestMatch;
}

function chromeVersionToParserVersion(chromeVersion) {
  if (!isValidChromeVersion(chromeVersion)) return 5;
  const version = parseChromeVersion(chromeVersion);
  return findBestESMatch(version);
}

const FEATURE_MDN_MAPPING = {
  ObjectSpread: "javascript.operators.spread.spread_in_object_literals",
  SpreadInArrays: "javascript.operators.spread.spread_in_arrays",
  OptionalChaining: "javascript.operators.optional_chaining",
  NullishCoalescing: "javascript.operators.nullish_coalescing",
  LogicalAssignment: "javascript.operators.logical_and_assignment",
  LogicalAssignmentOr: "javascript.operators.logical_or_assignment",
  LogicalAssignmentNullish:
    "javascript.operators.nullish_coalescing_assignment",
  PrivateFields: "javascript.classes.private_class_fields",
  StaticInitializationBlocks: "javascript.classes.static.initialization_blocks",
  TopLevelAwait: "javascript.operators.await.top_level",
  BigInt: "javascript.builtins.BigInt",
  NumericSeparators: "javascript.grammar.numeric_separators",
};
function hasCompatSupport(compatData) {
  return compatData && compatData.__compat && compatData.__compat.support;
}

function extractChromeSupport(compatData) {
  return compatData.__compat.support.chrome;
}

function getChromeVersion(compatData) {
  if (!hasCompatSupport(compatData)) return null;

  const chromeSupport = extractChromeSupport(compatData);
  if (!chromeSupport) return null;

  return chromeSupport.version_added;
}

function getNestedProperty(obj, path) {
  return path.split(".").reduce((current, key) => {
    return current && current[key];
  }, obj);
}

function getCompatDataForFeature(featureName, mdnPath) {
  return getNestedProperty(bcd, mdnPath);
}

function shouldIncludeFeature(requiredParserVersion) {
  return requiredParserVersion > 5;
}

function processFeature(featureName, mdnPath) {
  const compatData = getCompatDataForFeature(featureName, mdnPath);

  if (!compatData) {
    return null;
  }

  const chromeVersion = getChromeVersion(compatData);

  if (!chromeVersion) {
    return null;
  }

  const requiredParserVersion = chromeVersionToParserVersion(chromeVersion);

  if (!shouldIncludeFeature(requiredParserVersion)) {
    return null;
  }

  return { featureName, requiredParserVersion };
}

function generateParserRequirements() {
  const parserRequirements = {};

  for (const [featureName, mdnPath] of Object.entries(FEATURE_MDN_MAPPING)) {
    const result = processFeature(featureName, mdnPath);

    if (result) {
      parserRequirements[result.featureName] = result.requiredParserVersion;
    }
  }

  return parserRequirements;
}
function sortEntriesByVersion(entries) {
  return entries.sort(([, a], [, b]) => a - b);
}

function formatEntry(feature, version) {
  return `  ${feature}: ${version},`;
}

function formatEntries(parserRequirements) {
  const entries = Object.entries(parserRequirements);
  const sortedEntries = sortEntriesByVersion(entries);
  return sortedEntries
    .map(([feature, version]) => formatEntry(feature, version))
    .join("\n");
}

function createModuleTemplate(formattedEntries) {
  return `const FEATURE_PARSER_REQUIREMENTS = {
${formattedEntries}
};

function getParserVersionForFeature(featureName, targetEsVersion) {
  const requiredParser = FEATURE_PARSER_REQUIREMENTS[featureName];
  if (!requiredParser) {
    return targetEsVersion;
  }

  return Math.max(targetEsVersion, requiredParser);
}

function getMinimumParserVersion(
  targetEsVersion,
  enableFeatureDetection = false,
) {
  if (!enableFeatureDetection) {
    return targetEsVersion;
  }

  let minParserVersion = targetEsVersion;

  for (const [_feature, requiredParser] of Object.entries(
    FEATURE_PARSER_REQUIREMENTS,
  )) {
    if (targetEsVersion >= requiredParser) {
      minParserVersion = Math.max(minParserVersion, requiredParser);
    }
  }

  return minParserVersion;
}

module.exports = {
  FEATURE_PARSER_REQUIREMENTS,
  getParserVersionForFeature,
  getMinimumParserVersion,
};
`;
}

function generateFileContent(parserRequirements) {
  const formattedEntries = formatEntries(parserRequirements);
  return createModuleTemplate(formattedEntries);
}

function hasValidRequirements(parserRequirements) {
  return Object.keys(parserRequirements).length > 0;
}

function getOutputPath() {
  return path.join(__dirname, "../lib/constants/featureParserMapping.js");
}

function writeToFile(filePath, content) {
  fs.writeFileSync(filePath, content);
}

function main() {
  const parserRequirements = generateParserRequirements();

  if (!hasValidRequirements(parserRequirements)) {
    process.exit(1);
  }

  const fileContent = generateFileContent(parserRequirements);
  const outputPath = getOutputPath();

  writeToFile(outputPath, fileContent);
}

try {
  main();
} catch (error) {
  process.exit(1);
}
