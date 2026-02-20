const { test } = require("node:test");
const assert = require("assert");

const {
  FEATURE_PARSER_REQUIREMENTS,
  getMinimumParserVersion,
  getParserVersionForFeature,
} = require("../../../lib/constants/featureParserMapping");

test("FEATURE_PARSER_REQUIREMENTS should have valid mappings", () => {
  assert.strictEqual(typeof FEATURE_PARSER_REQUIREMENTS, "object");
  assert.strictEqual(FEATURE_PARSER_REQUIREMENTS.ObjectSpread, 9);
  assert.strictEqual(FEATURE_PARSER_REQUIREMENTS.OptionalChaining, 11);
  assert.strictEqual(FEATURE_PARSER_REQUIREMENTS.LogicalAssignment, 12);
});

test("getMinimumParserVersion should return target version when feature detection disabled", () => {
  assert.strictEqual(getMinimumParserVersion(8, false), 8);
  assert.strictEqual(getMinimumParserVersion(13, false), 13);
});

test("getMinimumParserVersion should return higher version when feature detection enabled", () => {
  // ES9 target should require ES9+ parser for object spread
  assert.strictEqual(getMinimumParserVersion(9, true), 9);

  // ES8 target with feature detection should still get ES8 (no special requirements)
  assert.strictEqual(getMinimumParserVersion(8, true), 8);

  // ES11 target should require ES11+ for optional chaining
  assert.strictEqual(getMinimumParserVersion(11, true), 11);
});

test("getParserVersionForFeature should return correct version for known features", () => {
  assert.strictEqual(getParserVersionForFeature("ObjectSpread", 8), 9);
  assert.strictEqual(getParserVersionForFeature("OptionalChaining", 10), 11);
  assert.strictEqual(getParserVersionForFeature("UnknownFeature", 10), 10);
});

test("getParserVersionForFeature should not downgrade target version", () => {
  assert.strictEqual(getParserVersionForFeature("ObjectSpread", 12), 12);
  assert.strictEqual(getParserVersionForFeature("OptionalChaining", 15), 15);
});