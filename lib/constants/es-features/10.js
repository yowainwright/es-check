const ES10_FEATURES = {
  ArrayFlat: {
    minVersion: 10,
    example: "arr.flat()",
    astInfo: {
      nodeType: "CallExpression",
      property: "flat",
    },
  },
  ArrayFlatMap: {
    minVersion: 10,
    example: "arr.flatMap(x => x)",
    astInfo: {
      nodeType: "CallExpression",
      property: "flatMap",
    },
  },
  ObjectFromEntries: {
    minVersion: 10,
    example: "Object.fromEntries(entries)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Object",
      property: "fromEntries",
    },
  },
  OptionalCatchBinding: {
    minVersion: 10,
    example: "try { ... } catch { ... }",
    astInfo: {
      nodeType: "CatchClause",
      noParam: true,
    },
  },
};

module.exports = { ES10_FEATURES };
