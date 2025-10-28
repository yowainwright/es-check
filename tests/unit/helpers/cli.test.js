const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const {
  parseIgnoreList,
  generateBashCompletion,
  generateZshCompletion,
  determineInvocationType,
  handleESVersionError,
} = require("../../../lib/helpers/cli.js");

const testDir = path.join(__dirname, "../test-files-cli");

function cleanupTestDir() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

describe("helpers/cli.js", () => {
  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(cleanupTestDir);

  describe("parseIgnoreList()", () => {
    it("should return empty set when no options provided", () => {
      const result = parseIgnoreList(null);

      assert(result instanceof Set);
      assert.strictEqual(result.size, 0);
    });

    it("should return empty set when empty object provided", () => {
      const result = parseIgnoreList({});

      assert(result instanceof Set);
      assert.strictEqual(result.size, 0);
    });

    it("should parse ignore option with single feature", () => {
      const result = parseIgnoreList({ ignore: "ArrowFunctions" });

      assert.strictEqual(result.size, 1);
      assert(result.has("ArrowFunctions"));
    });

    it("should parse ignore option with multiple features", () => {
      const result = parseIgnoreList({
        ignore: "ArrowFunctions,Classes,TemplateLiterals",
      });

      assert.strictEqual(result.size, 3);
      assert(result.has("ArrowFunctions"));
      assert(result.has("Classes"));
      assert(result.has("TemplateLiterals"));
    });

    it("should trim whitespace from features", () => {
      const result = parseIgnoreList({
        ignore: " ArrowFunctions , Classes , TemplateLiterals ",
      });

      assert.strictEqual(result.size, 3);
      assert(result.has("ArrowFunctions"));
      assert(result.has("Classes"));
      assert(result.has("TemplateLiterals"));
    });

    it("should return empty set when ignore is empty string", () => {
      const result = parseIgnoreList({ ignore: "" });

      assert.strictEqual(result.size, 0);
    });

    it("should return empty set when ignore is whitespace only", () => {
      const result = parseIgnoreList({ ignore: "   " });

      assert.strictEqual(result.size, 0);
    });

    it("should parse allowList option with features", () => {
      const result = parseIgnoreList({ allowList: "Feature1,Feature2" });

      assert.strictEqual(result.size, 2);
      assert(result.has("Feature1"));
      assert(result.has("Feature2"));
    });

    it("should combine ignore and allowList options", () => {
      const result = parseIgnoreList({
        ignore: "Feature1,Feature2",
        allowList: "Feature3,Feature4",
      });

      assert.strictEqual(result.size, 4);
      assert(result.has("Feature1"));
      assert(result.has("Feature2"));
      assert(result.has("Feature3"));
      assert(result.has("Feature4"));
    });

    it("should read from ignoreFile when provided", () => {
      const ignoreFilePath = path.join(testDir, "ignore.json");
      fs.writeFileSync(
        ignoreFilePath,
        JSON.stringify({
          features: ["Feature1", "Feature2", "Feature3"],
        }),
      );

      const result = parseIgnoreList({ ignoreFile: ignoreFilePath });

      assert.strictEqual(result.size, 3);
      assert(result.has("Feature1"));
      assert(result.has("Feature2"));
      assert(result.has("Feature3"));
    });

    it("should read from ignore-file when provided", () => {
      const ignoreFilePath = path.join(testDir, "ignore-kebab.json");
      fs.writeFileSync(
        ignoreFilePath,
        JSON.stringify({
          features: ["FeatureA", "FeatureB"],
        }),
      );

      const result = parseIgnoreList({ "ignore-file": ignoreFilePath });

      assert.strictEqual(result.size, 2);
      assert(result.has("FeatureA"));
      assert(result.has("FeatureB"));
    });

    it("should combine CLI options with ignoreFile", () => {
      const ignoreFilePath = path.join(testDir, "combine.json");
      fs.writeFileSync(
        ignoreFilePath,
        JSON.stringify({
          features: ["FileFeature1", "FileFeature2"],
        }),
      );

      const result = parseIgnoreList({
        ignore: "CLIFeature1",
        ignoreFile: ignoreFilePath,
      });

      assert.strictEqual(result.size, 3);
      assert(result.has("CLIFeature1"));
      assert(result.has("FileFeature1"));
      assert(result.has("FileFeature2"));
    });

    it("should throw error when ignoreFile does not exist", () => {
      const ignoreFilePath = path.join(testDir, "nonexistent.json");

      assert.throws(() => {
        parseIgnoreList({ ignoreFile: ignoreFilePath });
      }, /Ignore file not found/);
    });

    it("should throw error when ignoreFile has invalid JSON", () => {
      const ignoreFilePath = path.join(testDir, "invalid.json");
      fs.writeFileSync(ignoreFilePath, "invalid json content");

      assert.throws(() => {
        parseIgnoreList({ ignoreFile: ignoreFilePath });
      }, /Failed to parse ignore file/);
    });

    it("should handle ignoreFile with empty features array", () => {
      const ignoreFilePath = path.join(testDir, "empty-features.json");
      fs.writeFileSync(ignoreFilePath, JSON.stringify({ features: [] }));

      const result = parseIgnoreList({ ignoreFile: ignoreFilePath });

      assert.strictEqual(result.size, 0);
    });

    it("should handle ignoreFile with no features key", () => {
      const ignoreFilePath = path.join(testDir, "no-features.json");
      fs.writeFileSync(ignoreFilePath, JSON.stringify({}));

      const result = parseIgnoreList({ ignoreFile: ignoreFilePath });

      assert.strictEqual(result.size, 0);
    });

    it("should skip non-string features in ignoreFile", () => {
      const ignoreFilePath = path.join(testDir, "mixed-types.json");
      fs.writeFileSync(
        ignoreFilePath,
        JSON.stringify({
          features: ["ValidFeature", null, 123, "AnotherValid", undefined],
        }),
      );

      const result = parseIgnoreList({ ignoreFile: ignoreFilePath });

      assert.strictEqual(result.size, 2);
      assert(result.has("ValidFeature"));
      assert(result.has("AnotherValid"));
    });
  });

  describe("generateBashCompletion()", () => {
    it("should generate bash completion script", () => {
      const result = generateBashCompletion(
        "es-check",
        ["completion", "help"],
        ["version", "module", "light"],
      );

      assert(typeof result === "string");
      assert(result.includes("_es_check_completion"));
      assert(result.includes("completion help"));
      assert(result.includes("--version --module --light"));
      assert(result.includes("complete -F _es_check_completion es-check"));
    });

    it("should handle command names with dashes", () => {
      const result = generateBashCompletion("my-tool", ["test"], ["flag"]);

      assert(result.includes("_my_tool_completion"));
      assert(result.includes("complete -F _my_tool_completion my-tool"));
    });

    it("should include ES versions in completion", () => {
      const result = generateBashCompletion("es-check", [], []);

      assert(result.includes("es3 es5 es6 es2015"));
      assert(result.includes("es2025"));
    });
  });

  describe("generateZshCompletion()", () => {
    it("should generate zsh completion script", () => {
      const result = generateZshCompletion(
        "es-check",
        ["completion", "help"],
        ["version", "module", "light"],
      );

      assert(typeof result === "string");
      assert(result.includes("#compdef es-check"));
      assert(result.includes("_es_check"));
      assert(result.includes('"completion:Command description"'));
      assert(result.includes('"--version[Option description]"'));
    });

    it("should handle command names with dashes", () => {
      const result = generateZshCompletion("my-tool", ["test"], ["flag"]);

      assert(result.includes("#compdef my-tool"));
      assert(result.includes("_my_tool"));
    });

    it("should include ES versions with descriptions", () => {
      const result = generateZshCompletion("es-check", [], []);

      assert(result.includes('"es3:ECMAScript 3"'));
      assert(result.includes('"es5:ECMAScript 5"'));
      assert(result.includes('"es2025:ECMAScript 2025"'));
    });
  });

  describe("determineInvocationType()", () => {
    it("should detect Node API mode when no argument provided", () => {
      const result = determineInvocationType(null);

      assert.strictEqual(result.isNodeAPI, true);
      assert.strictEqual(result.logger, null);
    });

    it("should detect Node API mode when undefined provided", () => {
      const result = determineInvocationType(undefined);

      assert.strictEqual(result.isNodeAPI, true);
      assert.strictEqual(result.logger, null);
    });

    it("should detect Node API mode when options object without logger methods", () => {
      const result = determineInvocationType({ verbose: true, module: false });

      assert.strictEqual(result.isNodeAPI, true);
      assert.strictEqual(result.logger, null);
    });

    it("should detect Node API mode and extract logger from options", () => {
      const mockLogger = { info: () => {}, error: () => {} };
      const result = determineInvocationType({ logger: mockLogger });

      assert.strictEqual(result.isNodeAPI, true);
      assert.strictEqual(result.logger, mockLogger);
    });

    it("should detect CLI mode when logger object provided", () => {
      const mockLogger = { info: () => {}, error: () => {} };
      const result = determineInvocationType(mockLogger);

      assert.strictEqual(result.isNodeAPI, false);
      assert.strictEqual(result.logger, mockLogger);
    });

    it("should detect CLI mode when object has info method", () => {
      const mockLogger = { info: () => {} };
      const result = determineInvocationType(mockLogger);

      assert.strictEqual(result.isNodeAPI, false);
      assert.strictEqual(result.logger, mockLogger);
    });

    it("should detect CLI mode when object has error method", () => {
      const mockLogger = { error: () => {} };
      const result = determineInvocationType(mockLogger);

      assert.strictEqual(result.isNodeAPI, false);
      assert.strictEqual(result.logger, mockLogger);
    });
  });

  describe("handleESVersionError()", () => {
    it("should add error to allErrors in Node API mode", () => {
      const allErrors = [];
      const result = handleESVersionError({
        errorType: "invalid",
        errorMessage: "Invalid ES version",
        logger: null,
        isNodeAPI: true,
        allErrors,
        file: "test.js",
      });

      assert.strictEqual(result.shouldContinue, true);
      assert.strictEqual(result.hasErrors, true);
      assert.strictEqual(allErrors.length, 1);
      assert.strictEqual(allErrors[0].err.message, "Invalid ES version");
      assert.strictEqual(allErrors[0].file, "test.js");
    });

    it("should use default file name when not provided", () => {
      const allErrors = [];
      handleESVersionError({
        errorType: "invalid",
        errorMessage: "Error",
        logger: null,
        isNodeAPI: true,
        allErrors,
      });

      assert.strictEqual(allErrors[0].file, "config");
    });

    it("should log error when logger provided", () => {
      const logs = [];
      const mockLogger = {
        error: (msg) => logs.push(msg),
      };

      const allErrors = [];
      handleESVersionError({
        errorType: "invalid",
        errorMessage: "Test error",
        logger: mockLogger,
        isNodeAPI: true,
        allErrors,
      });

      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0], "Test error");
    });
  });
});
