const ES11_FEATURES = {
  BigInt: {
    minVersion: 11,
    example: "123n",
    astInfo: {
      nodeType: "BigIntLiteral",
    },
  },
  DynamicImport: {
    minVersion: 11,
    example: 'import("module.js")',
    astInfo: {
      nodeType: "ImportExpression",
    },
  },
  OptionalChaining: {
    minVersion: 11,
    example: "obj?.prop",
    astInfo: {
      nodeType: "ChainExpression",
    },
  },
  NullishCoalescing: {
    minVersion: 11,
    example: "a ?? b",
    astInfo: {
      nodeType: "LogicalExpression",
      operator: "??",
    },
  },
  globalThis: {
    minVersion: 11,
    example: "globalThis",
    astInfo: {
      nodeType: "Identifier",
      name: "globalThis",
    },
  },
  PromiseAllSettled: {
    minVersion: 11,
    example: "Promise.allSettled(promises)",
    astInfo: {
      nodeType: "CallExpression",
      property: "allSettled",
    },
  },
  StringMatchAll: {
    minVersion: 11,
    example: "str.matchAll(regex)",
    astInfo: {
      nodeType: "CallExpression",
      property: "matchAll",
    },
  },
};

module.exports = { ES11_FEATURES };
