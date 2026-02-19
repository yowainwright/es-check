const { describe, it } = require("node:test");
const assert = require("node:assert");
const acorn = require("acorn");
const {
  normalizeNodeType,
  buildFeatureIndex,
  matchesFeature,
  detectFeaturesFromAST,
} = require("../../../lib/helpers/astDetector.js");

const parse = (code) =>
  acorn.parse(code, { ecmaVersion: 2025, sourceType: "module" });

describe("helpers/astDetector.js", () => {
  describe("normalizeNodeType()", () => {
    it("should expand ExportDeclaration to all export types", () => {
      const result = normalizeNodeType("ExportDeclaration");
      assert.deepStrictEqual(result, [
        "ExportNamedDeclaration",
        "ExportDefaultDeclaration",
        "ExportAllDeclaration",
      ]);
    });

    it("should expand BigIntLiteral to Literal", () => {
      const result = normalizeNodeType("BigIntLiteral");
      assert.deepStrictEqual(result, ["Literal"]);
    });

    it("should return single-element array for regular types", () => {
      const result = normalizeNodeType("CallExpression");
      assert.deepStrictEqual(result, ["CallExpression"]);
    });
  });

  describe("buildFeatureIndex()", () => {
    it("should index features by node type", () => {
      const features = {
        TestFeature: {
          astInfo: { nodeType: "CallExpression", property: "test" },
        },
      };
      const index = buildFeatureIndex(features);
      assert.strictEqual(index.CallExpression.length, 1);
      assert.strictEqual(index.CallExpression[0].name, "TestFeature");
    });

    it("should skip features without astInfo", () => {
      const features = {
        NoAstInfo: { minVersion: 6 },
      };
      const index = buildFeatureIndex(features);
      assert.deepStrictEqual(index, {});
    });

    it("should expand ExportDeclaration to multiple keys", () => {
      const features = {
        Export: {
          astInfo: { nodeType: "ExportDeclaration" },
        },
      };
      const index = buildFeatureIndex(features);
      assert.ok(index.ExportNamedDeclaration);
      assert.ok(index.ExportDefaultDeclaration);
      assert.ok(index.ExportAllDeclaration);
    });
  });

  describe("matchesFeature()", () => {
    it("should match childType in array elements", () => {
      const node = {
        type: "ArrayExpression",
        elements: [{ type: "SpreadElement" }],
      };
      const astInfo = {
        nodeType: "ArrayExpression",
        childType: "SpreadElement",
      };
      assert.strictEqual(matchesFeature(node, astInfo), true);
    });

    it("should not match when childType is missing", () => {
      const node = {
        type: "ArrayExpression",
        elements: [{ type: "Literal" }],
      };
      const astInfo = {
        nodeType: "ArrayExpression",
        childType: "SpreadElement",
      };
      assert.strictEqual(matchesFeature(node, astInfo), false);
    });

    it("should match Identifier by name", () => {
      const node = { type: "Identifier", name: "globalThis" };
      const astInfo = { nodeType: "Identifier", name: "globalThis" };
      assert.strictEqual(matchesFeature(node, astInfo), true);
    });

    it("should match BigIntLiteral", () => {
      const node = { type: "Literal", bigint: "123" };
      const astInfo = { nodeType: "BigIntLiteral" };
      assert.strictEqual(matchesFeature(node, astInfo), true);
    });

    it("should match VariableDeclaration kind", () => {
      const node = { type: "VariableDeclaration", kind: "const" };
      const astInfo = { nodeType: "VariableDeclaration", kind: "const" };
      assert.strictEqual(matchesFeature(node, astInfo), true);
    });

    it("should not match wrong kind", () => {
      const node = { type: "VariableDeclaration", kind: "let" };
      const astInfo = { nodeType: "VariableDeclaration", kind: "const" };
      assert.strictEqual(matchesFeature(node, astInfo), false);
    });

    it("should match operator", () => {
      const node = { type: "BinaryExpression", operator: "**" };
      const astInfo = { nodeType: "BinaryExpression", operator: "**" };
      assert.strictEqual(matchesFeature(node, astInfo), true);
    });

    it("should match operators array", () => {
      const node = { type: "AssignmentExpression", operator: "&&=" };
      const astInfo = {
        nodeType: "AssignmentExpression",
        operators: ["&&=", "||=", "??="],
      };
      assert.strictEqual(matchesFeature(node, astInfo), true);
    });

    it("should not match when operator not in operators array", () => {
      const node = { type: "AssignmentExpression", operator: "=" };
      const astInfo = {
        nodeType: "AssignmentExpression",
        operators: ["&&=", "||=", "??="],
      };
      assert.strictEqual(matchesFeature(node, astInfo), false);
    });

    it("should match superClass presence", () => {
      const node = {
        type: "ClassDeclaration",
        superClass: { type: "Identifier" },
      };
      const astInfo = { nodeType: "ClassDeclaration", property: "superClass" };
      assert.strictEqual(matchesFeature(node, astInfo), true);
    });

    it("should not match when superClass is null", () => {
      const node = { type: "ClassDeclaration", superClass: null };
      const astInfo = { nodeType: "ClassDeclaration", property: "superClass" };
      assert.strictEqual(matchesFeature(node, astInfo), false);
    });
  });

  describe("detectFeaturesFromAST()", () => {
    it("should detect arrow functions", () => {
      const ast = parse("const fn = () => {}");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ArrowFunctions, true);
      assert.strictEqual(result.const, true);
    });

    it("should detect const and let", () => {
      const ast = parse("const a = 1; let b = 2;");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.const, true);
      assert.strictEqual(result.let, true);
    });

    it("should detect template literals", () => {
      const ast = parse("const str = `hello ${name}`");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.TemplateLiterals, true);
    });

    it("should detect classes", () => {
      const ast = parse("class Foo {}");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.class, true);
    });

    it("should detect class extends", () => {
      const ast = parse("class Foo extends Bar {}");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.extends, true);
    });

    it("should detect destructuring", () => {
      const ast = parse("const { a } = obj");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.Destructuring, true);
    });

    it("should detect spread in arrays", () => {
      const ast = parse("const arr = [...other]");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ArraySpread, true);
    });

    it("should detect exponentiation operator", () => {
      const ast = parse("const x = 2 ** 3");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ExponentOperator, true);
    });

    it("should detect optional chaining", () => {
      const ast = parse("const x = obj?.prop");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.OptionalChaining, true);
    });

    it("should detect nullish coalescing", () => {
      const ast = parse("const x = a ?? b");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.NullishCoalescing, true);
    });

    it("should detect Promise.resolve", () => {
      const ast = parse("Promise.resolve(1)");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.PromiseResolve, true);
    });

    it("should detect new Map()", () => {
      const ast = parse("new Map()");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.Map, true);
    });

    it("should detect globalThis", () => {
      const ast = parse("globalThis.foo");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.globalThis, true);
    });

    it("should detect ArrayPrototypeGroup", () => {
      const ast = parse("items.group(x => x.type)");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ArrayPrototypeGroup, true);
    });

    it("should detect ArrayPrototypeGroupToMap", () => {
      const ast = parse("items.groupToMap(x => x.type)");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ArrayPrototypeGroupToMap, true);
    });

    it("should not detect ArrayPrototypeGroup for console.group", () => {
      const ast = parse("console.group('test')");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ArrayPrototypeGroup, false);
    });

    it("should detect Object.groupBy", () => {
      const ast = parse("Object.groupBy(arr, fn)");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ObjectGroupBy, true);
    });

    it("should detect Map.groupBy", () => {
      const ast = parse("Map.groupBy(arr, fn)");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.MapGroupBy, true);
    });

    it("should detect import statements", () => {
      const ast = parse("import foo from 'bar'");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.import, true);
    });

    it("should detect export statements", () => {
      const ast = parse("export const x = 1");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.export, true);
    });

    it("should detect for-of loops", () => {
      const ast = parse("for (const x of arr) {}");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ForOf, true);
    });

    it("should detect default parameters", () => {
      const ast = parse("function foo(x = 1) {}");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.DefaultParams, true);
    });

    it("should detect rest parameters", () => {
      const ast = parse("function foo(...args) {}");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.RestSpread, true);
    });

    it("should detect LogicalAssignment with &&=", () => {
      const ast = parse("let x = 1; x &&= 2;");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.LogicalAssignment, true);
    });

    it("should detect LogicalAssignment with ||=", () => {
      const ast = parse("let x = 1; x ||= 2;");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.LogicalAssignment, true);
    });

    it("should detect LogicalAssignment with ??=", () => {
      const ast = parse("let x = null; x ??= 2;");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.LogicalAssignment, true);
    });

    it("should not detect LogicalAssignment for regular assignment", () => {
      const ast = parse("let x = 1; x = 2;");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.LogicalAssignment, false);
    });

    it("should not detect LogicalAssignment for compound assignment", () => {
      const ast = parse("let x = 1; x += 2;");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.LogicalAssignment, false);
    });

    it("should not detect TopLevelAwait for await inside async function", () => {
      const ast = parse("export async function a() { await Promise.all(); }");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.TopLevelAwait, false);
    });

    it("should detect TopLevelAwait for await at module level", () => {
      const ast = parse("const data = await fetch('url');");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.TopLevelAwait, true);
    });

    it("should not detect ErgonomicBrandChecks for regular 'in' operator", () => {
      const ast = parse("const b = {}; if ('c' in b) {}");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ErgonomicBrandChecks, false);
    });

    it("should detect ErgonomicBrandChecks for private field 'in' check", () => {
      const ast = parse(
        "class Foo { #field; check(obj) { return #field in obj; } }",
      );
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ErgonomicBrandChecks, true);
    });

    it("should not detect ErrorCause for basic Error constructor", () => {
      const ast = parse("throw new Error('message');");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ErrorCause, false);
    });

    it("should detect ErrorCause for Error with cause option", () => {
      const ast = parse("throw new Error('message', { cause: err });");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ErrorCause, true);
    });

    it("should not detect RegExpEscape for direct RegExp constructor call", () => {
      const ast = parse("const re = RegExp(str, 'g');");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.RegExpEscape, false);
    });

    it("should detect RegExpEscape for RegExp.escape call", () => {
      const ast = parse("const escaped = RegExp.escape(str);");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.RegExpEscape, true);
    });

    it("should detect features in comma-separated expressions (#388)", () => {
      const ast = parse("42,[].toReversed()");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ArrayToReversed, true);
    });

    it("should not detect ArrayPrototypeAt for object literal .at() call (#387)", () => {
      const ast = parse("({ at() {} }).at()");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ArrayPrototypeAt, false);
    });

    it("should detect ArrayPrototypeAt for array .at() call", () => {
      const ast = parse("[1,2,3].at(-1)");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ArrayPrototypeAt, true);
    });

    it("should detect ArrayPrototypeAt for identifier .at() call", () => {
      const ast = parse("const arr = [1]; arr.at(0);");
      const result = detectFeaturesFromAST(ast);
      assert.strictEqual(result.ArrayPrototypeAt, true);
    });
  });
});
