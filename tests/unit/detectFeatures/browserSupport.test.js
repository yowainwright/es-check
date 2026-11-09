const { test } = require("node:test");
const assert = require("assert");
const acorn = require("acorn");

const detectFeatures = require("../../../lib/detectFeatures");
const { getESVersionFromBrowserslist, getTargetBrowsers } = require("../../../lib/browserslist");

function parse(code) {
  return acorn.parse(code, { ecmaVersion: 2026, sourceType: "script" });
}

function checkBrowserFeatures(code, browserslistQuery) {
  const options = { browserslistQuery };
  const ecmaVersion = getESVersionFromBrowserslist(options);
  const targetBrowsers = getTargetBrowsers(options);
  const ast = parse(code);
  return detectFeatures(code, ecmaVersion, "script", new Set(), { ast, targetBrowsers });
}

const hasOwnCode = 'Object.hasOwn({}, "a");';
const IOS_15_0 = [{ name: "safari_ios", version: "15.0" }];
const IOS_15_4 = [{ name: "safari_ios", version: "15.4" }];

test("should reject partial browser implementations and accept full support", () => {
  const code = "let value = 1;";
  const ast = parse(code);
  const partialTarget = [{ name: "chrome", version: "48" }];
  const fullTarget = [{ name: "chrome", version: "49" }];
  assert.throws(
    () => detectFeatures(code, 6, "script", new Set(), { ast, targetBrowsers: partialTarget }),
    (error) => {
      assert.deepStrictEqual(error.features, ["let"]);
      assert.deepStrictEqual(error.browserDetails.let, [
        { name: "chrome", version: "48", requiredVersion: "49" },
      ]);
      return true;
    },
  );
  const result = detectFeatures(code, 6, "script", new Set(), { ast, targetBrowsers: fullTarget });
  assert.deepStrictEqual(result.unsupportedFeatures, []);
});

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

test("should respect ignorePolyfillable for browser-unsupported features", () => {
  const result = detectFeatures(hasOwnCode, 13, "script", new Set(), {
    ast: parse(hasOwnCode),
    targetBrowsers: IOS_15_0,
    ignorePolyfillable: "core-js",
  });

  assert.deepStrictEqual(result.unsupportedFeatures, []);
});

test("should respect detected polyfills for browser-unsupported features", () => {
  const code = 'require("core-js/actual/object/has-own");' + hasOwnCode;
  const result = detectFeatures(code, 13, "script", new Set(), {
    ast: parse(code),
    targetBrowsers: IOS_15_0,
    checkForPolyfills: true,
  });

  assert.deepStrictEqual(result.unsupportedFeatures, []);
});

const CHROME_63 = [{ name: "chrome", version: "63" }];

[
  "Array.at = function () {};",
  'Object.defineProperty(Array, "at", { value() {} });',
  "function install(Array) { Array.prototype.at = function () {}; }",
  "{ const Array = { prototype: {} }; Array.prototype.at = function () {}; }",
  'function install(Object) { Object.defineProperty(Array.prototype, "at", { value() {} }); }',
  'Array["prototype.at"] = function () {};',
  'Object.defineProperty(Array, "prototype.at", { value() {} });',
  "function install() { Array.prototype.at = function () {}; }",
  'Object.defineProperty(Array.prototype, "at", { enumerable: false });',
  'Object.defineProperty(Array.prototype, "at", { value: undefined });',
  'Object.defineProperty(Array.prototype, "at", { value: null });',
  "Array.prototype.at = null;",
  "if (false) Array.prototype.at = function () {};",
  "if (enabled) Array.prototype.at = function () {};",
  "if (!String.prototype.at) Array.prototype.at = function () {};",
  "const installer = () => { Array.prototype.at = function () {}; };",
  'Object.defineProperty(Array.prototype, "at", { value() {}, enumerable: useAt() });',
].forEach((install) => {
  test(`checkForPolyfills should reject an unrelated install: ${install}`, () => {
    const code = `${install}[1].at(-1);`;
    assert.throws(
      () =>
        detectFeatures(code, 9, "script", new Set(), {
          ast: parse(code),
          checkForPolyfills: true,
        }),
      (error) => error.features.includes("ArrayPrototypeAt"),
    );
  });
});

test("a later install should not hide an earlier call", () => {
  const code = "[1].at(-1); Array.prototype.at = function () {};";
  assert.throws(
    () =>
      detectFeatures(code, 9, "script", new Set(), {
        ast: parse(code),
        checkForPolyfills: true,
      }),
    (error) => error.features.includes("ArrayPrototypeAt"),
  );
});

["getOrInsert", "getOrInsertComputed"].forEach((method) => {
  test(`a Map ${method} install should not hide an unpatched WeakMap`, () => {
    const code = `Map.prototype.${method} = function () {}; new WeakMap().${method}({}, () => 1);`;
    assert.throws(
      () =>
        detectFeatures(code, 16, "script", new Set(), {
          ast: parse(code),
          checkForPolyfills: true,
        }),
      (error) => error.features.some((feature) => feature.startsWith("MapGetOrInsert")),
    );
  });

  test(`matching Map and WeakMap ${method} installs should pass`, () => {
    const code = `Map.prototype.${method} = function () {};
      WeakMap.prototype.${method} = function () {};
      new Map().${method}({}, () => 1); new WeakMap().${method}({}, () => 1);`;
    const result = detectFeatures(code, 16, "script", new Set(), {
      ast: parse(code),
      checkForPolyfills: true,
    });
    assert.deepStrictEqual(result.unsupportedFeatures, []);
  });
});

[
  {
    feature: "ArrayPrototypeAt",
    code: 'Array.prototype.at||Object.defineProperty(Array.prototype,"at",{value(){}});[1].at(-1);',
  },
  {
    feature: "ObjectFromEntries",
    code: "if (!Object.fromEntries) Object.fromEntries = function () {};Object.fromEntries([]);",
  },
  {
    feature: "ArrayFlatMap",
    code: "if (!Array.prototype.flatMap) { Array.prototype.flatMap = function () {}; } [1].flatMap(x => [x]);",
  },
  {
    feature: "PromiseAllSettled",
    code: "Promise.allSettled = function () {}; Promise.allSettled([]);",
  },
].forEach(({ feature, code }) => {
  const options = { ast: parse(code), targetBrowsers: CHROME_63 };

  test(`checkForPolyfills should accept ${feature} installed on its builtin`, () => {
    const result = detectFeatures(code, 9, "script", new Set(), {
      ...options,
      checkForPolyfills: true,
    });

    assert.deepStrictEqual(result.unsupportedFeatures, []);
  });

  test(`${feature} installed on its builtin should still fail without checkForPolyfills`, () => {
    assert.throws(
      () => detectFeatures(code, 9, "script", new Set(), options),
      (error) => error.features.includes(feature),
    );
  });
});

test("checkForPolyfills should not accept a method installed on another builtin", () => {
  const code =
    'Object.defineProperty(String.prototype, "includes", { value() {} });[1].includes(1);';

  assert.throws(
    () =>
      detectFeatures(code, 6, "script", new Set(), {
        ast: parse(code),
        checkForPolyfills: true,
      }),
    (error) => error.features.includes("ArrayPrototypeIncludes"),
  );
});

["Object", "Map"].forEach((receiver) => {
  const code = `${receiver}.groupBy([1], (value) => value);`;
  const feature = `${receiver}GroupBy`;

  ["safari", "ios_saf"].forEach((browser) => {
    test(`${feature} should fail for ${browser} 17.0 despite the older Array API`, () => {
      assert.throws(
        () => checkBrowserFeatures(code, `${browser} 17.0`),
        (error) => {
          assert.deepStrictEqual(error.features, [feature]);
          assert.strictEqual(error.browserDetails[feature][0].requiredVersion, "17.4");
          return true;
        },
      );
    });

    test(`${feature} should pass for ${browser} 17.4`, () => {
      const result = checkBrowserFeatures(code, `${browser} 17.4`);
      assert.deepStrictEqual(result.unsupportedFeatures, []);
    });
  });
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
