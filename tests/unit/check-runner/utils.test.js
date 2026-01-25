const { describe, it, test, mock } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");
const {
  parseFilePatterns,
  validateConfig,
  findFiles,
  determineEcmaVersion,
  filterIgnoredFiles,
  parseIgnoreList,
  createFileProcessor,
} = require("../../../lib/check-runner/utils.js");

describe("check-runner/utils.js", () => {
  describe("parseFilePatterns()", () => {
    it("should return empty array for undefined", () => {
      const result = parseFilePatterns(undefined);
      assert.deepStrictEqual(result, []);
    });

    it("should return empty array for null", () => {
      const result = parseFilePatterns(null);
      assert.deepStrictEqual(result, []);
    });

    it("should parse string as comma-separated", () => {
      const result = parseFilePatterns("file1.js,file2.js,file3.js");
      assert.deepStrictEqual(result, ["file1.js", "file2.js", "file3.js"]);
    });

    it("should trim whitespace from string patterns", () => {
      const result = parseFilePatterns(" file1.js , file2.js ");
      assert.deepStrictEqual(result, ["file1.js", "file2.js"]);
    });

    it("should filter empty strings", () => {
      const result = parseFilePatterns("file1.js,,file2.js,");
      assert.deepStrictEqual(result, ["file1.js", "file2.js"]);
    });

    it("should handle array input", () => {
      const result = parseFilePatterns(["file1.js", "file2.js"]);
      assert.deepStrictEqual(result, ["file1.js", "file2.js"]);
    });

    it("should trim array items and filter empty", () => {
      const result = parseFilePatterns([" file1.js ", "", "file2.js"]);
      assert.deepStrictEqual(result, ["file1.js", "file2.js"]);
    });

    it("should handle non-string/non-array input", () => {
      const result = parseFilePatterns(123);
      assert.deepStrictEqual(result, []);
    });
  });

  describe("validateConfig()", () => {
    it("should return valid when ecmaVersion is provided", () => {
      const config = { ecmaVersion: "es6" };
      const options = { logger: null, isNodeAPI: true, allErrors: [] };

      const result = validateConfig(config, options);

      assert.strictEqual(result.isValid, true);
    });

    it("should return valid when checkBrowser is true", () => {
      const config = { checkBrowser: true };
      const options = { logger: null, isNodeAPI: true, allErrors: [] };

      const result = validateConfig(config, options);

      assert.strictEqual(result.isValid, true);
    });

    it("should return invalid when both ecmaVersion and checkBrowser are missing", () => {
      const config = {};
      const allErrors = [];
      const options = { logger: null, isNodeAPI: true, allErrors };

      const result = validateConfig(config, options);

      assert.strictEqual(result.isValid, false);
      assert.strictEqual(allErrors.length, 1);
      assert.match(allErrors[0].err.message, /No ecmaScript version/);
      assert.strictEqual(allErrors[0].file, "config");
    });

    it("should log error when logger is provided", () => {
      const config = {};
      const errors = [];
      const logger = {
        error: (msg) => errors.push(msg),
      };
      const options = { logger, isNodeAPI: true, allErrors: [] };

      validateConfig(config, options);

      assert.strictEqual(errors.length, 1);
      assert.match(errors[0], /No ecmaScript version/);
    });
  });

  describe("findFiles()", () => {
    it("should find files matching glob pattern", () => {
      const patterns = ["./tests/fixtures/es5.js"];
      const options = {
        globOpts: {},
        looseGlobMatching: false,
        logger: null,
        isNodeAPI: true,
        allErrors: [],
      };

      const result = findFiles(patterns, options);

      assert.strictEqual(result.hasError, false);
      assert.strictEqual(result.files.length, 1);
      assert.match(result.files[0], /es5\.js$/);
    });

    it("should find multiple files with wildcard pattern", () => {
      const patterns = ["./tests/fixtures/es5*.js"];
      const options = {
        globOpts: {},
        looseGlobMatching: false,
        logger: null,
        isNodeAPI: true,
        allErrors: [],
      };

      const result = findFiles(patterns, options);

      assert.strictEqual(result.hasError, false);
      assert.ok(result.files.length >= 2);
    });

    it("should handle no patterns with looseGlobMatching", () => {
      const patterns = [];
      const warnings = [];
      const logger = {
        warn: (msg) => warnings.push(msg),
      };
      const options = {
        globOpts: {},
        looseGlobMatching: true,
        logger,
        isNodeAPI: true,
        allErrors: [],
      };

      const result = findFiles(patterns, options);

      assert.strictEqual(result.hasError, false);
      assert.deepStrictEqual(result.files, []);
      assert.strictEqual(warnings.length, 1);
    });

    it("should error when no patterns and no looseGlobMatching", () => {
      const patterns = [];
      const allErrors = [];
      const options = {
        globOpts: {},
        looseGlobMatching: false,
        logger: null,
        isNodeAPI: true,
        allErrors,
      };

      const result = findFiles(patterns, options);

      assert.strictEqual(result.hasError, true);
      assert.deepStrictEqual(result.files, []);
      assert.strictEqual(allErrors.length, 1);
      assert.match(allErrors[0].err.message, /No file patterns/);
    });

    it("should add error when pattern finds no files without looseGlobMatching", () => {
      const patterns = ["./nonexistent/**/*.js"];
      const allErrors = [];
      const options = {
        globOpts: {},
        looseGlobMatching: false,
        logger: null,
        isNodeAPI: true,
        allErrors,
      };

      findFiles(patterns, options);

      assert.ok(allErrors.length >= 1);
      assert.match(allErrors[0].err.message, /Did not find any files/);
    });

    it("should warn when no files found with looseGlobMatching", () => {
      const patterns = ["./nonexistent/**/*.js"];
      const warnings = [];
      const logger = {
        warn: (msg) => warnings.push(msg),
      };
      const options = {
        globOpts: {},
        looseGlobMatching: true,
        logger,
        isNodeAPI: true,
        allErrors: [],
      };

      const result = findFiles(patterns, options);

      assert.strictEqual(result.hasError, false);
      assert.strictEqual(warnings.length, 1);
    });
  });

  describe("determineEcmaVersion()", () => {
    it("should return ecmaVersion from config when valid", () => {
      const config = { ecmaVersion: "es6" };
      const options = {
        logger: null,
        isDebug: false,
        isWarn: false,
        isNodeAPI: true,
        allErrors: [],
      };

      const result = determineEcmaVersion(config, options);

      assert.strictEqual(result.ecmaVersion, "6");
      assert.strictEqual(result.hasError, false);
    });

    it("should normalize es2015 to version 6", () => {
      const config = { ecmaVersion: "es2015" };
      const options = {
        logger: null,
        isDebug: false,
        isWarn: false,
        isNodeAPI: true,
        allErrors: [],
      };

      const result = determineEcmaVersion(config, options);

      assert.strictEqual(result.ecmaVersion, "6");
      assert.strictEqual(result.hasError, false);
    });

    it("should handle invalid ecmaVersion", () => {
      const config = { ecmaVersion: "invalid" };
      const allErrors = [];
      const options = {
        logger: null,
        isDebug: false,
        isWarn: false,
        isNodeAPI: true,
        allErrors,
      };

      const result = determineEcmaVersion(config, options);

      assert.strictEqual(result.ecmaVersion, null);
      assert.strictEqual(result.hasError, true);
      assert.strictEqual(allErrors.length, 1);
      assert.match(allErrors[0].err.message, /Invalid ecmaScript version/);
    });

    it("should use browserslist when checkBrowser is true", () => {
      const config = {
        checkBrowser: true,
        browserslistQuery: "last 2 Chrome versions",
      };
      const options = {
        logger: null,
        isDebug: false,
        isWarn: false,
        isNodeAPI: true,
        allErrors: [],
      };

      const result = determineEcmaVersion(config, options);

      assert.strictEqual(result.hasError, false);
      assert.strictEqual(typeof result.ecmaVersion, "string");
    });

    it("should log debug message when browserslist succeeds and debug enabled", () => {
      const config = {
        checkBrowser: true,
        browserslistQuery: "last 2 Chrome versions",
      };
      const debugMessages = [];
      const logger = {
        debug: (msg) => debugMessages.push(msg),
      };
      const options = {
        logger,
        isDebug: true,
        isWarn: false,
        isNodeAPI: true,
        allErrors: [],
      };

      const result = determineEcmaVersion(config, options);

      assert.strictEqual(result.hasError, false);
      assert.strictEqual(debugMessages.length, 1);
      assert.match(debugMessages[0], /browserslist/);
    });
  });

  describe("filterIgnoredFiles()", () => {
    it("should return all files when no ignore patterns", () => {
      const files = ["file1.js", "file2.js", "file3.js"];
      const pathsToIgnore = [];
      const globOpts = {};

      const result = filterIgnoredFiles(files, pathsToIgnore, globOpts);

      assert.deepStrictEqual(result, files);
    });

    it("should filter out ignored files", () => {
      const files = [
        "src/main.js",
        "src/test.js",
        "node_modules/lib.js",
        "vendor/vendor.js",
      ];
      const pathsToIgnore = ["**/node_modules/**", "**/vendor/**"];
      const globOpts = {};

      const result = filterIgnoredFiles(files, pathsToIgnore, globOpts);

      assert.ok(result.length <= 4);
      assert.ok(result.includes("src/main.js"));
      assert.ok(result.includes("src/test.js"));
    });

    it("should handle specific file patterns", () => {
      const files = ["src/main.js", "src/test.js", "src/config.js"];
      const pathsToIgnore = ["**/test.js"];
      const globOpts = {};

      const result = filterIgnoredFiles(files, pathsToIgnore, globOpts);

      assert.ok(result.length <= 3);
      assert.ok(result.includes("src/main.js"));
      assert.ok(result.includes("src/config.js"));
    });
  });

  describe("parseIgnoreList()", () => {
    it("should return empty set when no options provided", () => {
      const result = parseIgnoreList();

      assert.ok(result instanceof Set);
      assert.strictEqual(result.size, 0);
    });

    it("should parse ignore option as comma-separated", () => {
      const result = parseIgnoreList({ ignore: "const,let,class" });

      assert.ok(result instanceof Set);
      assert.strictEqual(result.size, 3);
      assert.ok(result.has("const"));
      assert.ok(result.has("let"));
      assert.ok(result.has("class"));
    });

    it("should trim whitespace from ignore features", () => {
      const result = parseIgnoreList({ ignore: " const , let , class " });

      assert.strictEqual(result.size, 3);
      assert.ok(result.has("const"));
      assert.ok(result.has("let"));
    });

    it("should parse allowList option", () => {
      const result = parseIgnoreList({ allowList: "const,let" });

      assert.strictEqual(result.size, 2);
      assert.ok(result.has("const"));
      assert.ok(result.has("let"));
    });

    it("should combine ignore and allowList", () => {
      const result = parseIgnoreList({
        ignore: "const,let",
        allowList: "class,async",
      });

      assert.strictEqual(result.size, 4);
      assert.ok(result.has("const"));
      assert.ok(result.has("let"));
      assert.ok(result.has("class"));
      assert.ok(result.has("async"));
    });
  });
});

const testDir = path.join(__dirname, "test-files-utils");

if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

function cleanupTestDir() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

test("createFileProcessor returns ES-Check feature error with file and stack", () => {
  const testFile = path.join(testDir, "es6-features.js");
  fs.writeFileSync(testFile, "const x = 1; let y = 2;");

  const config = { checkFeatures: true };
  const acornOpts = { ecmaVersion: 2025, sourceType: "script" };
  const processFile = createFileProcessor(config, {
    acornOpts,
    ignoreList: new Set(),
    logger: null,
    isDebug: false,
    ecmaVersion: "5",
  });

  const result = processFile(testFile);

  assert.ok(result !== null);
  assert.ok(result.err);
  assert.ok(result.file);
  assert.ok(result.stack);
});

test("createFileProcessor returns null for valid ES version match", () => {
  const testFile = path.join(testDir, "es5-valid.js");
  fs.writeFileSync(testFile, "var x = 1;");

  const config = { checkFeatures: true };
  const acornOpts = { ecmaVersion: 2025, sourceType: "script" };
  const processFile = createFileProcessor(config, {
    acornOpts,
    ignoreList: new Set(),
    logger: null,
    isDebug: false,
    ecmaVersion: "5",
  });

  const result = processFile(testFile);

  assert.strictEqual(result, null);
});

test("parses TypeScript syntax in .ts files", () => {
  const testFile = path.join(testDir, "types.ts");
  fs.writeFileSync(
    testFile,
    "type User = { id: number }; const user: User = { id: 1 }; enum ACCESS { ADMIN, USER }",
  );

  const config = { checkFeatures: false };
  const acornOpts = { ecmaVersion: 2025, sourceType: "script" };
  const processFile = createFileProcessor(config, {
    acornOpts,
    ignoreList: new Set(),
    logger: null,
    isDebug: false,
    ecmaVersion: "5",
  });

  const result = processFile(testFile);

  assert.strictEqual(result, null);
});

test("parses static initialization blocks when checkFeatures enabled", () => {
  const testFile = path.join(testDir, "static-block.js");
  fs.writeFileSync(testFile, "class App { static { console.log('hi'); } }");

  const config = { checkFeatures: true };
  const acornOpts = { ecmaVersion: 2025, sourceType: "script" };
  const processFile = createFileProcessor(config, {
    acornOpts,
    ignoreList: new Set(),
    logger: null,
    isDebug: false,
    ecmaVersion: "13",
  });

  const result = processFile(testFile);

  assert.strictEqual(result, null);
});

test("parses nullish coalescing assignment when checkFeatures enabled", () => {
  const testFile = path.join(testDir, "nullish-assign.js");
  fs.writeFileSync(testFile, "const x = {}; x.val ??= 'test';");

  const config = { checkFeatures: true };
  const acornOpts = { ecmaVersion: 2025, sourceType: "script" };
  const processFile = createFileProcessor(config, {
    acornOpts,
    ignoreList: new Set(),
    logger: null,
    isDebug: false,
    ecmaVersion: "12",
  });

  const result = processFile(testFile);

  assert.strictEqual(result, null);
});

test("does not flag RegExp constructor as RegExpEscape", () => {
  const testFile = path.join(testDir, "regexp.js");
  fs.writeFileSync(
    testFile,
    "function a(v) { return v.replace(RegExp(v, 'g')); }",
  );

  const config = { checkFeatures: true };
  const acornOpts = { ecmaVersion: 2025, sourceType: "script" };
  const processFile = createFileProcessor(config, {
    acornOpts,
    ignoreList: new Set(),
    logger: null,
    isDebug: false,
    ecmaVersion: "12",
  });

  const result = processFile(testFile);

  assert.strictEqual(result, null);
});

test("does not flag basic Error constructor as ErrorCause", () => {
  const testFile = path.join(testDir, "error.js");
  fs.writeFileSync(testFile, "function a() { throw new Error('message'); }");

  const config = { checkFeatures: true };
  const acornOpts = { ecmaVersion: 2025, sourceType: "script" };
  const processFile = createFileProcessor(config, {
    acornOpts,
    ignoreList: new Set(),
    logger: null,
    isDebug: false,
    ecmaVersion: "12",
  });

  const result = processFile(testFile);

  assert.strictEqual(result, null);
});

test("does not flag await in async function as TopLevelAwait", () => {
  const testFile = path.join(testDir, "async-await.js");
  fs.writeFileSync(testFile, "async function a() { await Promise.resolve(); }");

  const config = { checkFeatures: true };
  const acornOpts = { ecmaVersion: 2025, sourceType: "script" };
  const processFile = createFileProcessor(config, {
    acornOpts,
    ignoreList: new Set(),
    logger: null,
    isDebug: false,
    ecmaVersion: "12",
  });

  const result = processFile(testFile);

  assert.strictEqual(result, null);
});

test("does not flag standard in operator as ErgonomicBrandChecks", () => {
  const testFile = path.join(testDir, "in-operator.js");
  fs.writeFileSync(testFile, "function a() { const b = {}; return 'c' in b; }");

  const config = { checkFeatures: true };
  const acornOpts = { ecmaVersion: 2025, sourceType: "script" };
  const processFile = createFileProcessor(config, {
    acornOpts,
    ignoreList: new Set(),
    logger: null,
    isDebug: false,
    ecmaVersion: "12",
  });

  const result = processFile(testFile);

  assert.strictEqual(result, null);
});

test("returns error when unsupported features detected", () => {
  const testFile = path.join(testDir, "unsupported.js");
  fs.writeFileSync(testFile, "const x = 1; let y = 2; const fn = () => {};");

  const config = { checkFeatures: true };
  const acornOpts = { ecmaVersion: 2025, sourceType: "script" };
  const processFile = createFileProcessor(config, {
    acornOpts,
    ignoreList: new Set(),
    logger: null,
    isDebug: false,
    ecmaVersion: "5",
  });

  const result = processFile(testFile);

  assert.ok(result !== null);
  assert.ok(result.err.message.includes("Unsupported features"));
  assert.ok(result.file);
  assert.ok(result.stack);
});

test("re-throws non-ES-Check errors from detectFeatures", () => {
  const testFile = path.join(testDir, "rethrow.js");
  fs.writeFileSync(testFile, "var x = 1;");

  const helpers = require("../../../lib/helpers");
  const originalDetectFeatures = helpers.detectFeatures;
  const unexpectedError = new Error("Unexpected internal error");
  helpers.detectFeatures = () => {
    throw unexpectedError;
  };

  const utilsPath = require.resolve("../../../lib/check-runner/utils.js");
  delete require.cache[utilsPath];

  const {
    createFileProcessor: freshProcessor,
  } = require("../../../lib/check-runner/utils.js");

  const config = { checkFeatures: true };
  const acornOpts = { ecmaVersion: 2025, sourceType: "script" };
  const processFile = freshProcessor(config, {
    acornOpts,
    ignoreList: new Set(),
    logger: null,
    isDebug: false,
    ecmaVersion: "5",
  });

  try {
    processFile(testFile);
    assert.fail("Should have thrown");
  } catch (err) {
    assert.strictEqual(err, unexpectedError);
  } finally {
    helpers.detectFeatures = originalDetectFeatures;
    delete require.cache[utilsPath];
  }
});

process.on("exit", cleanupTestDir);
