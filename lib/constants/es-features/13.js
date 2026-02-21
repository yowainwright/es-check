const ES13_FEATURES = {
  TopLevelAwait: {
    minVersion: 13,
    example: "await foo()",
    astInfo: {
      nodeType: "AwaitExpression",
      topLevel: true,
    },
  },
  PrivateClassFields: {
    minVersion: 13,
    example: "class MyClass { #x = 1; }",
    astInfo: {
      nodeType: "PropertyDefinition",
      isPrivate: true,
    },
  },
  ClassStaticBlocks: {
    minVersion: 13,
    example: "class MyClass { static {} }",
    astInfo: {
      nodeType: "StaticBlock",
    },
  },
  ErgonomicBrandChecks: {
    minVersion: 13,
    example: "#field in obj",
    astInfo: {
      nodeType: "BinaryExpression",
      operator: "in",
      leftIsPrivate: true,
    },
  },
  ErrorCause: {
    minVersion: 13,
    example: 'new Error("...", { cause: e })',
    astInfo: {
      nodeType: "NewExpression",
      callee: "Error",
      hasOptionsCause: true,
    },
  },
  ArrayPrototypeAt: {
    minVersion: 13,
    example: "arr.at(-1)",
    astInfo: {
      nodeType: "CallExpression",
      property: "at",
      excludeCallerTypes: ["ObjectExpression"],
      requireNumericArg: true,
    },
  },
  ObjectHasOwn: {
    minVersion: 13,
    example: 'Object.hasOwn(obj, "prop")',
    astInfo: {
      nodeType: "CallExpression",
      object: "Object",
      property: "hasOwn",
    },
  },
};

module.exports = { ES13_FEATURES };
