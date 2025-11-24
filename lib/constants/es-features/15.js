const ES15_FEATURES = {
  StringIsWellFormed: {
    minVersion: 15,
    example: "str.isWellFormed()",
    astInfo: {
      nodeType: "CallExpression",
      property: "isWellFormed",
    },
  },
  StringToWellFormed: {
    minVersion: 15,
    example: "str.toWellFormed()",
    astInfo: {
      nodeType: "CallExpression",
      property: "toWellFormed",
    },
  },
  RegExpUnicodeSetFlag: {
    minVersion: 15,
    example: "/pattern/v",
    astInfo: {
      nodeType: "RegExpLiteral",
      flags: "v",
    },
  },
  PromiseWithResolvers: {
    minVersion: 15,
    example: "Promise.withResolvers()",
    astInfo: {
      nodeType: "CallExpression",
      object: "Promise",
      property: "withResolvers",
    },
  },
  ObjectGroupBy: {
    minVersion: 15,
    example: "Object.groupBy(array, fn)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Object",
      property: "groupBy",
    },
  },
  MapGroupBy: {
    minVersion: 15,
    example: "Map.groupBy(array, fn)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Map",
      property: "groupBy",
    },
  },
  AtomicsWaitAsync: {
    minVersion: 15,
    example: "Atomics.waitAsync(typedArray, index, value)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Atomics",
      property: "waitAsync",
    },
  },
};

module.exports = { ES15_FEATURES };
