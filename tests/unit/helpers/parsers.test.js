const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  parseCode,
  stripTypeScript,
  detectRuntime,
  stripTypesInNode,
  stripTypesInBun,
  stripTypesInDeno,
  buildLineOffsets,
  mapPosition,
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
      const result = parseCode(input, { ecmaVersion: 6 }, acorn, "test.ts", {
        typescript: true,
      });

      assert.strictEqual(result.error, null);
      assert(result.ast);
    });

    it("should handle TypeScript files correctly with ts flag", () => {
      const acorn = require("acorn");
      const input = "const greet = (name: string): string => `Hello ${name}`;";
      const result = parseCode(input, { ecmaVersion: 6 }, acorn, "test.ts", {
        ts: true,
      });

      assert.strictEqual(result.error, null);
      assert(result.ast);
    });

    it("should handle TypeScript files with .tsx extension", () => {
      const acorn = require("acorn");
      const input = "const greet = (name: string): string => `Hello ${name}`;";
      const result = parseCode(input, { ecmaVersion: 6 }, acorn, "test.tsx", {
        typescript: true,
      });

      assert.strictEqual(result.error, null);
      assert(result.ast);
    });

    it("should handle parsing errors without location info", () => {
      const acorn = require("acorn");
      const code = "var x = \n;";
      const result = parseCode(code, { ecmaVersion: 5 }, acorn, "test.js");

      assert(result.error);
      assert.strictEqual(result.ast, null);
      assert.strictEqual(result.error.file, "test.js");
      assert(result.error.err);
    });

    it("should handle parsing errors with location info", () => {
      const acorn = require("acorn");
      const code = "const x = y.;";
      const result = parseCode(code, { ecmaVersion: 6 }, acorn, "test.js");

      assert(result.error);
      assert.strictEqual(result.ast, null);
      assert.strictEqual(result.error.file, "test.js");
      assert(result.error.err);
      assert(typeof result.error.line === "number");
      assert(typeof result.error.column === "number");
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
      assert.deepStrictEqual(stripTypeScript(null), {
        code: null,
        lineOffsets: null,
      });
      assert.deepStrictEqual(stripTypeScript(undefined), {
        code: undefined,
        lineOffsets: null,
      });
      assert.deepStrictEqual(stripTypeScript(123), {
        code: 123,
        lineOffsets: null,
      });
    });

    it("should preserve plain JavaScript code", () => {
      const code = "const x = 5; function test() { return x; }";
      const result = stripTypeScript(code);
      assert.strictEqual(result.code, code);
      assert.strictEqual(result.lineOffsets, null);
    });

    it("should remove simple type annotations", () => {
      const input = "const name: string = 'John';";
      const expected = "const name         = 'John';";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, expected);
      assert.strictEqual(result.lineOffsets, null);
    });

    it("should remove function parameter type annotations", () => {
      const input =
        "function greet(name: string, age: number) { return name; }";
      const expected =
        "function greet(name        , age        ) { return name; }";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, expected);
    });

    it("should remove function return type annotations", () => {
      const input = "function getName(): string { return 'test'; }";
      const expected = "function getName()         { return 'test'; }";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, expected);
    });

    it("should remove 'as' type assertions", () => {
      const input =
        "const element = document.getElementById('test') as HTMLElement;";
      const expected =
        "const element = document.getElementById('test')               ;";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, expected);
    });

    it("should remove non-null assertion operator", () => {
      const input = "obj.prop!.method();";
      const expected = "obj.prop .method();";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, expected);
    });

    it("should preserve string literals with type-like syntax", () => {
      const input = 'const message = "Hello: string, as number!";';
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, input);
    });

    it("should preserve comments", () => {
      const input =
        "// This is: a comment\\n/* as block: comment */\\nconst x = 5;";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, input);
    });

    it("should handle complex generic types", () => {
      const input = "const map: Map<string, Array<number>> = new Map();";
      const expected = "const map                             = new Map();";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, expected);
    });

    it("should handle nested brackets in type annotations", () => {
      const input =
        "const obj: { prop: string; nested: { value: number } } = {};";
      const expected =
        "const obj                                              = {};";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, expected);
    });

    it("should not remove colons in object literals", () => {
      const input = "const obj = { name: 'John', age: 30 };";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, input);
    });

    it("should handle template literals with type annotations", () => {
      const input = "const msg: string = `Hello \\${name: string}`;";
      const expected = "const msg         = `Hello \\${name: string}`;";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, expected);
    });

    it("should handle escaped quotes in strings", () => {
      const input = 'const x: string = "say \\"hello: string\\"";';
      const expected = 'const x         = "say \\"hello: string\\"";';
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, expected);
    });

    it("should handle type annotations in arrow functions", () => {
      const input = "const fn = (x: number): number => x * 2;";
      const expected = "const fn = (x        )         => x * 2;";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, expected);
    });

    it("should handle interface-like syntax in strings", () => {
      const input = 'const code = "interface User { name: string; }";';
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, input);
    });

    it("should handle type annotations after destructuring", () => {
      const input =
        "const { name, age }: { name: string; age: number } = user;";
      const expected =
        "const { name, age }                                = user;";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, expected);
    });

    it("should handle multiple as assertions", () => {
      const input = "const x = (y as string) as unknown as number;";
      const expected = "const x = (y          )                     ;";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code, expected);
    });

    it("should preserve exact character positions", () => {
      const input = "const a: string = 'b';";
      const result = stripTypeScript(input);
      assert.strictEqual(result.code.length, input.length);
      assert.strictEqual(result.code[0], "c");
      assert.strictEqual(result.code[8], " ");
      assert.strictEqual(result.code[21], ";");
    });
  });

  describe("detectRuntime()", () => {
    it("should detect node runtime", () => {
      const runtime = detectRuntime();
      assert.strictEqual(runtime, "node");
    });

    it("should detect bun runtime when Bun is available", () => {
      global.Bun = { Transpiler: function () {} };
      const runtime = detectRuntime();
      assert.strictEqual(runtime, "bun");
      delete global.Bun;
    });

    it("should detect deno runtime when Deno is available", () => {
      global.Deno = {};
      const runtime = detectRuntime();
      assert.strictEqual(runtime, "deno");
      delete global.Deno;
    });
  });

  describe("stripTypesInNode()", () => {
    it("should strip TypeScript types using Node.js API", () => {
      const code = "const x: string = 'test';";
      const result = stripTypesInNode(code);
      assert(typeof result === "string");
      assert(result.includes("const x"));
      assert(result.includes("'test'"));
    });

    it("should throw error for unsupported Node.js version", () => {
      const originalModule = require.cache[require.resolve("module")];
      require.cache[require.resolve("module")] = {
        exports: {},
      };

      try {
        const code = "const x: string = 'test';";
        assert.throws(() => stripTypesInNode(code), /Node\.js v22\.13\.0\+/);
      } finally {
        require.cache[require.resolve("module")] = originalModule;
      }
    });
  });

  describe("stripTypeScript() - runtime integration", () => {
    it("should use stripTypesInNode for node runtime", () => {
      const code = "const x: string = 'test';";
      const result = stripTypeScript(code);
      assert(typeof result.code === "string");
      assert(result.code.includes("const x"));
      assert.strictEqual(result.lineOffsets, null);
    });

    it("should handle empty or invalid code inputs", () => {
      assert.deepStrictEqual(stripTypeScript(""), {
        code: "",
        lineOffsets: null,
      });
      assert.deepStrictEqual(stripTypeScript(null), {
        code: null,
        lineOffsets: null,
      });
      assert.deepStrictEqual(stripTypeScript(undefined), {
        code: undefined,
        lineOffsets: null,
      });
      assert.deepStrictEqual(stripTypeScript(123), {
        code: 123,
        lineOffsets: null,
      });
    });

    it("should call stripTypesInBun for bun runtime", () => {
      global.Bun = {
        Transpiler: function (options) {
          this.transformSync = function (code) {
            return code.replace(/: string/g, "");
          };
        },
      };

      try {
        const code = "const x: string = 'test';";
        const result = stripTypeScript(code);
        assert(typeof result.code === "string");
        assert(result.code.includes("const x"));
        assert(result.code.includes("'test'"));
        assert(Array.isArray(result.lineOffsets));
      } finally {
        delete global.Bun;
      }
    });

    it("should call stripTypesInDeno for deno runtime", () => {
      global.Deno = {};

      try {
        const code = "const x: string = 'test';";
        assert.throws(() => stripTypeScript(code), /not supported in Deno/);
      } finally {
        delete global.Deno;
      }
    });

    it("should handle stripTypesInDeno directly", () => {
      const { stripTypesInDeno } = require("../../../lib/helpers/parsers.js");
      assert.throws(() => stripTypesInDeno(), /not supported in Deno/);
    });
  });

  describe("stripTypesInBun()", () => {
    it("should throw error when Bun.Transpiler is not available", () => {
      const code = "const x: string = 'test';";
      assert.throws(() => stripTypesInBun(code), /Bun v1\.0\.0\+/);
    });

    it("should return code and lineOffsets when Bun.Transpiler is available", () => {
      global.Bun = {
        Transpiler: function (options) {
          this.transformSync = function (code) {
            return code.replace(/: string/g, "");
          };
        },
      };

      const code = "const x: string = 'test';";
      const result = stripTypesInBun(code);
      assert(typeof result.code === "string");
      assert(result.code.includes("const x"));
      assert(result.code.includes("'test'"));
      assert(Array.isArray(result.lineOffsets));
      assert.strictEqual(result.lineOffsets[0], 8);

      delete global.Bun;
    });

    it("should throw error when Bun is undefined but trying to strip types", () => {
      delete global.Bun;
      const code = "const x: string = 'test';";
      assert.throws(() => stripTypesInBun(code), /Bun v1\.0\.0\+/);
    });

    it("should throw error when Bun exists but Transpiler is undefined", () => {
      global.Bun = {};
      const code = "const x: string = 'test';";

      try {
        assert.throws(() => stripTypesInBun(code), /Bun v1\.0\.0\+/);
      } finally {
        delete global.Bun;
      }
    });
  });

  describe("stripTypesInDeno()", () => {
    it("should always throw error for Deno", () => {
      assert.throws(() => stripTypesInDeno(), /not supported in Deno/);
    });
  });

  describe("buildLineOffsets()", () => {
    it("should return zero offsets for identical strings", () => {
      const code = "const x = 5;";
      const offsets = buildLineOffsets(code, code);
      assert.deepStrictEqual(offsets, [0]);
    });

    it("should compute per-line offset when types are removed", () => {
      const original = "const x: string = 5;\nconst y: number = 10;";
      const stripped = "const x = 5;\nconst y = 10;";
      const offsets = buildLineOffsets(original, stripped);
      assert.strictEqual(offsets[0], 8);
      assert.strictEqual(offsets[1], 8);
    });

    it("should handle multiline with varying offsets", () => {
      const original = "import type { Foo } from 'bar';\nconst x = 5;";
      const stripped = "\nconst x = 5;";
      const offsets = buildLineOffsets(original, stripped);
      assert.strictEqual(offsets[0], 31);
      assert.strictEqual(offsets[1], 0);
    });
  });

  describe("mapPosition()", () => {
    it("should return original position when no offsets", () => {
      const result = mapPosition(1, 10, null);
      assert.deepStrictEqual(result, { line: 1, column: 10 });
    });

    it("should return original position when offsets are empty", () => {
      const result = mapPosition(1, 10, []);
      assert.deepStrictEqual(result, { line: 1, column: 10 });
    });

    it("should adjust column by line offset", () => {
      const offsets = [8, 0, 5];
      const result = mapPosition(1, 10, offsets);
      assert.deepStrictEqual(result, { line: 1, column: 18 });
    });

    it("should not adjust line number", () => {
      const offsets = [0, 8];
      const result = mapPosition(2, 5, offsets);
      assert.deepStrictEqual(result, { line: 2, column: 13 });
    });

    it("should handle out of bounds line gracefully", () => {
      const offsets = [8];
      const result = mapPosition(5, 10, offsets);
      assert.deepStrictEqual(result, { line: 5, column: 10 });
    });
  });

  describe("parseCode() with Bun line offset mapping", () => {
    it("should map error positions back to original TS source in Bun", () => {
      global.Bun = {
        Transpiler: function (options) {
          this.transformSync = function (code) {
            return code.replace(/: string/g, "").replace(/: number/g, "");
          };
        },
      };

      try {
        const acorn = require("acorn");
        const input = "const x: string = y.;";
        const result = parseCode(input, { ecmaVersion: 6 }, acorn, "test.ts", {
          typescript: true,
        });

        assert(result.error);
        assert.strictEqual(result.error.line, 1);
        const strippedCol = "const x = y.".length;
        const originalCol = strippedCol + 8;
        assert.strictEqual(result.error.column, originalCol);
      } finally {
        delete global.Bun;
      }
    });
  });
});
