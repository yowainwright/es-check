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
  parseArgs,
  showHelp,
  showVersion,
  buildConfig,
  warnAboutIgnoreFile,
} = require("../../../lib/cli/utils.js");

const testDir = path.join(__dirname, "../test-files-cli");

function cleanupTestDir() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

describe("cli/utils.js", () => {
  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(cleanupTestDir);

  it("parseIgnoreList() should return empty set when no options provided", () => {
    const result = parseIgnoreList(null);

    assert(result instanceof Set);
    assert.strictEqual(result.size, 0);
  });

  it("parseIgnoreList() should return empty set when empty object provided", () => {
    const result = parseIgnoreList({});

    assert(result instanceof Set);
    assert.strictEqual(result.size, 0);
  });

  it("parseIgnoreList() should parse ignore option with single feature", () => {
    const result = parseIgnoreList({ ignore: "ArrowFunctions" });

    assert.strictEqual(result.size, 1);
    assert(result.has("ArrowFunctions"));
  });

  it("parseIgnoreList() should parse ignore option with multiple features", () => {
    const result = parseIgnoreList({
      ignore: "ArrowFunctions,Classes,TemplateLiterals",
    });

    assert.strictEqual(result.size, 3);
    assert(result.has("ArrowFunctions"));
    assert(result.has("Classes"));
    assert(result.has("TemplateLiterals"));
  });

  it("parseIgnoreList() should trim whitespace from features", () => {
    const result = parseIgnoreList({
      ignore: " ArrowFunctions , Classes , TemplateLiterals ",
    });

    assert.strictEqual(result.size, 3);
    assert(result.has("ArrowFunctions"));
    assert(result.has("Classes"));
    assert(result.has("TemplateLiterals"));
  });

  it("parseIgnoreList() should return empty set when ignore is empty string", () => {
    const result = parseIgnoreList({ ignore: "" });

    assert.strictEqual(result.size, 0);
  });

  it("parseIgnoreList() should return empty set when ignore is whitespace only", () => {
    const result = parseIgnoreList({ ignore: "   " });

    assert.strictEqual(result.size, 0);
  });

  it("parseIgnoreList() should parse allowList option with features", () => {
    const result = parseIgnoreList({ allowList: "Feature1,Feature2" });

    assert.strictEqual(result.size, 2);
    assert(result.has("Feature1"));
    assert(result.has("Feature2"));
  });

  it("parseIgnoreList() should combine ignore and allowList options", () => {
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

  it("parseIgnoreList() should read from ignoreFile when provided", () => {
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

  it("parseIgnoreList() should read from ignore-file when provided", () => {
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

  it("parseIgnoreList() should combine CLI options with ignoreFile", () => {
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

  it("parseIgnoreList() should throw error when ignoreFile does not exist", () => {
    const ignoreFilePath = path.join(testDir, "nonexistent.json");

    assert.throws(() => {
      parseIgnoreList({ ignoreFile: ignoreFilePath });
    }, /Ignore file not found/);
  });

  it("parseIgnoreList() should throw error when ignoreFile has invalid JSON", () => {
    const ignoreFilePath = path.join(testDir, "invalid.json");
    fs.writeFileSync(ignoreFilePath, "invalid json content");

    assert.throws(() => {
      parseIgnoreList({ ignoreFile: ignoreFilePath });
    }, /Failed to parse ignore file/);
  });

  it("parseIgnoreList() should handle ignoreFile with empty features array", () => {
    const ignoreFilePath = path.join(testDir, "empty-features.json");
    fs.writeFileSync(ignoreFilePath, JSON.stringify({ features: [] }));

    const result = parseIgnoreList({ ignoreFile: ignoreFilePath });

    assert.strictEqual(result.size, 0);
  });

  it("parseIgnoreList() should handle ignoreFile with no features key", () => {
    const ignoreFilePath = path.join(testDir, "no-features.json");
    fs.writeFileSync(ignoreFilePath, JSON.stringify({}));

    const result = parseIgnoreList({ ignoreFile: ignoreFilePath });

    assert.strictEqual(result.size, 0);
  });

  it("parseIgnoreList() should skip non-string features in ignoreFile", () => {
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

  it("generateBashCompletion() should generate bash completion script", () => {
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

  it("generateBashCompletion() should handle command names with dashes", () => {
    const result = generateBashCompletion("my-tool", ["test"], ["flag"]);

    assert(result.includes("_my_tool_completion"));
    assert(result.includes("complete -F _my_tool_completion my-tool"));
  });

  it("generateBashCompletion() should include ES versions in completion", () => {
    const result = generateBashCompletion("es-check", [], []);

    assert(result.includes("es3 es5 es6 es2015"));
    assert(result.includes("es2025"));
    assert(result.includes("es2026"));
  });

  it("generateZshCompletion() should generate zsh completion script", () => {
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

  it("generateZshCompletion() should handle command names with dashes", () => {
    const result = generateZshCompletion("my-tool", ["test"], ["flag"]);

    assert(result.includes("#compdef my-tool"));
    assert(result.includes("_my_tool"));
  });

  it("generateZshCompletion() should include ES versions with descriptions", () => {
    const result = generateZshCompletion("es-check", [], []);

    assert(result.includes('"es3:ECMAScript 3"'));
    assert(result.includes('"es5:ECMAScript 5"'));
    assert(result.includes('"es2025:ECMAScript 2025"'));
    assert(result.includes('"es2026:ECMAScript 2026"'));
  });

  it("determineInvocationType() should detect Node API mode when no argument provided", () => {
    const result = determineInvocationType(null);

    assert.strictEqual(result.isNodeAPI, true);
    assert.strictEqual(result.logger, null);
  });

  it("determineInvocationType() should detect Node API mode when undefined provided", () => {
    const result = determineInvocationType(undefined);

    assert.strictEqual(result.isNodeAPI, true);
    assert.strictEqual(result.logger, null);
  });

  it("determineInvocationType() should detect Node API mode when options object without logger methods", () => {
    const result = determineInvocationType({ verbose: true, module: false });

    assert.strictEqual(result.isNodeAPI, true);
    assert.strictEqual(result.logger, null);
  });

  it("determineInvocationType() should detect Node API mode and extract logger from options", () => {
    const mockLogger = { info: () => {}, error: () => {} };
    const result = determineInvocationType({ logger: mockLogger });

    assert.strictEqual(result.isNodeAPI, true);
    assert.strictEqual(result.logger, mockLogger);
  });

  it("determineInvocationType() should detect CLI mode when logger object provided", () => {
    const mockLogger = { info: () => {}, error: () => {} };
    const result = determineInvocationType(mockLogger);

    assert.strictEqual(result.isNodeAPI, false);
    assert.strictEqual(result.logger, mockLogger);
  });

  it("determineInvocationType() should detect CLI mode when object has info method", () => {
    const mockLogger = { info: () => {} };
    const result = determineInvocationType(mockLogger);

    assert.strictEqual(result.isNodeAPI, false);
    assert.strictEqual(result.logger, mockLogger);
  });

  it("determineInvocationType() should detect CLI mode when object has error method", () => {
    const mockLogger = { error: () => {} };
    const result = determineInvocationType(mockLogger);

    assert.strictEqual(result.isNodeAPI, false);
    assert.strictEqual(result.logger, mockLogger);
  });

  it("handleESVersionError() should add error to allErrors in Node API mode", () => {
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

  it("handleESVersionError() should use default file name when not provided", () => {
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

  it("handleESVersionError() should log error when logger provided", () => {
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

describe("cli/utils.js: configuration", () => {
  it("buildConfig() should build config with ecmaVersion", () => {
    const baseConfig = {};
    const options = {};
    const result = buildConfig("es5", [], options, baseConfig);

    assert.strictEqual(result.ecmaVersion, "es5");
  });

  it("buildConfig() should build config with files from argument", () => {
    const baseConfig = {};
    const options = {};
    const result = buildConfig("es5", ["file1.js", "file2.js"], options, baseConfig);

    assert.deepStrictEqual(result.files, ["file1.js", "file2.js"]);
  });

  it("buildConfig() should build config with files from option", () => {
    const baseConfig = {};
    const options = { files: "file1.js,file2.js" };
    const result = buildConfig("es5", [], options, baseConfig);

    assert.deepStrictEqual(result.files, ["file1.js", "file2.js"]);
  });

  it("buildConfig() should prefer files argument over option", () => {
    const baseConfig = {};
    const options = { files: "file3.js" };
    const result = buildConfig("es5", ["file1.js", "file2.js"], options, baseConfig);

    assert.deepStrictEqual(result.files, ["file1.js", "file2.js"]);
  });

  it("buildConfig() should parse not option as comma-separated", () => {
    const baseConfig = {};
    const options = { not: "vendor,node_modules" };
    const result = buildConfig("es5", [], options, baseConfig);

    assert.deepStrictEqual(result.not, ["vendor", "node_modules"]);
  });

  it("buildConfig() should trim whitespace from not option", () => {
    const baseConfig = {};
    const options = { not: " vendor , node_modules " };
    const result = buildConfig("es5", [], options, baseConfig);

    assert.deepStrictEqual(result.not, ["vendor", "node_modules"]);
  });

  it("buildConfig() should pass through boolean options", () => {
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

  it("buildConfig() should handle allow-hash-bang kebab-case option", () => {
    const result = buildConfig("es5", [], { "allow-hash-bang": true }, {});

    assert.strictEqual(result.allowHashBang, true);
  });

  it("buildConfig() should inherit from baseConfig", () => {
    const baseConfig = { cache: true, batchSize: 5 };
    const options = {};
    const result = buildConfig("es5", [], options, baseConfig);

    assert.strictEqual(result.cache, true);
    assert.strictEqual(result.batchSize, 5);
  });

  it("buildConfig() should override baseConfig with options", () => {
    const baseConfig = { module: true, ignore: "Feature1" };
    const options = { module: false, ignore: "Feature2" };
    const result = buildConfig("es5", [], options, baseConfig);

    assert.strictEqual(result.module, false);
    assert.strictEqual(result.ignore, "Feature2");
  });

  it("buildConfig() should handle ignore-file kebab-case option", () => {
    const result = buildConfig("es5", [], { "ignore-file": ".ignore.json" }, {});

    assert.strictEqual(result.ignoreFile, ".ignore.json");
  });

  it("buildConfig() should pass through string and numeric options", () => {
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

  it("buildConfig() should handle noCache option", () => {
    const result = buildConfig("es5", [], { noCache: true }, { cache: true });

    assert.strictEqual(result.cache, false);
  });

  it("buildConfig() should filter empty strings from files", () => {
    const baseConfig = {};
    const options = { files: "file1.js,,file2.js," };
    const result = buildConfig("es5", [], options, baseConfig);

    assert.deepStrictEqual(result.files, ["file1.js", "file2.js"]);
  });

  it("buildConfig() should filter empty strings from not", () => {
    const baseConfig = {};
    const options = { not: "vendor,,node_modules," };
    const result = buildConfig("es5", [], options, baseConfig);

    assert.deepStrictEqual(result.not, ["vendor", "node_modules"]);
  });

  it("warnAboutIgnoreFile() should not warn when ignoreFile is not provided", () => {
    const warnings = [];
    const logger = {
      warn: (msg) => warnings.push(msg),
      isLevelEnabled: () => true,
    };

    warnAboutIgnoreFile(undefined, logger);

    assert.strictEqual(warnings.length, 0);
  });

  it("warnAboutIgnoreFile() should warn when ignoreFile does not exist", () => {
    const warnings = [];
    const logger = {
      warn: (msg) => warnings.push(msg),
      isLevelEnabled: () => true,
    };

    warnAboutIgnoreFile("/nonexistent/path/to/file.json", logger);

    assert.strictEqual(warnings.length, 1);
    assert.match(warnings[0], /does not exist or is not accessible/);
  });

  it("warnAboutIgnoreFile() should not warn when logger level is not enabled", () => {
    const warnings = [];
    const logger = {
      warn: (msg) => warnings.push(msg),
      isLevelEnabled: () => false,
    };

    warnAboutIgnoreFile("/nonexistent/path.json", logger);

    assert.strictEqual(warnings.length, 0);
  });
});

describe("cli/utils.js: arguments", () => {
  it("parseArgs() should parse positional arguments", () => {
    const argv = ["node", "script.js", "es5", "file1.js", "file2.js"];
    const result = parseArgs(argv);

    assert.deepStrictEqual(result.positional, ["es5", "file1.js", "file2.js"]);
    assert.deepStrictEqual(result.options, {});
  });

  it("parseArgs() should parse long options with equals", () => {
    const argv = ["node", "script.js", "--module", "--config=custom.json"];
    const result = parseArgs(argv);

    assert.deepStrictEqual(result.options, {
      module: true,
      config: "custom.json",
    });
  });

  it("parseArgs() should parse long options with space", () => {
    const argv = ["node", "script.js", "--config", "custom.json", "--module"];
    const result = parseArgs(argv);

    assert.deepStrictEqual(result.options, {
      config: "custom.json",
      module: true,
    });
  });

  it("parseArgs() should parse short options", () => {
    const argv = ["node", "script.js", "-v", "-h"];
    const result = parseArgs(argv);

    assert.deepStrictEqual(result.options, {
      v: true,
      h: true,
    });
  });

  it("parseArgs() should parse combined short options", () => {
    const argv = ["node", "script.js", "-vh"];
    const result = parseArgs(argv);

    assert.deepStrictEqual(result.options, {
      v: true,
      h: true,
    });
  });

  it("parseArgs() should parse short option with value", () => {
    const argv = ["node", "script.js", "-v", "debug"];
    const result = parseArgs(argv);

    assert.deepStrictEqual(result.options, {
      v: "debug",
    });
  });

  it("parseArgs() should handle mixed positional and options", () => {
    const argv = ["node", "script.js", "es5", "file.js", "--module", "--not", "vendor"];
    const result = parseArgs(argv);

    assert.deepStrictEqual(result.positional, ["es5", "file.js"]);
    assert.deepStrictEqual(result.options, {
      module: true,
      not: "vendor",
    });
  });

  it("parseArgs() should handle options with equals containing equals", () => {
    const argv = ["node", "script.js", "--browserslistQuery=last 2 versions, > 1%"];
    const result = parseArgs(argv);

    assert.deepStrictEqual(result.options, {
      browserslistQuery: "last 2 versions, > 1%",
    });
  });

  it("parseArgs() should handle empty argv", () => {
    const argv = ["node", "script.js"];
    const result = parseArgs(argv);

    assert.deepStrictEqual(result.positional, []);
    assert.deepStrictEqual(result.options, {});
  });

  it("parseArgs() should handle boolean flags at end", () => {
    const argv = ["node", "script.js", "es5", "--verbose"];
    const result = parseArgs(argv);

    assert.deepStrictEqual(result.positional, ["es5"]);
    assert.deepStrictEqual(result.options, {
      verbose: true,
    });
  });

  it("parseArgs() should not consume next argument for boolean flags", () => {
    const argv = ["node", "script.js", "--module", "es2022", "dist/**/*.js", "--checkFeatures"];
    const result = parseArgs(argv);

    assert.deepStrictEqual(result.positional, ["es2022", "dist/**/*.js"]);
    assert.deepStrictEqual(result.options, {
      module: true,
      checkFeatures: true,
    });
  });

  it("parseArgs() should handle multiple boolean flags with positional args", () => {
    const argv = [
      "node",
      "script.js",
      "--light",
      "--module",
      "es2020",
      "src/**/*.js",
      "--checkFeatures",
      "--verbose",
    ];
    const result = parseArgs(argv);

    assert.deepStrictEqual(result.positional, ["es2020", "src/**/*.js"]);
    assert.deepStrictEqual(result.options, {
      light: true,
      module: true,
      checkFeatures: true,
      verbose: true,
    });
  });

  it("parseArgs() should handle boolean flags before value-taking options", () => {
    const argv = [
      "node",
      "script.js",
      "--module",
      "es2022",
      "dist/*.js",
      "--not",
      "vendor",
      "--checkFeatures",
    ];
    const result = parseArgs(argv);

    assert.deepStrictEqual(result.positional, ["es2022", "dist/*.js"]);
    assert.deepStrictEqual(result.options, {
      module: true,
      not: "vendor",
      checkFeatures: true,
    });
  });

  it("showVersion() should output version", () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));

    showVersion("1.2.3");

    console.log = originalLog;

    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0], "1.2.3");
  });

  it("showHelp() should output help text", () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));

    showHelp("1.2.3");

    console.log = originalLog;

    assert.strictEqual(logs.length, 1);
    assert(logs[0].includes("ES Check v1.2.3"));
    assert(logs[0].includes("USAGE"));
    assert(logs[0].includes("OPTIONS"));
    assert(logs[0].includes("EXAMPLES"));
  });
});
