const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  normalizeNodeType,
  buildFeatureIndex,
  matchesFeature,
} = require("../../../../../lib/core/ast/detector/utils");

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
