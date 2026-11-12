const { describe, it } = require("node:test");
const assert = require("node:assert");
const acorn = require("acorn");
const { buildFeatureIndex, detectFeaturesFromAST } = require("../../../../lib/core/ast");

const parse = (code) => acorn.parse(code, { ecmaVersion: 2025, sourceType: "module" });

describe("ES2025 syntax detection", () => {
  const cases = [
    ['import data from "x" with {type: "json"};', true, false, false],
    ['import "x" with {};', true, false, false],
    ['export {default} from "x" with {type: "json"};', true, false, false],
    ['export * from "x" with {};', true, false, false],
    ['import("x", {with: {type: "json"}});', true, true, false],
    ['import("x", {"with": {type: "json"}});', true, true, false],
    ['import("x", {["with"]: {type: "json"}});', true, true, false],
    ['import("x", options);', false, true, false],
    ['import("x", {});', false, true, false],
    ['import("x", {assert: {type: "json"}});', false, true, false],
    ['import("x" /* comment */, /* comment */);', false, true, false],
    ['import((("x")), /* comment */);', false, true, false],
    ['import((("x")));', false, false, false],
    ['import data from "x"; const options = {with: {type: "json"}};', false, false, false],
    ['import("x" /* with {type: "json"} */);', false, false, false],
    ['import data from "x" /* with {} */;', false, false, false],
    ["export const value = 1;", false, false, false],
    ["/(?i:pattern)/;", false, false, true],
    ["/(?im-s:pattern)/;", false, false, true],
    ["/(?-i:pattern)/i;", false, false, true],
    [String.raw`/\\(?s:.)/;`, false, false, true],
    [String.raw`/\(\?i:pattern\)/;`, false, false, false],
    ["/[(?i:pattern)]/;", false, false, false],
    ["/(?<name>pattern)(?:more)(?=end)/;", false, false, false],
    ['"(?i:pattern)";', false, false, false],
    ['new RegExp("(?i:pattern)");', false, false, false],
  ];

  cases.forEach(([code, attributes, options, modifiers]) => {
    it(`classifies ${code}`, () => {
      const found = detectFeaturesFromAST(parse(code), code);
      assert.strictEqual(found.ImportAttributes, attributes);
      assert.strictEqual(found.ImportOptions, options);
      assert.strictEqual(found.RegExpModifiers, modifiers);
    });
  });

  it("indexes a feature across multiple node types", () => {
    const nodeTypes = ["ImportDeclaration", "ImportExpression"];
    const index = buildFeatureIndex({ Test: { astInfo: { nodeType: nodeTypes } } });
    assert.strictEqual(index.ImportDeclaration[0].name, "Test");
    assert.strictEqual(index.ImportExpression[0].name, "Test");
  });

  it("traverses dynamic import options for nested features", () => {
    const code = 'import("x", {with: {type: Array.fromAsync([])}});';
    const found = detectFeaturesFromAST(parse(code), code);
    assert.strictEqual(found.ArrayFromAsync, true);
  });

  it("does not treat import attribute keys as global references", () => {
    const code = 'import data from "x" with {Promise: "custom"};';
    const found = detectFeaturesFromAST(parse(code), code);
    assert.strictEqual(found.ImportAttributes, true);
    assert.strictEqual(found.Promise, false);
  });
});
