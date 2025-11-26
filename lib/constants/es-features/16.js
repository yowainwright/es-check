const ES16_FEATURES = {
  ArrayPrototypeGroup: {
    minVersion: 16,
    superseded: true,
    supersededBy: "ObjectGroupBy",
    example: "arr.group(x => x.category)",
    astInfo: {
      nodeType: "CallExpression",
      property: "group",
      excludeObjects: ["console"],
    },
  },
  ArrayPrototypeGroupToMap: {
    minVersion: 16,
    superseded: true,
    supersededBy: "MapGroupBy",
    example: "arr.groupToMap(x => x.category)",
    astInfo: {
      nodeType: "CallExpression",
      property: "groupToMap",
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
  SetUnion: {
    minVersion: 16,
    example: "set1.union(set2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "union",
    },
  },
  SetIntersection: {
    minVersion: 16,
    example: "set1.intersection(set2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "intersection",
    },
  },
  SetDifference: {
    minVersion: 16,
    example: "set1.difference(set2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "difference",
    },
  },
  SetSymmetricDifference: {
    minVersion: 16,
    example: "set1.symmetricDifference(set2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "symmetricDifference",
    },
  },
  SetIsSubsetOf: {
    minVersion: 16,
    example: "set1.isSubsetOf(set2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "isSubsetOf",
    },
  },
  SetIsSupersetOf: {
    minVersion: 16,
    example: "set1.isSupersetOf(set2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "isSupersetOf",
    },
  },
  SetIsDisjointFrom: {
    minVersion: 16,
    example: "set1.isDisjointFrom(set2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "isDisjointFrom",
    },
  },
  Float16Array: {
    minVersion: 16,
    example: "new Float16Array()",
    astInfo: {
      nodeType: "NewExpression",
      callee: "Float16Array",
    },
  },
  RegExpEscape: {
    minVersion: 16,
    example: "RegExp.escape(str)",
    astInfo: {
      nodeType: "CallExpression",
      object: "RegExp",
      property: "escape",
    },
  },
};

module.exports = { ES16_FEATURES };
