const ES16_FEATURES = {
  ArrayGroup: {
    minVersion: 16,
    example: "arr.group(x => x.category)",
    astInfo: {
      nodeType: "CallExpression",
      property: "group",
      excludeObjects: ["console"],
    },
  },
  ArrayGroupToMap: {
    minVersion: 16,
    example: "arr.groupToMap(x => x.category)",
    astInfo: {
      nodeType: "CallExpression",
      property: "groupToMap",
      excludeObjects: ["console"],
    },
  },
  PromiseTry: {
    minVersion: 16,
    example: "Promise.try(() => syncOrAsyncFunction())",
    astInfo: {
      nodeType: "CallExpression",
      object: "Promise",
      property: "try",
    },
  },
  DuplicateNamedCaptureGroups: {
    minVersion: 16,
    example: "/(?<name>a)|(?<name>b)/",
    astInfo: {
      nodeType: "RegExpLiteral",
      duplicateNamedGroups: true,
    },
  },
};

module.exports = { ES16_FEATURES };
