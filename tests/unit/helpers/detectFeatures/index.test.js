const { describe, it } = require("node:test");
const assert = require("node:assert");
const detectFeatures = require("../../../../lib/helpers/detectFeatures/index");
const detectPolyfills = detectFeatures.detectPolyfills;
const filterPolyfilled = detectFeatures.filterPolyfilled;

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
        detectFeatures(code, 5, "script", new Set());
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

      const options = { checkForPolyfills: true };

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

      const options = { checkForPolyfills: true };

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
  });

  describe("Module handling", () => {
    it("should parse ES modules correctly", () => {
      const code = `
        import { foo } from './foo.js';
        export const bar = 1;
      `;

      const { foundFeatures } = detectFeatures(code, 6, "module", new Set());
      assert(
        Object.values(foundFeatures).some(Boolean),
        "Should detect some features in ES modules",
      );
    });

    it("should throw for ES modules in script mode", () => {
      const code = `
        import { foo } from './foo.js';
        export const bar = 1;
      `;

      try {
        detectFeatures(code, 6, "script", new Set());
        assert.fail("Should throw for ES modules in script mode");
      } catch (error) {
        assert(error, "Should throw an error");
      }
    });
  });

  describe("Feature detection", () => {
    it("should not confuse console.group with ArrayGroup", () => {
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
        );
        assert.strictEqual(
          unsupportedFeatures.length,
          0,
          "console.group should not be detected as ArrayGroup",
        );
        assert.strictEqual(
          foundFeatures.ArrayGroup,
          false,
          "ArrayGroup should not be detected for console.group",
        );
      } catch (error) {
        assert.fail(
          `Should not throw for console.group in ES2022: ${error.message}`,
        );
      }
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
      const { foundFeatures } = detectFeatures(code, 2020, "script", new Set());
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
      const { foundFeatures } = detectFeatures(code, 2021, "script", new Set());
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

      const { foundFeatures } = detectFeatures(code, 2022, "script", new Set());
      assert(
        Object.values(foundFeatures).some(Boolean),
        "Should detect some ES2022 features",
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

describe("False Positive Prevention (Issue #338)", () => {
  const acorn = require("acorn");

  it("should not detect ExponentOperator in strings containing **", () => {
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

  it("should not detect NumericSeparators in strings with underscores", () => {
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

  it("should not detect OptionalChaining in ternary with decimal", () => {
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

  it("should handle multiple false positive patterns in one file", () => {
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
