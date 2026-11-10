const { test } = require("node:test");
const assert = require("assert");

const { FEATURE_BROWSER_SUPPORT } = require("../../../lib/constants/es-features/browserSupport");
const { ES_FEATURES } = require("../../../lib/constants/es-features");
const { ES_GLOBAL_MIN_VERSION } = require("../../../lib/constants/es-features/globals");

const VERSION_PATTERN = /^\d+(\.\d+)*$/;

test("FEATURE_BROWSER_SUPPORT should only contain known feature names", () => {
  const knownNames = new Set([...Object.keys(ES_FEATURES), ...Object.keys(ES_GLOBAL_MIN_VERSION)]);
  const unknown = Object.keys(FEATURE_BROWSER_SUPPORT).filter((name) => !knownNames.has(name));

  assert.deepStrictEqual(unknown, []);
});

test("FEATURE_BROWSER_SUPPORT values should be versions, booleans, or support periods", () => {
  Object.entries(FEATURE_BROWSER_SUPPORT).forEach(([featureName, support]) => {
    Object.entries(support).forEach(([browser, version]) => {
      const isBoolean = typeof version === "boolean";
      const isVersion = typeof version === "string" && VERSION_PATTERN.test(version);
      const isPeriods = Array.isArray(version);
      assert.ok(
        isBoolean || isVersion || isPeriods,
        `${featureName}.${browser} has invalid value ${version}`,
      );
      if (!isPeriods) return;
      version.forEach((period) => {
        assert.ok(VERSION_PATTERN.test(period.version_added));
        if (period.version_removed) assert.ok(VERSION_PATTERN.test(period.version_removed));
      });
    });
  });
});

test("FEATURE_BROWSER_SUPPORT should match MDN browser-compat-data for known features", () => {
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.ArrayPrototypeAt.safari_ios, "15.4");
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.ObjectHasOwn.safari_ios, "15.4");
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.ClassStaticBlocks.safari_ios, "16.4");
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.PrivateClassFields.safari_ios, "14.5");
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.TopLevelAwait.safari, "27");
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.OptionalChaining.chrome, "80");
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.Proxy.ie, false);
});

test("FEATURE_BROWSER_SUPPORT should require full implementations", () => {
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.let.chrome, "49");
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.let.edge, "14");
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.let.ie, false);
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.AtomicsWaitAsync.chrome, "90");
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.ErrorIsError.safari, false);
});

test("FEATURE_BROWSER_SUPPORT should skip features without browser-compat-data", () => {
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.ArrayPrototypeGroup, undefined);
  assert.strictEqual(FEATURE_BROWSER_SUPPORT.ArrayPrototypeGroupToMap, undefined);
});

test("grouping methods should require standard API support in Safari", () => {
  ["ObjectGroupBy", "MapGroupBy"].forEach((feature) => {
    assert.strictEqual(FEATURE_BROWSER_SUPPORT[feature].safari, "17.4");
    assert.strictEqual(FEATURE_BROWSER_SUPPORT[feature].safari_ios, "17.4");
  });
});
