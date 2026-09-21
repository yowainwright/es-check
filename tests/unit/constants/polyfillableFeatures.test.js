const { test } = require("node:test");
const assert = require("assert");

const {
  POLYFILLABLE_FEATURES,
  CORE_JS_POLYFILLABLE,
} = require("../../../lib/constants/polyfillableFeatures");
const { getPolyfillableFeatures } = require("../../../lib/detectFeatures");
const { ES_FEATURES, ES_GLOBAL_MIN_VERSION } = require("../../../lib/constants");
const coreJsModules = new Set(require("core-js-compat/modules"));
const scriptConstants = import("../../../scripts/constants.mjs");

test("core-js mappings should reference known features and upstream modules", async () => {
  const { FEATURE_CORE_JS_MODULES } = await scriptConstants;
  const featureKeys = Object.keys(ES_FEATURES);
  const globalKeys = Object.keys(ES_GLOBAL_MIN_VERSION);
  const allFeatureKeys = featureKeys.concat(globalKeys);
  const knownFeatures = new Set(allFeatureKeys);

  Object.entries(FEATURE_CORE_JS_MODULES).forEach(([feature, moduleName]) => {
    assert.ok(knownFeatures.has(feature), `Unknown feature: ${feature}`);
    assert.ok(coreJsModules.has(moduleName), `Missing core-js module: ${moduleName}`);
  });
});

test("generated allowlist should match the explicit core-js mappings", async () => {
  const { FEATURE_CORE_JS_MODULES } = await scriptConstants;
  const expected = Object.keys(FEATURE_CORE_JS_MODULES).sort();
  const actual = Array.from(CORE_JS_POLYFILLABLE).sort();
  assert.deepStrictEqual(actual, expected);
});

test("non-polyfillable syntax and globals should remain excluded", () => {
  const features = ["BigInt", "Proxy", "WeakRef", "FinalizationRegistry", "OptionalChaining"];
  features.forEach((feature) => assert.strictEqual(CORE_JS_POLYFILLABLE.has(feature), false));
});

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
    toString: () => {
      throw new Error("Cannot convert");
    },
    valueOf: () => {
      throw new Error("Cannot convert");
    },
  };
  const result = getPolyfillableFeatures(badObject);
  assert.strictEqual(result, POLYFILLABLE_FEATURES);
});

test("CORE_JS_POLYFILLABLE should include common Array methods", () => {
  assert.strictEqual(CORE_JS_POLYFILLABLE.has("ArrayToSorted"), true);
  assert.strictEqual(CORE_JS_POLYFILLABLE.has("ArrayToReversed"), true);
  assert.strictEqual(CORE_JS_POLYFILLABLE.has("ArrayWith"), true);
});

test("CORE_JS_POLYFILLABLE should include ES2023+ features", () => {
  assert.strictEqual(CORE_JS_POLYFILLABLE.has("ArrayFindLast"), true);
  assert.strictEqual(CORE_JS_POLYFILLABLE.has("ArrayFindLastIndex"), true);
});

["Iterator", "JSONRawJSON", "JSONIsRawJSON", "AggregateError", "DataView"].forEach((feature) => {
  test(`CORE_JS_POLYFILLABLE should include ${feature} (#444)`, () => {
    assert.strictEqual(CORE_JS_POLYFILLABLE.has(feature), true);
  });
});

test("POLYFILLABLE_FEATURES and CORE_JS_POLYFILLABLE should be the same set", () => {
  assert.strictEqual(POLYFILLABLE_FEATURES, CORE_JS_POLYFILLABLE);
});
