const ES9_FEATURES = {
  ObjectSpread: {
    minVersion: 9,
    example: "const obj2 = { ...obj};",
    astInfo: {
      nodeType: "ObjectExpression",
      childType: "SpreadElement",
    },
  },
  AsyncIteration: {
    minVersion: 9,
    example: "for await (const x of asyncIterable) {}",
    astInfo: {
      nodeType: "ForAwaitStatement",
    },
  },
  PromiseFinally: {
    minVersion: 9,
    example: "promise.finally(() => {})",
    astInfo: {
      nodeType: "CallExpression",
      property: "finally",
    },
  },
};

module.exports = { ES9_FEATURES };
