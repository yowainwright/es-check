const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  runChecks,
  parseFilePatterns,
  validateConfig,
  processConfig,
} = require("../../../lib/check-runner/index.js");

describe("check-runner/index.js", () => {
  describe("parseFilePatterns()", () => {
    it("should be exported and functional", () => {
      const result = parseFilePatterns("file1.js,file2.js");
      assert.deepStrictEqual(result, ["file1.js", "file2.js"]);
    });
  });

  describe("validateConfig()", () => {
    it("should validate config with ecmaVersion", () => {
      const config = { ecmaVersion: "es6" };
      const options = { logger: null, isNodeAPI: true, allErrors: [] };

      const result = validateConfig(config, options);

      assert.strictEqual(result.isValid, true);
    });
  });

  describe("processConfig()", () => {
    it("should be exported and functional", async () => {
      const config = {
        ecmaVersion: "es5",
        files: "./tests/fixtures/es5.js",
      };
      const logger = {
        info: () => {},
        debug: () => {},
        warn: () => {},
        error: () => {},
        isLevelEnabled: () => false,
      };

      const result = await processConfig(config, logger, true);

      assert.strictEqual(typeof result, "object");
      assert.ok("hasErrors" in result);
    });
  });

  describe("runChecks()", () => {
    it("should be exported and functional", async () => {
      const configs = [
        {
          ecmaVersion: "es5",
          files: "./tests/fixtures/es5.js",
        },
      ];
      const logger = {
        info: () => {},
        debug: () => {},
        warn: () => {},
        error: () => {},
        isLevelEnabled: () => false,
      };

      const result = await runChecks(configs, logger);

      assert.strictEqual(typeof result, "object");
      assert.ok("success" in result);
      assert.ok("errors" in result);
    });
  });
});
