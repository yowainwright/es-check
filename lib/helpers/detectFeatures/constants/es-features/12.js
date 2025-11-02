const ES12_FEATURES = {
  LogicalAssignment: {
    minVersion: 12,
    example: "x &&= y;",
    astInfo: {
      nodeType: "AssignmentExpression",
      operators: ["&&=", "||=", "??="],
    },
  },
  NumericSeparators: {
    minVersion: 12,
    example: "1_000_000",
    astInfo: {
      nodeType: "NumericLiteralWithSeparator",
    },
  },
  StringReplaceAll: {
    minVersion: 12,
    example: 'str.replaceAll("a", "b")',
    astInfo: {
      nodeType: "CallExpression",
      property: "replaceAll",
    },
  },
  PromiseAny: {
    minVersion: 12,
    example: "Promise.any(promises)",
    astInfo: {
      nodeType: "CallExpression",
      property: "any",
    },
  },
  WeakRef: {
    minVersion: 12,
    example: "new WeakRef(obj)",
    astInfo: {
      nodeType: "NewExpression",
      callee: "WeakRef",
    },
  },
  FinalizationRegistry: {
    minVersion: 12,
    example: "new FinalizationRegistry(cb)",
    astInfo: {
      nodeType: "NewExpression",
      callee: "FinalizationRegistry",
    },
  },
};

module.exports = { ES12_FEATURES };
