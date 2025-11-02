const { describe, it } = require("node:test");
const assert = require("node:assert");
const { buildConfig, warnAboutIgnoreFile } = require("../../../lib/cli/handler.js");

describe("cli/handler.js", () => {
  describe("buildConfig()", () => {
    it("should build config with ecmaVersion", () => {
      const baseConfig = {};
      const options = {};
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.ecmaVersion, "es5");
    });

    it("should build config with files from argument", () => {
      const baseConfig = {};
      const options = {};
      const result = buildConfig("es5", ["file1.js", "file2.js"], options, baseConfig);

      assert.deepStrictEqual(result.files, ["file1.js", "file2.js"]);
    });

    it("should build config with files from option", () => {
      const baseConfig = {};
      const options = { files: "file1.js,file2.js" };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.deepStrictEqual(result.files, ["file1.js", "file2.js"]);
    });

    it("should prefer files argument over option", () => {
      const baseConfig = {};
      const options = { files: "file3.js" };
      const result = buildConfig("es5", ["file1.js", "file2.js"], options, baseConfig);

      assert.deepStrictEqual(result.files, ["file1.js", "file2.js"]);
    });

    it("should parse not option as comma-separated", () => {
      const baseConfig = {};
      const options = { not: "vendor,node_modules" };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.deepStrictEqual(result.not, ["vendor", "node_modules"]);
    });

    it("should trim whitespace from not option", () => {
      const baseConfig = {};
      const options = { not: " vendor , node_modules " };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.deepStrictEqual(result.not, ["vendor", "node_modules"]);
    });

    it("should handle module option", () => {
      const baseConfig = {};
      const options = { module: true };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.module, true);
    });

    it("should handle allowHashBang option", () => {
      const baseConfig = {};
      const options = { allowHashBang: true };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.allowHashBang, true);
    });

    it("should handle allow-hash-bang option", () => {
      const baseConfig = {};
      const options = { "allow-hash-bang": true };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.allowHashBang, true);
    });

    it("should handle checkFeatures option", () => {
      const baseConfig = {};
      const options = { checkFeatures: true };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.checkFeatures, true);
    });

    it("should handle checkForPolyfills option", () => {
      const baseConfig = {};
      const options = { checkForPolyfills: true };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.checkForPolyfills, true);
    });

    it("should inherit from baseConfig", () => {
      const baseConfig = { cache: true, batchSize: 5 };
      const options = {};
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.cache, true);
      assert.strictEqual(result.batchSize, 5);
    });

    it("should override baseConfig with options", () => {
      const baseConfig = { module: true, ignore: "Feature1" };
      const options = { module: false, ignore: "Feature2" };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.module, false);
      assert.strictEqual(result.ignore, "Feature2");
    });

    it("should handle ignoreFile option", () => {
      const baseConfig = {};
      const options = { ignoreFile: ".ignore.json" };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.ignoreFile, ".ignore.json");
    });

    it("should handle ignore-file option", () => {
      const baseConfig = {};
      const options = { "ignore-file": ".ignore.json" };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.ignoreFile, ".ignore.json");
    });

    it("should handle looseGlobMatching option", () => {
      const baseConfig = {};
      const options = { looseGlobMatching: true };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.looseGlobMatching, true);
    });

    it("should handle allowList option", () => {
      const baseConfig = {};
      const options = { allowList: "const,let" };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.allowList, "const,let");
    });

    it("should handle checkBrowser option", () => {
      const baseConfig = {};
      const options = { checkBrowser: true };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.checkBrowser, true);
    });

    it("should handle browserslist options", () => {
      const baseConfig = {};
      const options = {
        browserslistQuery: "last 2 versions",
        browserslistPath: ".browserslistrc",
        browserslistEnv: "production",
      };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.browserslistQuery, "last 2 versions");
      assert.strictEqual(result.browserslistPath, ".browserslistrc");
      assert.strictEqual(result.browserslistEnv, "production");
    });

    it("should handle batchSize option", () => {
      const baseConfig = {};
      const options = { batchSize: 10 };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.batchSize, 10);
    });

    it("should handle noCache option", () => {
      const baseConfig = { cache: true };
      const options = { noCache: true };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.cache, false);
    });

    it("should handle light option", () => {
      const baseConfig = {};
      const options = { light: true };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.strictEqual(result.light, true);
    });

    it("should filter empty strings from files", () => {
      const baseConfig = {};
      const options = { files: "file1.js,,file2.js," };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.deepStrictEqual(result.files, ["file1.js", "file2.js"]);
    });

    it("should filter empty strings from not", () => {
      const baseConfig = {};
      const options = { not: "vendor,,node_modules," };
      const result = buildConfig("es5", [], options, baseConfig);

      assert.deepStrictEqual(result.not, ["vendor", "node_modules"]);
    });
  });

  describe("warnAboutIgnoreFile()", () => {
    it("should not warn when ignoreFile is not provided", () => {
      const warnings = [];
      const logger = {
        warn: (msg) => warnings.push(msg),
        isLevelEnabled: () => true,
      };

      warnAboutIgnoreFile(undefined, logger);

      assert.strictEqual(warnings.length, 0);
    });

    it("should not warn when logger level is not enabled", () => {
      const warnings = [];
      const logger = {
        warn: (msg) => warnings.push(msg),
        isLevelEnabled: () => false,
      };

      warnAboutIgnoreFile("nonexistent.json", logger);

      assert.strictEqual(warnings.length, 0);
    });
  });
});
