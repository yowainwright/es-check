const FEATURE_PARSER_REQUIREMENTS = {
  SpreadInArrays: 6,
  ObjectSpread: 9,
  PrivateFields: 9,
  BigInt: 9,
  NumericSeparators: 10,
  OptionalChaining: 11,
  NullishCoalescing: 11,
  LogicalAssignment: 12,
  LogicalAssignmentOr: 12,
  LogicalAssignmentNullish: 12,
  TopLevelAwait: 12,
  StaticInitializationBlocks: 13,
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
