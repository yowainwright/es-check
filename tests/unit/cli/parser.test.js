const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  parseArgs,
  showHelp,
  showVersion,
} = require("../../../lib/cli/parser.js");

describe("cli/parser.js", () => {
  describe("parseArgs()", () => {
    it("should parse positional arguments", () => {
      const argv = ["node", "script.js", "es5", "file1.js", "file2.js"];
      const result = parseArgs(argv);

      assert.deepStrictEqual(result.positional, [
        "es5",
        "file1.js",
        "file2.js",
      ]);
      assert.deepStrictEqual(result.options, {});
    });

    it("should parse long options with equals", () => {
      const argv = ["node", "script.js", "--module", "--config=custom.json"];
      const result = parseArgs(argv);

      assert.deepStrictEqual(result.options, {
        module: true,
        config: "custom.json",
      });
    });

    it("should parse long options with space", () => {
      const argv = ["node", "script.js", "--config", "custom.json", "--module"];
      const result = parseArgs(argv);

      assert.deepStrictEqual(result.options, {
        config: "custom.json",
        module: true,
      });
    });

    it("should parse short options", () => {
      const argv = ["node", "script.js", "-v", "-h"];
      const result = parseArgs(argv);

      assert.deepStrictEqual(result.options, {
        v: true,
        h: true,
      });
    });

    it("should parse combined short options", () => {
      const argv = ["node", "script.js", "-vh"];
      const result = parseArgs(argv);

      assert.deepStrictEqual(result.options, {
        v: true,
        h: true,
      });
    });

    it("should parse short option with value", () => {
      const argv = ["node", "script.js", "-v", "debug"];
      const result = parseArgs(argv);

      assert.deepStrictEqual(result.options, {
        v: "debug",
      });
    });

    it("should handle mixed positional and options", () => {
      const argv = [
        "node",
        "script.js",
        "es5",
        "file.js",
        "--module",
        "--not",
        "vendor",
      ];
      const result = parseArgs(argv);

      assert.deepStrictEqual(result.positional, ["es5", "file.js"]);
      assert.deepStrictEqual(result.options, {
        module: true,
        not: "vendor",
      });
    });

    it("should handle options with equals containing equals", () => {
      const argv = [
        "node",
        "script.js",
        "--browserslistQuery=last 2 versions, > 1%",
      ];
      const result = parseArgs(argv);

      assert.deepStrictEqual(result.options, {
        browserslistQuery: "last 2 versions, > 1%",
      });
    });

    it("should handle empty argv", () => {
      const argv = ["node", "script.js"];
      const result = parseArgs(argv);

      assert.deepStrictEqual(result.positional, []);
      assert.deepStrictEqual(result.options, {});
    });

    it("should handle boolean flags at end", () => {
      const argv = ["node", "script.js", "es5", "--verbose"];
      const result = parseArgs(argv);

      assert.deepStrictEqual(result.positional, ["es5"]);
      assert.deepStrictEqual(result.options, {
        verbose: true,
      });
    });

    it("should not consume next argument for boolean flags", () => {
      const argv = [
        "node",
        "script.js",
        "--module",
        "es2022",
        "dist/**/*.js",
        "--checkFeatures",
      ];
      const result = parseArgs(argv);

      assert.deepStrictEqual(result.positional, ["es2022", "dist/**/*.js"]);
      assert.deepStrictEqual(result.options, {
        module: true,
        checkFeatures: true,
      });
    });

    it("should handle multiple boolean flags with positional args", () => {
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

    it("should handle boolean flags before value-taking options", () => {
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
  });

  describe("showVersion()", () => {
    it("should output version", () => {
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(" "));

      showVersion("1.2.3");

      console.log = originalLog;

      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0], "1.2.3");
    });
  });

  describe("showHelp()", () => {
    it("should output help text", () => {
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
});
