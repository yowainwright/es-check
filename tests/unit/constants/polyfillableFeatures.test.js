const { test } = require("node:test");
const assert = require("assert");

const {
  getPolyfillableFeatures,
  POLYFILLABLE_FEATURES,
  CORE_JS_POLYFILLABLE
} = require("../../../lib/constants/polyfillableFeatures");

test("getPolyfillableFeatures should return core-js set when library is 'core-js'", () => {
  const result = getPolyfillableFeatures("core-js");
  assert.strictEqual(result, CORE_JS_POLYFILLABLE);
});

test("getPolyfillableFeatures should return core-js set when library is 'CORE-JS' (case insensitive)", () => {
  const result = getPolyfillableFeatures("CORE-JS");
  assert.strictEqual(result, CORE_JS_POLYFILLABLE);
});

test("getPolyfillableFeatures should return default set when library is undefined", () => {
  const result = getPolyfillableFeatures();
  assert.strictEqual(result, POLYFILLABLE_FEATURES);
});

test("getPolyfillableFeatures should return default set when library is unknown", () => {
  const result = getPolyfillableFeatures("unknown-lib");
  assert.strictEqual(result, POLYFILLABLE_FEATURES);
});

test("getPolyfillableFeatures should handle edge cases gracefully", () => {
  assert.strictEqual(getPolyfillableFeatures(null), POLYFILLABLE_FEATURES);
  assert.strictEqual(getPolyfillableFeatures(0), POLYFILLABLE_FEATURES);
  assert.strictEqual(getPolyfillableFeatures(false), POLYFILLABLE_FEATURES);
  assert.strictEqual(getPolyfillableFeatures(123), POLYFILLABLE_FEATURES);
  assert.strictEqual(getPolyfillableFeatures({}), POLYFILLABLE_FEATURES);
  assert.strictEqual(getPolyfillableFeatures([]), POLYFILLABLE_FEATURES);
});

test("getPolyfillableFeatures should handle objects that throw on toString", () => {
  const badObject = {
    toString: () => { throw new Error("Cannot convert"); },
    valueOf: () => { throw new Error("Cannot convert"); }
  };
  const result = getPolyfillableFeatures(badObject);
  assert.strictEqual(result, POLYFILLABLE_FEATURES);
});

test("CORE_JS_POLYFILLABLE should include common Array methods", () => {
  assert.strictEqual(CORE_JS_POLYFILLABLE.has("ArrayToSorted"), true);
  assert.strictEqual(CORE_JS_POLYFILLABLE.has("ArrayToReversed"), true);
  assert.strictEqual(CORE_JS_POLYFILLABLE.has("ArrayWith"), true);
});

test("CORE_JS_POLYFILLABLE should include ES2023+ Array methods", () => {
  assert.strictEqual(CORE_JS_POLYFILLABLE.has("Array.prototype.toSorted"), true);
  assert.strictEqual(CORE_JS_POLYFILLABLE.has("Array.prototype.toReversed"), true);
  assert.strictEqual(CORE_JS_POLYFILLABLE.has("Array.prototype.with"), true);
});

test("POLYFILLABLE_FEATURES should be a superset of CORE_JS_POLYFILLABLE", () => {
  for (const feature of CORE_JS_POLYFILLABLE) {
    assert.strictEqual(POLYFILLABLE_FEATURES.has(feature), true, `Missing feature: ${feature}`);
  }
});