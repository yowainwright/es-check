/**
 * Maps ES features to minimum required parser versions for syntax parsing
 * This ensures the parser can handle modern syntax even when checking older ES targets
 */
const FEATURE_PARSER_REQUIREMENTS = {
  // ES2018 (ES9) - Object spread requires ES9+ parser
  ObjectSpread: 9,

  // ES2020 (ES11) - Optional chaining requires ES11+ parser
  OptionalChaining: 11,
  NullishCoalescing: 11,

  // ES2021 (ES12) - Logical assignment requires ES12+ parser
  LogicalAssignment: 12,

  // ES2022 (ES13) - Private fields require ES13+ parser
  PrivateFields: 13,
  StaticInitializationBlocks: 13,

  // ES2023 (ES14) - No special parser requirements yet

  // ES2024 (ES15) - No special parser requirements yet

  // ES2025 (ES16) - No special parser requirements yet

  // ES2026 (ES17) - No special parser requirements yet
};

/**
 * Determines minimum parser version needed for a given target ES version
 * when using checkBrowser mode (which may encounter modern syntax)
 */
function getMinimumParserVersion(targetEsVersion, enableFeatureDetection = false) {
  if (!enableFeatureDetection) {
    return targetEsVersion;
  }

  // For feature detection mode, we need to parse modern syntax
  // Find the minimum parser version that can handle features up to target version
  let minParserVersion = targetEsVersion;

  for (const [_feature, requiredParser] of Object.entries(FEATURE_PARSER_REQUIREMENTS)) {
    // If the target supports this feature, ensure parser can handle it
    if (targetEsVersion >= requiredParser) {
      minParserVersion = Math.max(minParserVersion, requiredParser);
    }
  }

  return minParserVersion;
}

/**
 * Checks if a specific feature requires a higher parser version than the target
 */
function getParserVersionForFeature(featureName, targetEsVersion) {
  const requiredParser = FEATURE_PARSER_REQUIREMENTS[featureName];
  if (!requiredParser) {
    return targetEsVersion;
  }

  return Math.max(targetEsVersion, requiredParser);
}

module.exports = {
  FEATURE_PARSER_REQUIREMENTS,
  getMinimumParserVersion,
  getParserVersionForFeature,
};