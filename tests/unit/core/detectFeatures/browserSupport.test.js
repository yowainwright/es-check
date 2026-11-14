const { test } = require("node:test");
const assert = require("assert");
const acorn = require("acorn");

const detectFeatures = require("../../../../lib/core/detectFeatures");
const {
  getESVersionFromBrowserslist,
  getTargetBrowsers,
} = require("../../../../lib/core/browserslist");

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

[
  ['import data from "x" with {type: "json"};', "ImportAttributes", "122", "123"],
  ['import("x", {});', "ImportOptions", "90", "91"],
  ["/(?i:pattern)/;", "RegExpModifiers", "124", "125"],
].forEach(([code, feature, before, added]) => {
  test(`${feature} respects browser support boundaries`, () => {
    const ast = acorn.parse(code, { ecmaVersion: 2025, sourceType: "module" });
    const targetBrowsers = [{ name: "chrome", version: before }];
    assert.throws(
      () => detectFeatures(code, 16, "module", new Set(), { ast, targetBrowsers }),
      (error) => {
        assert.deepStrictEqual(error.features, [feature]);
        assert.deepStrictEqual(error.browserDetails[feature], [
          { name: "chrome", version: before, requiredVersion: added },
        ]);
        return true;
      },
    );
    const supported = [{ name: "chrome", version: added }];
    const result = detectFeatures(code, 16, "module", new Set(), {
      ast,
      targetBrowsers: supported,
    });
    assert.deepStrictEqual(result.unsupportedFeatures, []);
  });
});

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
  {
    feature: "DateToTemporalInstant",
    code: "Date.prototype.toTemporalInstant = function () {}; new Date().toTemporalInstant();",
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

[
  ["toSorted", "", "ArrayToSorted"],
  ["toReversed", "", "ArrayToReversed"],
  ["with", "0, 1", "ArrayWith"],
].forEach(([method, args, feature]) => {
  const install = `Array.prototype.${method} = function () { return this; };`;
  const receivers = [
    "new Uint8Array([2, 1])",
    "new Int16Array([2, 1])",
    "Uint8Array.from([2, 1])",
    "new Uint8Array([2, 1]).slice()",
  ];

  receivers.forEach((receiver) => {
    test(`Array ${method} polyfills do not cover ${receiver}`, () => {
      const code = `${install} const bytes = ${receiver}; [2, 1].${method}(${args}); bytes.${method}(${args});`;
      assert.throws(
        () =>
          detectFeatures(code, 13, "script", new Set(), {
            ast: parse(code),
            checkForPolyfills: true,
          }),
        (error) => error.features.includes(feature),
      );
    });
  });

  test(`Array ${method} polyfills still cover Array receivers`, () => {
    const code = `${install} const values = [2, 1]; values.${method}(${args});`;
    const result = detectFeatures(code, 13, "script", new Set(), {
      ast: parse(code),
      checkForPolyfills: true,
    });
    assert.deepStrictEqual(result.unsupportedFeatures, []);
    assert.strictEqual(result.foundFeatures[feature], true);
  });

  test(`matching Array and Uint8Array ${method} polyfills cover both receivers`, () => {
    const byteInstall = `Uint8Array.prototype.${method} = function () { return this; };`;
    const code = `${install} ${byteInstall} [2, 1].${method}(${args}); new Uint8Array([2, 1]).${method}(${args});`;
    const result = detectFeatures(code, 13, "script", new Set(), {
      ast: parse(code),
      checkForPolyfills: true,
    });
    assert.deepStrictEqual(result.unsupportedFeatures, []);
  });

  test(`matching Int16Array ${method} polyfills cover aliases and chains`, () => {
    const byteInstall = `Int16Array.prototype.${method} = function () { return this; };`;
    const code = `${install} ${byteInstall} const bytes = Int16Array.from([2, 1]).slice(); const alias = bytes; [2, 1].${method}(${args}); alias.${method}(${args});`;
    const result = detectFeatures(code, 13, "script", new Set(), {
      ast: parse(code),
      checkForPolyfills: true,
    });
    assert.deepStrictEqual(result.unsupportedFeatures, []);
  });

  [
    "let values; if (flag) values = new Int16Array(2); else values = new Uint16Array(2); values",
    "let values; if (flag) values = new Int16Array(2); else values = new Uint16Array(2); const alias = values; alias.slice().subarray(0)",
    "let values; if (first) values = new Int16Array(2); else if (second) values = new Uint16Array(2); else values = new Uint8Array(2); values",
  ].forEach((receiver) => {
    const signedInstall = `Int16Array.prototype.${method} = function () { return this; };`;
    const unsignedInstall = `Uint16Array.prototype.${method} = function () { return this; };`;
    const byteInstall = `Uint8Array.prototype.${method} = function () { return this; };`;
    const patched = `${install} ${signedInstall} ${unsignedInstall} ${byteInstall}`;
    const partial = `${install} ${signedInstall} ${byteInstall}`;

    test(`matching ${method} polyfills cover merged receivers: ${receiver}`, () => {
      const code = `${patched} ${receiver}.${method}(${args});`;
      const result = detectFeatures(code, 13, "script", new Set(), {
        ast: parse(code),
        checkForPolyfills: true,
      });
      assert.deepStrictEqual(result.unsupportedFeatures, []);
    });

    test(`partial ${method} polyfills reject merged receivers: ${receiver}`, () => {
      const code = `${partial} ${receiver}.${method}(${args});`;
      assert.throws(
        () =>
          detectFeatures(code, 13, "script", new Set(), {
            ast: parse(code),
            checkForPolyfills: true,
          }),
        (error) => error.features.includes(feature),
      );
    });
  });
});

test("Array polyfills do not cover unclassified global-object receivers", () => {
  const code =
    "Array.prototype.toSorted = function () { return this; }; new globalThis.Uint8Array(1).toSorted();";
  assert.throws(
    () =>
      detectFeatures(code, 13, "script", new Set(), {
        ast: parse(code),
        checkForPolyfills: true,
      }),
    (error) => error.features.includes("ArrayToSorted"),
  );
});

test("polyfill hints do not hide typed-array calls before Array calls", () => {
  const code =
    "/* polyfill */ Array.prototype.toSorted = function () { return this; }; new Uint8Array(1).toSorted(); [1].toSorted();";
  assert.throws(
    () =>
      detectFeatures(code, 13, "script", new Set(), {
        ast: parse(code),
        checkForPolyfills: true,
      }),
    (error) => error.features.includes("ArrayToSorted"),
  );
});

test("a matching Uint8Array polyfill covers a typed-array-only call", () => {
  const code =
    "Uint8Array.prototype.toSorted = function () { return this; }; new Uint8Array(1).toSorted();";
  const result = detectFeatures(code, 13, "script", new Set(), {
    ast: parse(code),
    checkForPolyfills: true,
  });
  assert.deepStrictEqual(result.unsupportedFeatures, []);
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
