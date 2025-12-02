const { describe, it } = require("node:test");
const assert = require("node:assert");
const { parseCode } = require("../../../lib/helpers/parsers.js");

describe("helpers/parsers.js", () => {
  describe("parseCode()", () => {
    it("should parse valid code with acorn", () => {
      const acorn = require("acorn");
      const code = "var x = 5;";
      const result = parseCode(code, { ecmaVersion: 5 }, acorn, "test.js");

      assert.strictEqual(result.error, null);
      assert(result.ast);
      assert.strictEqual(result.ast.type, "Program");
    });

    it("should return error for invalid syntax", () => {
      const acorn = require("acorn");
      const code = "var x = ;";
      const result = parseCode(code, { ecmaVersion: 5 }, acorn, "test.js");

      assert(result.error);
      assert.strictEqual(result.ast, null);
    });

    it("should parse nullish coalescing assignment with ES2021", () => {
      const acorn = require("acorn");
      const code = "let obj = {}; obj.key ??= 'default';";
      const result = parseCode(code, { ecmaVersion: 12 }, acorn, "test.js");

      assert.strictEqual(result.error, null);
      assert(result.ast);
      assert.strictEqual(result.ast.type, "Program");
    });

    it("should fail to parse nullish coalescing assignment with ES2020", () => {
      const acorn = require("acorn");
      const code = "let obj = {}; obj.key ??= 'default';";
      const result = parseCode(code, { ecmaVersion: 11 }, acorn, "test.js");

      assert(result.error);
      assert.strictEqual(result.ast, null);
    });

    it("should parse static initialization blocks with ES2022", () => {
      const acorn = require("acorn");
      const code = 'class App { static { console.log("hi"); } }';
      const result = parseCode(code, { ecmaVersion: 13 }, acorn, "test.js");

      assert.strictEqual(result.error, null);
      assert(result.ast);
      assert.strictEqual(result.ast.type, "Program");
    });

    it("should fail to parse static initialization blocks with ES2021", () => {
      const acorn = require("acorn");
      const code = 'class App { static { console.log("hi"); } }';
      const result = parseCode(code, { ecmaVersion: 12 }, acorn, "test.js");

      assert(result.error);
      assert.strictEqual(result.ast, null);
    });
  });
});
