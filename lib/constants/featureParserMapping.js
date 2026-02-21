const FEATURE_PARSER_REQUIREMENTS = {
  ObjectSpread: 9,
  OptionalChaining: 11,
  NullishCoalescing: 11,
  LogicalAssignment: 12,
  PrivateFields: 13,
  StaticInitializationBlocks: 13,
};

function getParserVersionForFeature(featureName, targetEsVersion) {
  const requiredParser = FEATURE_PARSER_REQUIREMENTS[featureName];
  if (!requiredParser) {
    return targetEsVersion;
  }

  return Math.max(targetEsVersion, requiredParser);
}

module.exports = {
  FEATURE_PARSER_REQUIREMENTS,
  getParserVersionForFeature,
};
