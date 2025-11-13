const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  buildConfig,
  warnAboutIgnoreFile,
} = require("../../../lib/cli/handler.js");

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
      const result = buildConfig(
        "es5",
        ["file1.js", "file2.js"],
        options,
        baseConfig,
      );

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
      const result = buildConfig(
        "es5",
        ["file1.js", "file2.js"],
        options,
        baseConfig,
      );

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

    it("should pass through boolean options", () => {
      const options = {
        module: true,
        allowHashBang: true,
        checkFeatures: true,
      };
      const result = buildConfig("es5", [], options, {});

      assert.strictEqual(result.module, true);
      assert.strictEqual(result.allowHashBang, true);
      assert.strictEqual(result.checkFeatures, true);
    });

    it("should handle allow-hash-bang kebab-case option", () => {
      const result = buildConfig("es5", [], { "allow-hash-bang": true }, {});

      assert.strictEqual(result.allowHashBang, true);
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

    it("should handle ignore-file kebab-case option", () => {
      const result = buildConfig(
        "es5",
        [],
        { "ignore-file": ".ignore.json" },
        {},
      );

      assert.strictEqual(result.ignoreFile, ".ignore.json");
    });

    it("should pass through string and numeric options", () => {
      const result = buildConfig(
        "es5",
        [],
        {
          allowList: "const,let",
          batchSize: 10,
        },
        {},
      );

      assert.strictEqual(result.allowList, "const,let");
      assert.strictEqual(result.batchSize, 10);
    });

    it("should handle noCache option", () => {
      const result = buildConfig("es5", [], { noCache: true }, { cache: true });

      assert.strictEqual(result.cache, false);
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

    it("should warn when ignoreFile does not exist", () => {
      const warnings = [];
      const logger = {
        warn: (msg) => warnings.push(msg),
        isLevelEnabled: () => true,
      };

      warnAboutIgnoreFile("/nonexistent/path/to/file.json", logger);

      assert.strictEqual(warnings.length, 1);
      assert.match(
        warnings[0],
        /does not exist or is not accessible/,
      );
    });

    it("should not warn when logger level is not enabled", () => {
      const warnings = [];
      const logger = {
        warn: (msg) => warnings.push(msg),
        isLevelEnabled: () => false,
      };

      warnAboutIgnoreFile("/nonexistent/path.json", logger);

      assert.strictEqual(warnings.length, 0);
    });
  });
});
