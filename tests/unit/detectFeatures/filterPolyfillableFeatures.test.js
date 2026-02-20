const { test } = require("node:test");
const assert = require("assert");

const { filterPolyfillableFeatures } = require("../../../lib/detectFeatures");

test("should return all features when ignorePolyfillable is falsy", () => {
  const features = ["ArrayToSorted", "BigInt", "ArrayWith"];

  assert.deepStrictEqual(filterPolyfillableFeatures(features, null), features);
  assert.deepStrictEqual(
    filterPolyfillableFeatures(features, undefined),
    features,
  );
  assert.deepStrictEqual(filterPolyfillableFeatures(features, false), features);
  assert.deepStrictEqual(filterPolyfillableFeatures(features, ""), features);
});

test("should filter out core-js polyfillable features", () => {
  const features = ["ArrayToSorted", "BigInt", "ArrayWith", "OptionalChaining"];
  const result = filterPolyfillableFeatures(features, "core-js");

  assert.strictEqual(result.includes("BigInt"), true);
  assert.strictEqual(result.includes("OptionalChaining"), true);
  assert.strictEqual(result.includes("ArrayToSorted"), false);
  assert.strictEqual(result.includes("ArrayWith"), false);
});

test("should filter out all polyfillable features when no library specified", () => {
  const features = ["ArrayToSorted", "BigInt", "ArrayWith"];
  const result = filterPolyfillableFeatures(features, true);

  assert.strictEqual(result.includes("BigInt"), true);
  assert.strictEqual(result.includes("ArrayToSorted"), false);
  assert.strictEqual(result.includes("ArrayWith"), false);
});

test("should handle empty features array", () => {
  const result = filterPolyfillableFeatures([], "core-js");
  assert.deepStrictEqual(result, []);
});

test("should be case insensitive for library names", () => {
  const features = ["ArrayToSorted", "BigInt"];
  const result1 = filterPolyfillableFeatures(features, "CORE-JS");
  const result2 = filterPolyfillableFeatures(features, "core-js");

  assert.deepStrictEqual(result1, result2);
});
