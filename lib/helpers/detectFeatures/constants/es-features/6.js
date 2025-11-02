const ES6_FEATURES = {
  ArraySpread: {
    minVersion: 6,
    example: "[...arr]",
    astInfo: {
      nodeType: "ArrayExpression",
      childType: "SpreadElement",
    },
  },
  let: {
    minVersion: 6,
    example: "let x = 10;",
    astInfo: {
      nodeType: "VariableDeclaration",
      kind: "let",
    },
  },
  const: {
    minVersion: 6,
    example: "const x = 10;",
    astInfo: {
      nodeType: "VariableDeclaration",
      kind: "const",
    },
  },
  class: {
    minVersion: 6,
    example: "class MyClass {}",
    astInfo: {
      nodeType: "ClassDeclaration",
    },
  },
  extends: {
    minVersion: 6,
    example: "class MyClass extends OtherClass {}",
    astInfo: {
      nodeType: "ClassDeclaration",
      property: "superClass",
    },
  },
  import: {
    minVersion: 6,
    example: 'import * as mod from "mod";',
    astInfo: {
      nodeType: "ImportDeclaration",
    },
  },
  export: {
    minVersion: 6,
    example: "export default x;",
    astInfo: {
      nodeType: "ExportDeclaration",
    },
  },
  ArrowFunctions: {
    minVersion: 6,
    example: "const fn = () => {};",
    astInfo: {
      nodeType: "ArrowFunctionExpression",
    },
  },
  TemplateLiterals: {
    minVersion: 6,
    example: "const str = `Hello, ${name}!`;",
    astInfo: {
      nodeType: "TemplateLiteral",
    },
  },
  Destructuring: {
    minVersion: 6,
    example: "const { x } = obj;",
    astInfo: {
      nodeType: "ObjectPattern",
    },
  },
  DefaultParams: {
    minVersion: 6,
    example: "function foo(x=10) {}",
    astInfo: {
      nodeType: "AssignmentPattern",
    },
  },
  RestSpread: {
    minVersion: 6,
    example: "function(...args) {}",
    astInfo: {
      nodeType: "RestElement",
    },
  },
  ForOf: {
    minVersion: 6,
    example: "for (const x of iterable) {}",
    astInfo: {
      nodeType: "ForOfStatement",
    },
  },
  Map: {
    minVersion: 6,
    example: "new Map()",
    astInfo: {
      nodeType: "NewExpression",
      callee: "Map",
    },
  },
  Set: {
    minVersion: 6,
    example: "new Set()",
    astInfo: {
      nodeType: "NewExpression",
      callee: "Set",
    },
  },
  WeakMap: {
    minVersion: 6,
    example: "new WeakMap()",
    astInfo: {
      nodeType: "NewExpression",
      callee: "WeakMap",
    },
  },
  WeakSet: {
    minVersion: 6,
    example: "new WeakSet()",
    astInfo: {
      nodeType: "NewExpression",
      callee: "WeakSet",
    },
  },
  Promise: {
    minVersion: 6,
    example: "new Promise((resolve, reject) => {})",
    astInfo: {
      nodeType: "NewExpression",
      callee: "Promise",
    },
  },
  PromiseResolve: {
    minVersion: 6,
    example: "Promise.resolve(value)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Promise",
      property: "resolve",
    },
  },
  PromiseReject: {
    minVersion: 6,
    example: "Promise.reject(value)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Promise",
      property: "reject",
    },
  },
  Symbol: {
    minVersion: 6,
    example: 'Symbol("desc")',
    astInfo: {
      nodeType: "CallExpression",
      callee: "Symbol",
    },
  },
};

module.exports = { ES6_FEATURES };
