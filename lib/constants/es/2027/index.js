const ES18_FEATURES = {
  DateToTemporalInstant: {
    minVersion: 18,
    example: "new Date().toTemporalInstant()",
    astInfo: {
      nodeType: "CallExpression",
      property: "toTemporalInstant",
      requireDateReceiver: true,
    },
  },
  UsingDeclarations: {
    minVersion: 18,
    example: "using resource = acquire();",
    astInfo: {
      nodeType: "VariableDeclaration",
      kind: "using",
    },
  },
  AwaitUsingDeclarations: {
    minVersion: 18,
    example: "await using resource = acquire();",
    astInfo: {
      nodeType: "VariableDeclaration",
      kind: "await using",
    },
  },
  SymbolDispose: {
    minVersion: 18,
    example: "Symbol.dispose",
    astInfo: {
      nodeType: "MemberExpression",
      object: "Symbol",
      property: "dispose",
    },
  },
  SymbolAsyncDispose: {
    minVersion: 18,
    example: "Symbol.asyncDispose",
    astInfo: {
      nodeType: "MemberExpression",
      object: "Symbol",
      property: "asyncDispose",
    },
  },
  AtomicsPause: {
    minVersion: 18,
    example: "Atomics.pause()",
    astInfo: {
      nodeType: "CallExpression",
      object: "Atomics",
      property: "pause",
    },
  },
  IteratorZip: {
    minVersion: 18,
    example: "Iterator.zip(iterables)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Iterator",
      property: "zip",
    },
  },
  IteratorZipKeyed: {
    minVersion: 18,
    example: "Iterator.zipKeyed(iterables)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Iterator",
      property: "zipKeyed",
    },
  },
  IteratorChunks: {
    minVersion: 18,
    example: "Iterator.from(values).chunks(2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "chunks",
      requireIteratorReceiver: true,
    },
  },
  IteratorWindows: {
    minVersion: 18,
    example: "Iterator.from(values).windows(2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "windows",
      requireIteratorReceiver: true,
    },
  },
  IteratorIncludes: {
    minVersion: 18,
    example: "Iterator.from(values).includes(2)",
    astInfo: {
      nodeType: "CallExpression",
      property: "includes",
      requireIteratorReceiver: true,
    },
  },
  IteratorJoin: {
    minVersion: 18,
    example: 'Iterator.from(values).join(",")',
    astInfo: {
      nodeType: "CallExpression",
      property: "join",
      requireIteratorReceiver: true,
    },
  },
};

module.exports = { ES18_FEATURES };
