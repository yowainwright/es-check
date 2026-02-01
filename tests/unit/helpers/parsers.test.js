const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  parseCode,
  stripTypeScript,
  detectRuntime,
  stripTypesInNode,
  stripTypesInBun,
  stripTypesInDeno
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

    it("should remove 'as' type assertions", () => {
      const input = "const element = document.getElementById('test') as HTMLElement;";
      const expected = "const element = document.getElementById('test')               ;";
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
      const input = "// This is: a comment\\n/* as block: comment */\\nconst x = 5;";
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


    it("should handle template literals with type annotations", () => {
      const input = "const msg: string = `Hello \\${name: string}`;";
      const expected = "const msg         = `Hello \\${name: string}`;";
      assert.strictEqual(stripTypeScript(input), expected);
    });

    it("should handle escaped quotes in strings", () => {
      const input = 'const x: string = "say \\"hello: string\\"";';
      const expected = 'const x         = "say \\"hello: string\\"";';
      assert.strictEqual(stripTypeScript(input), expected);
    });

    it("should handle type annotations in arrow functions", () => {
      const input = "const fn = (x: number): number => x * 2;";
      const expected = "const fn = (x        )         => x * 2;";
      assert.strictEqual(stripTypeScript(input), expected);
    });

    it("should handle interface-like syntax in strings", () => {
      const input = 'const code = "interface User { name: string; }";';
      assert.strictEqual(stripTypeScript(input), input);
    });

    it("should handle type annotations after destructuring", () => {
      const input = "const { name, age }: { name: string; age: number } = user;";
      const expected = "const { name, age }                                = user;";
      assert.strictEqual(stripTypeScript(input), expected);
    });

    it("should handle multiple as assertions", () => {
      const input = "const x = (y as string) as unknown as number;";
      const expected = "const x = (y          )                     ;";
      assert.strictEqual(stripTypeScript(input), expected);
    });

    it("should preserve exact character positions", () => {
      const input = "const a: string = 'b';";
      const result = stripTypeScript(input);
      assert.strictEqual(result.length, input.length);
      assert.strictEqual(result[0], 'c'); // 'c' from "const"
      assert.strictEqual(result[8], ' '); // space replacing ':'
      assert.strictEqual(result[21], ';'); // final semicolon
    });
  });

  describe("detectRuntime()", () => {
    it("should detect node runtime", () => {
      const runtime = detectRuntime();
      assert.strictEqual(runtime, 'node');
    });
  });

  describe("stripTypesInNode()", () => {
    it("should strip TypeScript types using Node.js API", () => {
      const code = "const x: string = 'test';";
      const result = stripTypesInNode(code);
      assert(typeof result === 'string');
      assert(result.includes('const x'));
      assert(result.includes("'test'"));
    });

    it("should throw error for unsupported Node.js version", () => {
      const originalModule = require.cache[require.resolve('module')];
      require.cache[require.resolve('module')] = {
        exports: {}
      };

      try {
        const code = "const x: string = 'test';";
        assert.throws(() => stripTypesInNode(code), /Node\.js v22\.13\.0\+/);
      } finally {
        require.cache[require.resolve('module')] = originalModule;
      }
    });
  });

  describe("stripTypesInBun()", () => {
    it("should throw error when Bun.Transpiler is not available", () => {
      const code = "const x: string = 'test';";
      assert.throws(() => stripTypesInBun(code), /Bun v1\.0\.0\+/);
    });
  });

  describe("stripTypesInDeno()", () => {
    it("should always throw error for Deno", () => {
      assert.throws(() => stripTypesInDeno(), /not supported in Deno/);
    });
  });
});