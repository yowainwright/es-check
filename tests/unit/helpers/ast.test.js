const { describe, it } = require("node:test");
const assert = require("node:assert");
const { checkMap } = require("../../../lib/helpers/ast.js");

describe("helpers/ast.js", () => {
  describe("checkMap()", () => {
    it("should check kind constraint", () => {
      const node = { kind: "const" };
      const astInfo = { kind: "const" };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should fail when kind does not match", () => {
      const node = { kind: "let" };
      const astInfo = { kind: "const" };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    it("should check operator constraint", () => {
      const node = { operator: "===" };
      const astInfo = { operator: "===" };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should fail when operator does not match", () => {
      const node = { operator: "==" };
      const astInfo = { operator: "===" };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    it("should check callee constraint", () => {
      const node = { callee: { name: "require" } };
      const astInfo = { callee: "require" };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should fail when callee does not match", () => {
      const node = { callee: { name: "import" } };
      const astInfo = { callee: "require" };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    it("should check object constraint", () => {
      const node = {
        callee: {
          object: { name: "Array" },
        },
      };
      const astInfo = { object: "Array" };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should check object and property constraints", () => {
      const node = {
        callee: {
          object: { name: "Array" },
          property: { name: "from" },
        },
      };
      const astInfo = { object: "Array", property: "from" };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should fail when property does not match", () => {
      const node = {
        callee: {
          object: { name: "Array" },
          property: { name: "map" },
        },
      };
      const astInfo = { object: "Array", property: "from" };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    it("should handle Identifier type callee with object constraint", () => {
      const node = {
        callee: {
          type: "Identifier",
          name: "Array",
        },
      };
      const astInfo = { object: "Array" };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should check property without object", () => {
      const node = {
        callee: {
          property: { name: "includes" },
        },
      };
      const astInfo = { property: "includes" };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should exclude objects when specified", () => {
      const node = {
        callee: {
          object: { name: "String" },
          property: { name: "includes" },
        },
      };
      const astInfo = {
        property: "includes",
        excludeObjects: ["String"],
      };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    it("should pass when object is not in exclude list", () => {
      const node = {
        callee: {
          object: { name: "Array" },
          property: { name: "includes" },
        },
      };
      const astInfo = {
        property: "includes",
        excludeObjects: ["String"],
      };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should handle multiple constraints", () => {
      const node = {
        kind: "const",
        operator: "===",
        callee: { name: "require" },
      };
      const astInfo = {
        kind: "const",
        operator: "===",
        callee: "require",
      };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should require array-like call for ArrayPrototypeAt", () => {
      const node = {
        callee: {
          object: { type: "ArrayExpression" },
          property: { name: "at" },
        },
        arguments: [{ type: "Literal", value: -1 }],
      };
      const astInfo = {
        property: "at",
        requireNumericArg: true,
        requireArrayLikeCall: true,
      };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should reject custom object at() calls", () => {
      const node = {
        callee: {
          object: { type: "Identifier", name: "foo" },
          property: { name: "at" },
        },
        arguments: [{ type: "Literal", value: -1 }],
      };
      const astInfo = {
        property: "at",
        requireNumericArg: true,
        requireArrayLikeCall: true,
      };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    it("should accept array-like variable names", () => {
      const node = {
        callee: {
          object: { type: "Identifier", name: "arr" },
          property: { name: "at" },
        },
        arguments: [{ type: "Literal", value: -1 }],
      };
      const astInfo = {
        property: "at",
        requireNumericArg: true,
        requireArrayLikeCall: true,
      };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should accept arguments object", () => {
      const node = {
        callee: {
          object: { type: "Identifier", name: "arguments" },
          property: { name: "at" },
        },
        arguments: [{ type: "Literal", value: 0 }],
      };
      const astInfo = {
        property: "at",
        requireNumericArg: true,
        requireArrayLikeCall: true,
      };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    // ── Set-like call detection ──

    it("should detect new Set().union() as Set method", () => {
      const node = {
        callee: {
          object: {
            type: "NewExpression",
            callee: { name: "Set" },
          },
          property: { name: "union" },
        },
      };
      const astInfo = { property: "union", requireSetLikeCall: true };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should detect set-like variable names as Set method", () => {
      const node = {
        callee: {
          object: { type: "Identifier", name: "set1" },
          property: { name: "union" },
        },
      };
      const astInfo = { property: "union", requireSetLikeCall: true };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should reject non-Set .union() calls (e.g. Zod z.union())", () => {
      const node = {
        callee: {
          object: { type: "Identifier", name: "z" },
          property: { name: "union" },
        },
      };
      const astInfo = { property: "union", requireSetLikeCall: true };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    it("should reject non-Set .intersection() calls", () => {
      const node = {
        callee: {
          object: { type: "Identifier", name: "schema" },
          property: { name: "intersection" },
        },
      };
      const astInfo = { property: "intersection", requireSetLikeCall: true };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    it("should reject common non-Set object names for Set methods", () => {
      const nonSetNames = ["obj", "data", "builder", "query", "ctx"];
      const astInfo = { property: "union", requireSetLikeCall: true };

      for (const name of nonSetNames) {
        const node = {
          callee: {
            object: { type: "Identifier", name },
            property: { name: "union" },
          },
        };
        const result = checkMap(node, astInfo);
        assert.strictEqual(
          result,
          false,
          `Expected false for "${name}.union()"`,
        );
      }
    });

    it("should reject .union() without callee object", () => {
      const node = {
        callee: {
          property: { name: "union" },
        },
      };
      const astInfo = { property: "union", requireSetLikeCall: true };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    // ── PromiseAny with object constraint ──

    it("should detect Promise.any() with object constraint", () => {
      const node = {
        callee: {
          object: { name: "Promise" },
          property: { name: "any" },
        },
      };
      const astInfo = { object: "Promise", property: "any" };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it("should reject non-Promise .any() calls with object constraint", () => {
      const node = {
        callee: {
          object: { name: "z" },
          property: { name: "any" },
        },
      };
      const astInfo = { object: "Promise", property: "any" };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });
  });
});
