const ES16_FEATURES = {
  IteratorFrom: {
    minVersion: 16,
    example: "Iterator.from(values)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Iterator",
      property: "from",
    },
  },
  IteratorMap: {
    minVersion: 16,
    example: "iterator.map(callback)",
    astInfo: {
      nodeType: "CallExpression",
      property: "map",
      requireIteratorReceiver: true,
    },
  },
  IteratorFilter: {
    minVersion: 16,
    example: "iterator.filter(callback)",
    astInfo: {
      nodeType: "CallExpression",
      property: "filter",
      requireIteratorReceiver: true,
    },
  },
  IteratorTake: {
    minVersion: 16,
    example: "iterator.take(2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "take",
      requireIteratorReceiver: true,
    },
  },
  IteratorDrop: {
    minVersion: 16,
    example: "iterator.drop(2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "drop",
      requireIteratorReceiver: true,
    },
  },
  IteratorFlatMap: {
    minVersion: 16,
    example: "iterator.flatMap(callback)",
    astInfo: {
      nodeType: "CallExpression",
      property: "flatMap",
      requireIteratorReceiver: true,
    },
  },
  IteratorReduce: {
    minVersion: 16,
    example: "iterator.reduce(callback)",
    astInfo: {
      nodeType: "CallExpression",
      property: "reduce",
      requireIteratorReceiver: true,
    },
  },
  IteratorToArray: {
    minVersion: 16,
    example: "iterator.toArray()",
    astInfo: {
      nodeType: "CallExpression",
      property: "toArray",
      requireIteratorReceiver: true,
    },
  },
  IteratorForEach: {
    minVersion: 16,
    example: "iterator.forEach(callback)",
    astInfo: {
      nodeType: "CallExpression",
      property: "forEach",
      requireIteratorReceiver: true,
    },
  },
  IteratorSome: {
    minVersion: 16,
    example: "iterator.some(callback)",
    astInfo: {
      nodeType: "CallExpression",
      property: "some",
      requireIteratorReceiver: true,
    },
  },
  IteratorEvery: {
    minVersion: 16,
    example: "iterator.every(callback)",
    astInfo: {
      nodeType: "CallExpression",
      property: "every",
      requireIteratorReceiver: true,
    },
  },
  IteratorFind: {
    minVersion: 16,
    example: "iterator.find(callback)",
    astInfo: {
      nodeType: "CallExpression",
      property: "find",
      requireIteratorReceiver: true,
    },
  },
  ImportAttributes: {
    minVersion: 16,
    example: 'import data from "./data.json" with { type: "json" }',
    astInfo: {
      nodeType: [
        "ImportDeclaration",
        "ExportNamedDeclaration",
        "ExportAllDeclaration",
        "ImportExpression",
      ],
      importAttributes: true,
    },
  },
  ImportOptions: {
    minVersion: 16,
    example: 'import("./data.json", options)',
    astInfo: {
      nodeType: "ImportExpression",
      importOptions: true,
    },
  },
  RegExpModifiers: {
    minVersion: 16,
    example: "/(?i:pattern)/",
    astInfo: {
      nodeType: "Literal",
      regexpModifiers: true,
    },
  },
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
  IntlDurationFormat: {
    minVersion: 16,
    example: "new Intl.DurationFormat('en')",
    astInfo: {
      nodeType: "NewExpression",
      object: "Intl",
      property: "DurationFormat",
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
      requireSetLikeCall: true,
    },
  },
  SetIntersection: {
    minVersion: 16,
    example: "set1.intersection(set2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "intersection",
      requireSetLikeCall: true,
    },
  },
  SetDifference: {
    minVersion: 16,
    example: "set1.difference(set2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "difference",
      requireSetLikeCall: true,
    },
  },
  SetSymmetricDifference: {
    minVersion: 16,
    example: "set1.symmetricDifference(set2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "symmetricDifference",
      requireSetLikeCall: true,
    },
  },
  SetIsSubsetOf: {
    minVersion: 16,
    example: "set1.isSubsetOf(set2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "isSubsetOf",
      requireSetLikeCall: true,
    },
  },
  SetIsSupersetOf: {
    minVersion: 16,
    example: "set1.isSupersetOf(set2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "isSupersetOf",
      requireSetLikeCall: true,
    },
  },
  SetIsDisjointFrom: {
    minVersion: 16,
    example: "set1.isDisjointFrom(set2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "isDisjointFrom",
      requireSetLikeCall: true,
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
  MathF16Round: {
    minVersion: 16,
    example: "Math.f16round(value)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Math",
      property: "f16round",
    },
  },
  DataViewGetFloat16: {
    minVersion: 16,
    example: "view.getFloat16(byteOffset)",
    astInfo: {
      nodeType: "CallExpression",
      property: "getFloat16",
    },
  },
  DataViewSetFloat16: {
    minVersion: 16,
    example: "view.setFloat16(byteOffset, value)",
    astInfo: {
      nodeType: "CallExpression",
      property: "setFloat16",
    },
  },
};

module.exports = { ES16_FEATURES };
