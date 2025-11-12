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
};

module.exports = { ES15_FEATURES };
