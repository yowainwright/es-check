const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  detectPolyfills,
  filterPolyfilled,
} = require("../../lib/helpers/polyfillDetector");

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
