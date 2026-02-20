const { test, describe } = require("node:test");
const { TestSuite } = require("../utils");

describe("Modern ES-Check Testing Example", () => {
  let testSuite;

  test("setup", () => {
    testSuite = new TestSuite({ verbose: false });
  });

  test("should pass ES6 features with ES6 target", async () => {
    await testSuite.testESVersionCompatibility(6, ["const", "arrow"], true);
  });

  test("should fail ES11 features with ES8 target", async () => {
    await testSuite.testESVersionCompatibility(8, ["OptionalChaining"], false);
  });

  test("should detect polyfills for modern features", async () => {
    await testSuite.testPolyfillDetection(
      8,
      ["Array.prototype.toSorted"],
      ["Array.prototype.toSorted"],
    );
  });

  test("should work with browserslist queries", async () => {
    await testSuite.testBrowserslistIntegration("Chrome >= 100", [], true);
  });

  test("should ignore polyfillable features when requested", async () => {
    await testSuite.testIgnorePolyfillable(
      8,
      ["Array.prototype.at"],
      "core-js",
    );
  });

  test("cleanup", () => {
    testSuite.cleanup();
  });
});
