const { test } = require("node:test");
const assert = require("assert");

const {
  compareVersions,
  isVersionSupported,
  getUnsupportedBrowsers,
  formatFeatureWithBrowsers,
  formatTargetBrowsers,
} = require("../../../lib/helpers/browserSupport");

test("compareVersions should compare dotted versions numerically", () => {
  assert.ok(compareVersions("15.4", "15.0") > 0);
  assert.ok(compareVersions("15.0", "15.4") < 0);
  assert.strictEqual(compareVersions("15", "15.0"), 0);
  assert.ok(compareVersions("16", "15.4") > 0);
  assert.ok(compareVersions("10.3", "9") > 0);
  assert.ok(compareVersions("16.9.0", "16.10.0") < 0);
});

test("isVersionSupported should handle boolean support values", () => {
  assert.strictEqual(isVersionSupported("1", true), true);
  assert.strictEqual(isVersionSupported("999", false), false);
});

test("isVersionSupported should compare target version against version_added", () => {
  assert.strictEqual(isVersionSupported("15.4", "15.4"), true);
  assert.strictEqual(isVersionSupported("16", "15.4"), true);
  assert.strictEqual(isVersionSupported("15.0", "15.4"), false);
});

test("getUnsupportedBrowsers should return browsers below the required version", () => {
  const targetBrowsers = [
    { name: "safari_ios", version: "15.0" },
    { name: "chrome", version: "120" },
  ];

  const result = getUnsupportedBrowsers("ObjectHasOwn", targetBrowsers);

  assert.deepStrictEqual(result, [
    { name: "safari_ios", version: "15.0", requiredVersion: "15.4" },
  ]);
});

test("getUnsupportedBrowsers should report only the lowest unsupported version per browser", () => {
  const targetBrowsers = [
    { name: "safari_ios", version: "16.3" },
    { name: "safari_ios", version: "15.0" },
    { name: "safari_ios", version: "15.4" },
    { name: "safari", version: "16.0" },
  ];

  const result = getUnsupportedBrowsers("ClassStaticBlocks", targetBrowsers);

  assert.deepStrictEqual(result, [
    { name: "safari_ios", version: "15.0", requiredVersion: "16.4" },
    { name: "safari", version: "16.0", requiredVersion: "16.4" },
  ]);
});

test("getUnsupportedBrowsers should return empty when all browsers support the feature", () => {
  const targetBrowsers = [
    { name: "safari_ios", version: "15.4" },
    { name: "chrome", version: "120" },
  ];

  assert.deepStrictEqual(getUnsupportedBrowsers("ObjectHasOwn", targetBrowsers), []);
});

test("getUnsupportedBrowsers should fall back to empty for unmapped features", () => {
  const targetBrowsers = [{ name: "safari_ios", version: "9" }];

  assert.deepStrictEqual(getUnsupportedBrowsers("ArrayPrototypeGroup", targetBrowsers), []);
  assert.deepStrictEqual(getUnsupportedBrowsers("UnknownFeature", targetBrowsers), []);
});

test("getUnsupportedBrowsers should skip browsers without compat data", () => {
  const browserSupport = { Feature: { chrome: "10" } };
  const targetBrowsers = [{ name: "safari_ios", version: "1" }];

  assert.deepStrictEqual(getUnsupportedBrowsers("Feature", targetBrowsers, browserSupport), []);
});

test("getUnsupportedBrowsers should treat false as never supported", () => {
  const browserSupport = { Feature: { ie: false } };
  const targetBrowsers = [{ name: "ie", version: "11" }];

  assert.deepStrictEqual(getUnsupportedBrowsers("Feature", targetBrowsers, browserSupport), [
    { name: "ie", version: "11", requiredVersion: false },
  ]);
});

test("getUnsupportedBrowsers should return empty without target browsers", () => {
  assert.deepStrictEqual(getUnsupportedBrowsers("ObjectHasOwn", undefined), []);
  assert.deepStrictEqual(getUnsupportedBrowsers("ObjectHasOwn", []), []);
});

test("formatFeatureWithBrowsers should append browser requirements", () => {
  const formatted = formatFeatureWithBrowsers("ObjectHasOwn", [
    { name: "safari_ios", version: "15.0", requiredVersion: "15.4" },
    { name: "ie", version: "11", requiredVersion: false },
  ]);

  assert.strictEqual(
    formatted,
    "ObjectHasOwn (safari_ios 15.0 requires 15.4, ie 11 has no support)",
  );
  assert.strictEqual(formatFeatureWithBrowsers("ObjectHasOwn", []), "ObjectHasOwn");
  assert.strictEqual(formatFeatureWithBrowsers("ObjectHasOwn", undefined), "ObjectHasOwn");
});

test("formatTargetBrowsers should list browsers with versions", () => {
  const formatted = formatTargetBrowsers([
    { name: "chrome", version: "120" },
    { name: "safari_ios", version: "15.0" },
  ]);

  assert.strictEqual(formatted, "chrome 120, safari_ios 15.0");
});
