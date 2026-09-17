const { test } = require("node:test");
const assert = require("assert");
const acorn = require("acorn");

const detectFeatures = require("../../../lib/detectFeatures");

function parse(code) {
  return acorn.parse(code, { ecmaVersion: 2026, sourceType: "script" });
}

const hasOwnCode = 'Object.hasOwn({}, "a");';
const IOS_15_0 = [{ name: "safari_ios", version: "15.0" }];
const IOS_15_4 = [{ name: "safari_ios", version: "15.4" }];

test("should report features unsupported by a target browser even when the ES version allows them", () => {
  assert.throws(
    () =>
      detectFeatures(hasOwnCode, 13, "script", new Set(), {
        ast: parse(hasOwnCode),
        targetBrowsers: IOS_15_0,
      }),
    (error) => {
      assert.strictEqual(error.type, "ES-Check");
      assert.deepStrictEqual(error.features, ["ObjectHasOwn"]);
      assert.deepStrictEqual(error.browserDetails.ObjectHasOwn, [
        { name: "safari_ios", version: "15.0", requiredVersion: "15.4" },
      ]);
      assert.match(error.message, /ObjectHasOwn \(safari_ios 15\.0 requires 15\.4\)/);
      assert.match(error.message, /not supported by the target browsers/);
      return true;
    },
  );
});

test("should pass when every target browser supports the feature", () => {
  const result = detectFeatures(hasOwnCode, 13, "script", new Set(), {
    ast: parse(hasOwnCode),
    targetBrowsers: IOS_15_4,
  });

  assert.deepStrictEqual(result.unsupportedFeatures, []);
  assert.deepStrictEqual(result.browserDetails, {});
});

test("should keep the ES version check when no target browsers are given", () => {
  const result = detectFeatures(hasOwnCode, 13, "script", new Set(), { ast: parse(hasOwnCode) });
  assert.deepStrictEqual(result.unsupportedFeatures, []);

  assert.throws(
    () => detectFeatures(hasOwnCode, 12, "script", new Set(), { ast: parse(hasOwnCode) }),
    (error) => {
      assert.deepStrictEqual(error.features, ["ObjectHasOwn"]);
      assert.doesNotMatch(error.message, /target browsers/);
      return true;
    },
  );
});

test("should respect the ignore list for browser-unsupported features", () => {
  const result = detectFeatures(hasOwnCode, 13, "script", new Set(["ObjectHasOwn"]), {
    ast: parse(hasOwnCode),
    targetBrowsers: IOS_15_0,
  });

  assert.deepStrictEqual(result.unsupportedFeatures, []);
});

test("should check syntax features and globals against target browsers", () => {
  const code = "class Foo { static { Foo.ready = true; } } const p = new Proxy({}, {});";

  assert.throws(
    () =>
      detectFeatures(code, 13, "script", new Set(), {
        ast: parse(code),
        targetBrowsers: [
          { name: "safari_ios", version: "16.0" },
          { name: "ie", version: "11" },
        ],
      }),
    (error) => {
      assert.ok(error.features.includes("ClassStaticBlocks"));
      assert.ok(error.features.includes("Proxy"));
      assert.match(
        error.message,
        /ClassStaticBlocks \(safari_ios 16\.0 requires 16\.4, ie 11 has no support\)/,
      );
      assert.match(error.message, /Proxy \(ie 11 has no support\)/);
      return true;
    },
  );
});
