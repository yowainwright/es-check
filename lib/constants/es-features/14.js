const ES14_FEATURES = {
  Hashbang: {
    minVersion: 14,
    example: "#!/usr/bin/env node",
    astInfo: {
      nodeType: "Hashbang",
    },
  },
  ArrayToReversed: {
    minVersion: 14,
    example: "arr.toReversed()",
    astInfo: {
      nodeType: "CallExpression",
      property: "toReversed",
    },
  },
  ArrayToSorted: {
    minVersion: 14,
    example: "arr.toSorted(compareFn)",
    astInfo: {
      nodeType: "CallExpression",
      property: "toSorted",
    },
  },
  ArrayToSpliced: {
    minVersion: 14,
    example: "arr.toSpliced(start, deleteCount, ...)",
    astInfo: {
      nodeType: "CallExpression",
      property: "toSpliced",
    },
  },
  ArrayWith: {
    minVersion: 14,
    example: "arr.with(index, value)",
    astInfo: {
      nodeType: "CallExpression",
      property: "with",
    },
  },
  ArrayFindLast: {
    minVersion: 14,
    example: "arr.findLast(x => x > 5)",
    astInfo: {
      nodeType: "CallExpression",
      property: "findLast",
    },
  },
  ArrayFindLastIndex: {
    minVersion: 14,
    example: "arr.findLastIndex(x => x > 5)",
    astInfo: {
      nodeType: "CallExpression",
      property: "findLastIndex",
    },
  },
};

module.exports = { ES14_FEATURES };
