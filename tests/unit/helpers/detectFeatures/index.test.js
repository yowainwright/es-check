const { describe, it } = require("node:test");
const assert = require("node:assert");
const acorn = require("acorn");
const detectFeatures = require("../../../../lib/detectFeatures");
const detectPolyfills = detectFeatures.detectPolyfills;
const filterPolyfilled = detectFeatures.filterPolyfilled;

const parse = (code, sourceType = "script") =>
  acorn.parse(code, { ecmaVersion: 2025, sourceType });

function createSilentLogger() {
  return {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
    isLevelEnabled: () => false,
  };
}

const mockLogger = createSilentLogger();

const testFeatureMap = {
  "Array.prototype.toSorted": [
    /\bArray\.prototype\.toSorted\s*=/,
    /['"]core-js\/modules\/es\.array\.to-sorted['"]/,
  ],
  "Object.hasOwn": [
    /\bObject\.hasOwn\s*=/,
    /['"]core-js\/modules\/es\.object\.has-own['"]/,
  ],
  Promise: [
    /\bPromise\s*=/,
    /['"]core-js\/modules\/es\.promise['"]/,
    /['"]es6-promise(\/.*)?['"]/,
  ],
  "Object.assign": [
    /\bObject\.assign\s*=/,
    /['"]core-js\/modules\/es\.object\.assign['"]/,
    /['"]object-assign['"]/,
  ],
};

describe("detectFeatures", () => {
  describe("Basic functionality", () => {
    it("should throw when AST is not provided", () => {
      const code = "const x = 1;";

      assert.throws(() => detectFeatures(code, 6, "script", new Set(), {}), {
        message: "AST is required for feature detection",
      });
    });

    it("should throw when options is omitted", () => {
      const code = "const x = 1;";

      assert.throws(() => detectFeatures(code, 6, "script", new Set()), {
        message: "AST is required for feature detection",
      });
    });

    it("should detect ES6 features", () => {
      const code = `
        const x = 1;
        let y = 2;
        class MyClass {}
        () => {};
      `;

      const { foundFeatures, unsupportedFeatures } = detectFeatures(
        code,
        6,
        "script",
        new Set(),
        { ast: parse(code) },
      );

      assert(
        Object.values(foundFeatures).some(Boolean),
        "Should detect some ES6 features",
      );
      assert.strictEqual(
        unsupportedFeatures.length,
        0,
        "No unsupported features for ES6",
      );
    });

    it("should detect unsupported features for lower versions", () => {
      const code = `
        const x = 1;
        let y = 2;
      `;

      try {
        detectFeatures(code, 5, "script", new Set(), { ast: parse(code) });
        assert.fail("Should throw for ES5 with ES6 features");
      } catch (error) {
        assert(error, "Should throw an error for ES6 features in ES5");
        assert(
          error.features && error.features.length > 0,
          "Error should contain features property",
        );
      }
    });

    it("should respect the ignoreList", () => {
      const code = `
        const x = 1;
        let y = 2;
      `;

      const ignoreList = new Set(["let", "const"]);

      try {
        const { unsupportedFeatures } = detectFeatures(
          code,
          5,
          "script",
          ignoreList,
          { ast: parse(code) },
        );
        assert.strictEqual(
          unsupportedFeatures.length,
          0,
          "Should have no unsupported features when they are in ignoreList",
        );
      } catch (error) {
        assert.fail("Should not throw when features are in ignoreList");
      }
    });
  });

  describe("detectPolyfills", () => {
    it("should detect polyfills when checkForPolyfills is enabled", () => {
      const code = `
        import 'core-js/modules/es.array.to-sorted';

        const arr = [3, 1, 2];
        const sorted = arr.toSorted();
      `;

      const options = { checkForPolyfills: true, ast: parse(code, "module") };

      try {
        const { unsupportedFeatures } = detectFeatures(
          code,
          2020,
          "module",
          new Set(),
          options,
        );
        assert.strictEqual(
          unsupportedFeatures.length,
          0,
          "Should have no unsupported features when polyfills are detected",
        );
      } catch (error) {
        assert.fail("Should not throw when polyfills are detected");
      }
    });

    it("should detect polyfill patterns in code", () => {
      const code = `
        if (!Array.prototype.toSorted) {
          Array.prototype.toSorted = function() {
            return [...this].sort();
          };
        }

        const arr = [3, 1, 2];
        const sorted = arr.toSorted();
      `;

      const options = { checkForPolyfills: true, ast: parse(code) };

      try {
        const { unsupportedFeatures } = detectFeatures(
          code,
          2020,
          "script",
          new Set(),
          options,
        );
        assert.strictEqual(
          unsupportedFeatures.length,
          0,
          "Should have no unsupported features when polyfills are detected",
        );
      } catch (error) {
        assert.fail("Should not throw when polyfills are detected");
      }
    });

    it("should detect core-js polyfills via require (#389)", () => {
      const code = `
        require('core-js/modules/es.array.to-sorted');

        const arr = [3, 1, 2];
        const sorted = arr.toSorted();
      `;

      const options = { checkForPolyfills: true, ast: parse(code) };

      try {
        const { unsupportedFeatures } = detectFeatures(
          code,
          2020,
          "script",
          new Set(),
          options,
        );
        assert.strictEqual(unsupportedFeatures.length, 0);
      } catch (error) {
        assert.fail("Should not throw when polyfills are detected via require");
      }
    });

    it("should detect core-js polyfills via bare import (#389)", () => {
      const code = `
        import "core-js/modules/es.array.to-sorted";
        const sorted = [3, 1, 2].toSorted();
      `;

      const options = { checkForPolyfills: true, ast: parse(code, "module") };

      try {
        detectFeatures(code, 8, "module", new Set(), options);
      } catch (error) {
        assert.fail(
          "Should not throw when polyfills are detected via bare import",
        );
      }
    });
  });

  describe("Module handling", () => {
    it("should parse ES modules correctly", () => {
      const code = `
        import { foo } from './foo.js';
        export const bar = 1;
      `;

      const { foundFeatures } = detectFeatures(code, 6, "module", new Set(), {
        ast: parse(code, "module"),
      });
      assert(
        Object.values(foundFeatures).some(Boolean),
        "Should detect some features in ES modules",
      );
    });
  });

  describe("ignorePolyfillable option (#390)", () => {
    it("should not throw for polyfillable features when ignorePolyfillable is set", () => {
      const code = `
        const sorted = [3, 1, 2].toSorted();
        const reversed = [1, 2].toReversed();
      `;

      const options = { ast: parse(code), ignorePolyfillable: true };

      try {
        detectFeatures(code, 8, "script", new Set(), options);
      } catch (error) {
        assert.fail(
          "Should not throw for polyfillable features with ignorePolyfillable",
        );
      }
    });

    it("should still throw for non-polyfillable features when ignorePolyfillable is set", () => {
      const code = `const x = 0n;`;

      const options = { ast: parse(code), ignorePolyfillable: true };

      assert.throws(() => {
        detectFeatures(code, 8, "script", new Set(), options);
      });
    });

    it("should filter only core-js polyfillable features with ignorePolyfillable=core-js", () => {
      const code = `const sorted = [3, 1, 2].toSorted();`;

      const options = { ast: parse(code), ignorePolyfillable: "core-js" };

      try {
        detectFeatures(code, 8, "script", new Set(), options);
      } catch (error) {
        assert.fail(
          "Should not throw for core-js polyfillable features",
        );
      }
    });
  });

  describe("Feature detection", () => {
    it("should not confuse console.group with groupBy methods", () => {
      const code = `
        console.group('Test Group');
        console.log('Inside group');
        console.groupEnd();
      `;

      try {
        const { foundFeatures, unsupportedFeatures } = detectFeatures(
          code,
          13,
          "script",
          new Set(),
          { ast: parse(code) },
        );
        assert.strictEqual(
          unsupportedFeatures.length,
          0,
          "console.group should not be detected as any groupBy feature",
        );
        assert(
          !foundFeatures.ObjectGroupBy,
          "ObjectGroupBy should not be detected for console.group",
        );
        assert(
          !foundFeatures.MapGroupBy,
          "MapGroupBy should not be detected for console.group",
        );
        assert(
          !foundFeatures.ArrayPrototypeGroup,
          "ArrayPrototypeGroup should not be detected for console.group",
        );
      } catch (error) {
        assert.fail(
          `Should not throw for console.group in ES2022: ${error.message}`,
        );
      }
    });

    it("should have superseded Array.prototype.group methods in feature list", () => {
      const { ES_FEATURES } = require("../../../../lib/constants");

      assert(
        ES_FEATURES.ArrayPrototypeGroup,
        "ArrayPrototypeGroup should exist in ES_FEATURES",
      );
      assert(
        ES_FEATURES.ArrayPrototypeGroup.superseded === true,
        "ArrayPrototypeGroup should be marked as superseded",
      );
      assert(
        ES_FEATURES.ArrayPrototypeGroup.supersededBy === "ObjectGroupBy",
        "ArrayPrototypeGroup should reference ObjectGroupBy as replacement",
      );

      assert(
        ES_FEATURES.ArrayPrototypeGroupToMap,
        "ArrayPrototypeGroupToMap should exist in ES_FEATURES",
      );
      assert(
        ES_FEATURES.ArrayPrototypeGroupToMap.superseded === true,
        "ArrayPrototypeGroupToMap should be marked as superseded",
      );
      assert(
        ES_FEATURES.ArrayPrototypeGroupToMap.supersededBy === "MapGroupBy",
        "ArrayPrototypeGroupToMap should reference MapGroupBy as replacement",
      );
    });

    it("should detect ES2020 features", () => {
      const code = `
        const obj = {
          prop: 1,
          method() {
            return this.prop;
          }
        };

        const value = obj?.prop;
        const nullish = null ?? 'default';
      `;
      const { foundFeatures } = detectFeatures(
        code,
        2020,
        "script",
        new Set(),
        {
          ast: parse(code),
        },
      );
      assert(
        Object.values(foundFeatures).some(Boolean),
        "Should detect some ES2020 features",
      );
    });

    it("should detect ES2021 features", () => {
      const code = `
        const str = 'hello';
        const replaced = str.replaceAll('l', 'x');
      `;
      const { foundFeatures } = detectFeatures(
        code,
        2021,
        "script",
        new Set(),
        {
          ast: parse(code),
        },
      );
      assert(
        Object.values(foundFeatures).some(Boolean),
        "Should detect some ES2021 features",
      );
    });

    it("should detect ES2022 features", () => {
      const code = `
        // Class with private fields (ES2022)
        class MyClass {
          #privateField = 1;

          getPrivate() {
            return this.#privateField;
          }
        }

        // Class fields (ES2022)
        class AnotherClass {
          publicField = 42;
          static staticField = 'static';
        }

        // Object.hasOwn (ES2022)
        function testHasOwn(obj, prop) {
          return Object.hasOwn(obj, prop);
        }

        // Error cause (ES2022)
        function testErrorCause() {
          try {
            throw new Error('Failed', { cause: 'Network error' });
          } catch (e) {
            return e.cause;
          }
        }
      `;

      const { foundFeatures } = detectFeatures(
        code,
        2022,
        "script",
        new Set(),
        {
          ast: parse(code),
        },
      );
      assert(
        Object.values(foundFeatures).some(Boolean),
        "Should detect some ES2022 features",
      );
    });

    it("should detect ES2024 (ES15) features", () => {
      const code = `
        const str = "test";
        str.isWellFormed();
        str.toWellFormed();

        const { promise, resolve, reject } = Promise.withResolvers();

        const items = [{ type: 'a' }, { type: 'b' }];
        const grouped = Object.groupBy(items, item => item.type);
        const groupedMap = Map.groupBy(items, item => item.type);

        const sab = new SharedArrayBuffer(16);
        const int32 = new Int32Array(sab);
        Atomics.waitAsync(int32, 0, 0);
      `;

      const { foundFeatures } = detectFeatures(
        code,
        2024,
        "script",
        new Set(),
        {
          ast: parse(code),
        },
      );
      assert(
        Object.values(foundFeatures).some(Boolean),
        "Should detect some ES2024 features",
      );
    });

    it("should detect ES2025 (ES16) features", () => {
      const code = `
        Promise.try(() => Math.random());

        const regex = /(?<year>\\d{4})-\\d{2}|(?<year>\\d{4})\\/\\d{2}/;

        const set1 = new Set([1, 2, 3]);
        const set2 = new Set([3, 4, 5]);
        set1.union(set2);
        set1.intersection(set2);
        set1.difference(set2);
        set1.symmetricDifference(set2);
        set1.isSubsetOf(set2);
        set1.isSupersetOf(set2);
        set1.isDisjointFrom(set2);

        const float16 = new Float16Array([1.5, 2.5]);
        const escaped = RegExp.escape("test");
      `;

      const { foundFeatures } = detectFeatures(
        code,
        2025,
        "script",
        new Set(),
        {
          ast: parse(code),
        },
      );
      assert(
        Object.values(foundFeatures).some(Boolean),
        "Should detect some ES2025 features",
      );
    });
  });
});

describe("Polyfill Detection", () => {
  describe("detectPolyfills", () => {
    it("should detect core-js polyfills via import", () => {
      const code = `
        import 'core-js/modules/es.array.to-sorted';
        import 'core-js/modules/es.object.has-own';
      `;
      const polyfills = detectPolyfills(code, mockLogger, testFeatureMap);
      assert.strictEqual(
        polyfills.has("Array.prototype.toSorted"),
        true,
        "Should detect Array.prototype.toSorted polyfill",
      );
      assert.strictEqual(
        polyfills.has("Object.hasOwn"),
        true,
        "Should detect Object.hasOwn polyfill",
      );
    });

    it("should detect manual polyfill definitions", () => {
      const code = `
        if (!Array.prototype.toSorted) {
          Array.prototype.toSorted = function() { return [...this].sort(); };
        }
      `;
      const polyfills = detectPolyfills(code, mockLogger, testFeatureMap);
      assert.strictEqual(
        polyfills.has("Array.prototype.toSorted"),
        true,
        "Should detect manual Array.prototype.toSorted polyfill",
      );
    });

    it("should not detect any polyfills in regular code", () => {
      const code = "var arr = [3, 1, 2]; var sorted = arr.slice().sort();";
      const polyfills = detectPolyfills(code, mockLogger);
      assert.strictEqual(
        polyfills.size,
        0,
        "Should not detect any polyfills in regular code",
      );
    });

    it("should detect core-js polyfills via require", () => {
      const code = `const promise = require('core-js/modules/es.promise');`;
      const polyfills = detectPolyfills(code, mockLogger, testFeatureMap);
      assert.strictEqual(
        polyfills.has("Promise"),
        true,
        "Should detect Promise polyfill via require",
      );
    });

    it("should detect other polyfill libraries like es6-promise", () => {
      const code = `import 'es6-promise/auto';`;
      const polyfills = detectPolyfills(code, mockLogger, testFeatureMap);
      assert.strictEqual(
        polyfills.has("Promise"),
        true,
        "Should detect es6-promise library",
      );
    });

    it("should handle empty or null code inputs gracefully", () => {
      assert.strictEqual(
        detectPolyfills("", mockLogger).size,
        0,
        "Should return an empty set for an empty string",
      );
      assert.strictEqual(
        detectPolyfills(null, mockLogger).size,
        0,
        "Should return an empty set for null input",
      );
      assert.strictEqual(
        detectPolyfills(undefined, mockLogger).size,
        0,
        "Should return an empty set for undefined input",
      );
    });

    it("should handle a missing feature map gracefully", () => {
      const code = `import 'core-js/modules/es.array.to-sorted';`;
      assert.strictEqual(
        detectPolyfills(code, mockLogger, null).size,
        0,
        "Should return an empty set for null map",
      );
    });

    it("should not get a false positive from code comments", () => {
      const code = `// This code needs Object.assign to be polyfilled.`;
      const polyfills = detectPolyfills(code, mockLogger, testFeatureMap);
      assert.strictEqual(
        polyfills.size,
        0,
        "Should not detect polyfills from comments",
      );
    });

    it("should call the logger with detected polyfills when provided", () => {
      const code = `import 'core-js/modules/es.object.has-own';`;
      let loggedMessage = "";
      const spyLogger = {
        isLevelEnabled: () => true,
        debug: (message) => {
          loggedMessage = message;
        },
      };

      detectPolyfills(code, spyLogger, testFeatureMap);
      assert.strictEqual(
        loggedMessage,
        "ES-Check: Detected polyfills: Object.hasOwn",
      );
    });

    it('should call the logger with a "no polyfills" message when none are found', () => {
      const code = `const x = 1;`;
      let loggedMessage = "";
      const spyLogger = {
        isLevelEnabled: () => true,
        debug: (message) => {
          loggedMessage = message;
        },
      };

      detectPolyfills(code, spyLogger, testFeatureMap);
      assert.strictEqual(loggedMessage, "ES-Check: No polyfills detected.");
    });

    it("should not call the logger if the debug level is not enabled", () => {
      const code = `import 'core-js/modules/es.object.has-own';`;
      let wasCalled = false;
      const spyLogger = {
        isLevelEnabled: () => false,
        debug: () => {
          wasCalled = true;
        },
      };

      detectPolyfills(code, spyLogger, testFeatureMap);
      assert.strictEqual(
        wasCalled,
        false,
        "Logger should not be called when debug is disabled",
      );
    });
  });

  describe("filterPolyfilled", () => {
    it("should filter out polyfilled features", () => {
      const unsupportedFeatures = [
        "Array.prototype.toSorted",
        "Object.hasOwn",
        "Promise",
      ];
      const polyfills = new Set(["Array.prototype.toSorted", "Object.hasOwn"]);
      const filtered = filterPolyfilled(unsupportedFeatures, polyfills);
      assert.deepStrictEqual(filtered, ["Promise"]);
    });

    it("should return all features if no polyfills are provided", () => {
      const unsupportedFeatures = ["Array.prototype.toSorted", "Object.hasOwn"];
      const polyfills = new Set();
      const filtered = filterPolyfilled(unsupportedFeatures, polyfills);
      assert.deepStrictEqual(filtered, unsupportedFeatures);
    });

    it("should handle an empty list of unsupported features", () => {
      const unsupportedFeatures = [];
      const polyfills = new Set(["Array.prototype.toSorted"]);
      const filtered = filterPolyfilled(unsupportedFeatures, polyfills);
      assert.deepStrictEqual(filtered, []);
    });

    it("should return an empty array if all features are polyfilled", () => {
      const unsupportedFeatures = ["Array.prototype.toSorted", "Object.hasOwn"];
      const polyfills = new Set(["Array.prototype.toSorted", "Object.hasOwn"]);
      const filtered = filterPolyfilled(unsupportedFeatures, polyfills);
      assert.deepStrictEqual(filtered, []);
    });

    it("should handle null or undefined polyfills set gracefully", () => {
      const unsupportedFeatures = ["Array.prototype.toSorted", "Object.hasOwn"];
      const filteredWithNull = filterPolyfilled(unsupportedFeatures, null);
      assert.deepStrictEqual(filteredWithNull, unsupportedFeatures);

      const filteredWithUndefined = filterPolyfilled(
        unsupportedFeatures,
        undefined,
      );
      assert.deepStrictEqual(filteredWithUndefined, unsupportedFeatures);
    });
  });
});

describe("AST-based feature detection", () => {
  it("should not detect ExponentOperator for ** inside string literals", () => {
    const code = 'var str = "This is a **bold** text";';
    const ast = acorn.parse(code, { ecmaVersion: 5 });

    const { foundFeatures, unsupportedFeatures } = detectFeatures(
      code,
      5,
      "script",
      new Set(),
      { ast },
    );

    assert.strictEqual(
      foundFeatures.ExponentOperator,
      false,
      "Should not detect ** in strings as ExponentOperator",
    );
    assert.strictEqual(
      unsupportedFeatures.length,
      0,
      "Should have no unsupported features",
    );
  });

  it("should not detect NumericSeparators for underscores inside string literals", () => {
    const code = 'var str = "image-froth_1426534_7KYhd4UUl";';
    const ast = acorn.parse(code, { ecmaVersion: 5 });

    const { foundFeatures, unsupportedFeatures } = detectFeatures(
      code,
      5,
      "script",
      new Set(),
      { ast },
    );

    assert.strictEqual(
      foundFeatures.NumericSeparators,
      false,
      "Should not detect underscores in strings as NumericSeparators",
    );
    assert.strictEqual(
      unsupportedFeatures.length,
      0,
      "Should have no unsupported features",
    );
  });

  it("should not detect OptionalChaining for ternary operators with decimal values", () => {
    const code = "var value = e.isRemovedItem ? 0.35 : 1;";
    const ast = acorn.parse(code, { ecmaVersion: 5 });

    const { foundFeatures, unsupportedFeatures } = detectFeatures(
      code,
      5,
      "script",
      new Set(),
      { ast },
    );

    assert.strictEqual(
      foundFeatures.OptionalChaining,
      false,
      "Should not detect ?. in ternary as OptionalChaining",
    );
    assert.strictEqual(
      unsupportedFeatures.length,
      0,
      "Should have no unsupported features",
    );
  });

  it("should correctly ignore feature-like patterns in strings and literals", () => {
    const code = `
      var a = "image_123_456";
      var b = "**markdown**";
      var c = obj.prop ? 0.5 : 1;
    `;
    const ast = acorn.parse(code, { ecmaVersion: 5 });

    const { foundFeatures, unsupportedFeatures } = detectFeatures(
      code,
      5,
      "script",
      new Set(),
      { ast },
    );

    assert.strictEqual(foundFeatures.ExponentOperator, false);
    assert.strictEqual(foundFeatures.NumericSeparators, false);
    assert.strictEqual(foundFeatures.OptionalChaining, false);
    assert.strictEqual(
      unsupportedFeatures.length,
      0,
      "Should have no unsupported features",
    );
  });
});
