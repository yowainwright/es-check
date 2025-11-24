const ES7_FEATURES = {
  ExponentOperator: {
    minVersion: 7,
    example: "a ** b",
    astInfo: {
      nodeType: "BinaryExpression",
      operator: "**",
    },
  },
  ArrayPrototypeIncludes: {
    minVersion: 7,
    example: "arr.includes(x)",
    astInfo: {
      nodeType: "CallExpression",
      property: "includes",
    },
  },
};

module.exports = { ES7_FEATURES };
