const ES8_FEATURES = {
  AsyncAwait: {
    minVersion: 8,
    example: "async function foo() { await bar(); }",
    astInfo: {
      nodeType: "AwaitExpression",
    },
  },
  ObjectValues: {
    minVersion: 8,
    example: "Object.values(obj)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Object",
      property: "values",
    },
  },
  ObjectEntries: {
    minVersion: 8,
    example: "Object.entries(obj)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Object",
      property: "entries",
    },
  },
  StringPadStart: {
    minVersion: 8,
    example: "str.padStart(10)",
    astInfo: {
      nodeType: "CallExpression",
      property: "padStart",
    },
  },
  StringPadEnd: {
    minVersion: 8,
    example: "str.padEnd(10)",
    astInfo: {
      nodeType: "CallExpression",
      property: "padEnd",
    },
  },
};

module.exports = { ES8_FEATURES };
