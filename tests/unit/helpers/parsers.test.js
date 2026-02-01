const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  parseCode,
  stripTypeScript,
  isTypeAnnotationContext,
  skipTypeAnnotation,
  skipAsTypeAssertion,
  getKeywordAt,
  isIdentifierChar,
  isWhitespace
} = require("../../../lib/helpers/parsers.js");

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

  describe("stripTypeScript()", () => {
    it("should return input unchanged for non-string input", () => {
      assert.strictEqual(stripTypeScript(null), null);
      assert.strictEqual(stripTypeScript(undefined), undefined);
      assert.strictEqual(stripTypeScript(123), 123);
    });

    it("should preserve plain JavaScript code", () => {
      const code = "const x = 5; function test() { return x; }";
      assert.strictEqual(stripTypeScript(code), code);
    });

    it("should remove simple type annotations", () => {
      const input = "const name: string = 'John';";
      const expected = "const name         = 'John';";
      assert.strictEqual(stripTypeScript(input), expected);
    });

    it("should remove function parameter type annotations", () => {
      const input = "function greet(name: string, age: number) { return name; }";
      const expected = "function greet(name        , age        ) { return name; }";
      assert.strictEqual(stripTypeScript(input), expected);
    });

    it("should remove function return type annotations", () => {
      const input = "function getName(): string { return 'test'; }";
      const expected = "function getName()         { return 'test'; }";
      assert.strictEqual(stripTypeScript(input), expected);
    });

    it("should remove access modifiers", () => {
      const input = "public name: string; private age: number; protected id: string; readonly count: number;";
      const expected = "       name        ;         age        ;           id        ;          count        ;";
      assert.strictEqual(stripTypeScript(input), expected);
    });

    it("should remove 'as' type assertions", () => {
      const input = "const element = document.getElementById('test') as HTMLElement;";
      const expected = "const element = document.getElementById('test')             ;";
      assert.strictEqual(stripTypeScript(input), expected);
    });

    it("should remove non-null assertion operator", () => {
      const input = "obj.prop!.method();";
      const expected = "obj.prop .method();";
      assert.strictEqual(stripTypeScript(input), expected);
    });

    it("should preserve string literals with type-like syntax", () => {
      const input = 'const message = "Hello: string, as number!";';
      assert.strictEqual(stripTypeScript(input), input);
    });

    it("should preserve comments", () => {
      const input = "// This is: a comment\n/* as block: comment */\nconst x = 5;";
      assert.strictEqual(stripTypeScript(input), input);
    });

    it("should handle complex generic types", () => {
      const input = "const map: Map<string, Array<number>> = new Map();";
      const expected = "const map                             = new Map();";
      assert.strictEqual(stripTypeScript(input), expected);
    });

    it("should handle nested brackets in type annotations", () => {
      const input = "const obj: { prop: string; nested: { value: number } } = {};";
      const expected = "const obj                                              = {};";
      assert.strictEqual(stripTypeScript(input), expected);
    });

    it("should not remove colons in object literals", () => {
      const input = "const obj = { name: 'John', age: 30 };";
      assert.strictEqual(stripTypeScript(input), input);
    });

    it("should handle TypeScript files correctly with typescript flag", () => {
      const acorn = require("acorn");
      const input = "const greet = (name: string): string => `Hello ${name}`;";
      const result = parseCode(input, { ecmaVersion: 6 }, acorn, "test.ts", { typescript: true });

      assert.strictEqual(result.error, null);
      assert(result.ast);
    });

    it("should not process TypeScript files without typescript flag", () => {
      const acorn = require("acorn");
      const input = "const greet = (name: string): string => `Hello ${name}`;";
      const result = parseCode(input, { ecmaVersion: 6 }, acorn, "test.ts");

      assert(result.error);
      assert.strictEqual(result.ast, null);
    });
  });

  describe("isTypeAnnotationContext()", () => {
    it("should detect type annotation after identifier", () => {
      const chars = Array.from("name: string");
      assert.strictEqual(isTypeAnnotationContext(chars, 4), true);
    });

    it("should detect type annotation after closing paren", () => {
      const chars = Array.from("func(): string");
      assert.strictEqual(isTypeAnnotationContext(chars, 6), true);
    });

    it("should detect type annotation with whitespace before colon", () => {
      const chars = Array.from("name   : string");
      assert.strictEqual(isTypeAnnotationContext(chars, 7), true);
    });

    it("should detect type annotation after closing bracket", () => {
      const chars = Array.from("arr[0]: string");
      assert.strictEqual(isTypeAnnotationContext(chars, 6), true);
    });

    it("should not detect object property colon", () => {
      const chars = Array.from("{ prop: value }");
      assert.strictEqual(isTypeAnnotationContext(chars, 6), false);
    });

    it("should handle colon at start of string", () => {
      const chars = Array.from(": string");
      assert.strictEqual(isTypeAnnotationContext(chars, 0), false);
    });
  });

  describe("getKeywordAt()", () => {
    it("should extract keyword at position", () => {
      const chars = Array.from("public name");
      assert.strictEqual(getKeywordAt(chars, 0), "public");
    });

    it("should extract partial keyword", () => {
      const chars = Array.from("private");
      assert.strictEqual(getKeywordAt(chars, 2), "ivate");
    });

    it("should return empty for non-identifier", () => {
      const chars = Array.from("123abc");
      assert.strictEqual(getKeywordAt(chars, 0), "123abc");
    });
  });

  describe("isIdentifierChar()", () => {
    it("should identify valid identifier characters", () => {
      assert.strictEqual(isIdentifierChar('a'), true);
      assert.strictEqual(isIdentifierChar('Z'), true);
      assert.strictEqual(isIdentifierChar('_'), true);
      assert.strictEqual(isIdentifierChar('$'), true);
      assert.strictEqual(isIdentifierChar('0'), true);
    });

    it("should reject invalid identifier characters", () => {
      assert.strictEqual(isIdentifierChar(' '), false);
      assert.strictEqual(isIdentifierChar(':'), false);
      assert.strictEqual(isIdentifierChar('('), false);
    });
  });

  describe("skipTypeAnnotation()", () => {
    it("should skip simple type annotation", () => {
      const chars = Array.from("string = value");
      assert.strictEqual(skipTypeAnnotation(chars, 0), 6);
    });

    it("should handle generic types with brackets", () => {
      const chars = Array.from("Array<string> = []");
      assert.strictEqual(skipTypeAnnotation(chars, 0), 13);
    });

    it("should stop at assignment operator", () => {
      const chars = Array.from("string = 'value'");
      assert.strictEqual(skipTypeAnnotation(chars, 0), 7);
    });
  });

  describe("skipAsTypeAssertion()", () => {
    it("should skip 'as' type assertion", () => {
      const chars = Array.from("as HTMLElement;");
      const result = [];
      const endIndex = skipAsTypeAssertion(chars, 0, result);

      assert.strictEqual(endIndex, 14);
      assert.strictEqual(result.join(''), '  ');
    });

    it("should handle whitespace after 'as'", () => {
      const chars = Array.from("as   string;");
      const result = [];
      const endIndex = skipAsTypeAssertion(chars, 0, result);

      assert.strictEqual(endIndex, 11);
      assert.strictEqual(result.join(''), '     ');
    });
  });

  describe("isWhitespace()", () => {
    it("should identify whitespace characters", () => {
      assert.strictEqual(isWhitespace(' '), true);
      assert.strictEqual(isWhitespace('\t'), true);
      assert.strictEqual(isWhitespace('\n'), true);
    });

    it("should reject non-whitespace characters", () => {
      assert.strictEqual(isWhitespace('a'), false);
      assert.strictEqual(isWhitespace('1'), false);
    });
  });
});
