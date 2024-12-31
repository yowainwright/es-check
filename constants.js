/**
 * Map of ES features (by name) → earliest ES version + AST detection hints
 * ES6 (2015) = 6, ES7 (2016) = 7, ES8 (2017) = 8, ES9 (2018) = 9,
 * ES10 (2019) = 10, ES11 (2020) = 11, ES12 (2021) = 12,
 * ES13 (2022) = 13, ES14 (2023) = 14, etc.
 */
const ES_FEATURES = {
  // ----------------------------------------------------------
  // ES6 / ES2015
  // ----------------------------------------------------------
  ArraySpread: {
    version: 6,
    example: '[...arr]',
    astInfo: {
      nodeType: 'ArrayExpression',
      childType: 'SpreadElement',
    },
  },
  let: {
    version: 6,
    example: 'let x = 10;',
    astInfo: {
      nodeType: 'VariableDeclaration',
      kind: 'let',
    },
  },
  const: {
    version: 6,
    example: 'const x = 10;',
    astInfo: {
      nodeType: 'VariableDeclaration',
      kind: 'const',
    },
  },
  class: {
    version: 6,
    example: 'class MyClass {}',
    astInfo: {
      nodeType: 'ClassDeclaration',
    },
  },
  extends: {
    version: 6,
    example: 'class MyClass extends OtherClass {}',
    astInfo: {
      nodeType: 'ClassDeclaration',
      property: 'superClass',
    },
  },
  import: {
    version: 6,
    example: 'import * as mod from "mod";',
    astInfo: {
      nodeType: 'ImportDeclaration',
    },
  },
  export: {
    version: 6,
    example: 'export default x;',
    astInfo: {
      nodeType: 'ExportDeclaration',
    },
  },
  ArrowFunctions: {
    version: 6,
    example: 'const fn = () => {};',
    astInfo: {
      nodeType: 'ArrowFunctionExpression',
    },
  },
  TemplateLiterals: {
    version: 6,
    example: 'const str = `Hello, ${name}!`;',
    astInfo: {
      nodeType: 'TemplateLiteral',
    },
  },
  Destructuring: {
    version: 6,
    example: 'const { x } = obj;',
    astInfo: {
      nodeType: 'ObjectPattern',
    },
  },
  DefaultParams: {
    version: 6,
    example: 'function foo(x=10) {}',
    astInfo: {
      nodeType: 'AssignmentPattern',
    },
  },
  RestSpread: {
    version: 6,
    example: 'function(...args) {}',
    astInfo: {
      nodeType: 'RestElement',
    },
  },
  ForOf: {
    version: 6,
    example: 'for (const x of iterable) {}',
    astInfo: {
      nodeType: 'ForOfStatement',
    },
  },
  Map: {
    version: 6,
    example: 'new Map()',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'Map',
    },
  },
  Set: {
    version: 6,
    example: 'new Set()',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'Set',
    },
  },
  WeakMap: {
    version: 6,
    example: 'new WeakMap()',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'WeakMap',
    },
  },
  WeakSet: {
    version: 6,
    example: 'new WeakSet()',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'WeakSet',
    },
  },
  Promise: {
    version: 6,
    example: 'new Promise((resolve, reject) => {})',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'Promise',
    },
  },
  Symbol: {
    version: 6,
    example: 'Symbol("desc")',
    astInfo: {
      nodeType: 'CallExpression',
      callee: 'Symbol',
    },
  },

  // ----------------------------------------------------------
  // ES7 / ES2016
  // ----------------------------------------------------------
  ExponentOperator: {
    version: 7,
    example: 'a ** b',
    astInfo: {
      nodeType: 'BinaryExpression',
      operator: '**',
    },
  },
  ArrayPrototypeIncludes: {
    version: 7,
    example: 'arr.includes(x)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'includes',
    },
  },

  // ----------------------------------------------------------
  // ES8 / ES2017
  // ----------------------------------------------------------
  AsyncAwait: {
    version: 8,
    example: 'async function foo() { await bar(); }',
    astInfo: {
      nodeType: 'AwaitExpression',
    },
  },
  ObjectValues: {
    version: 8,
    example: 'Object.values(obj)',
    astInfo: {
      nodeType: 'CallExpression',
      object: 'Object',
      property: 'values',
    },
  },
  ObjectEntries: {
    version: 8,
    example: 'Object.entries(obj)',
    astInfo: {
      nodeType: 'CallExpression',
      object: 'Object',
      property: 'entries',
    },
  },
  StringPadStart: {
    version: 8,
    example: 'str.padStart(10)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'padStart',
    },
  },
  StringPadEnd: {
    version: 8,
    example: 'str.padEnd(10)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'padEnd',
    },
  },

  // ----------------------------------------------------------
  // ES9 / ES2018
  // ----------------------------------------------------------
  ObjectSpread: {
    version: 9,
    example: 'const obj2 = { ...obj};';
    astInfo: {
      nodeType: 'ObjectExpression',
      childType: 'SpreadElement',
    },
  },
  AsyncIteration: {
    version: 9,
    example: 'for await (const x of asyncIterable) {}',
    astInfo: {
      nodeType: 'ForAwaitStatement',
    },
  },
  PromiseFinally: {
    version: 9,
    example: 'promise.finally(() => {})',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'finally',
    },
  },

  // ----------------------------------------------------------
  // ES10 / ES2019
  // ----------------------------------------------------------
  ArrayFlat: {
    version: 10,
    example: 'arr.flat()',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'flat',
    },
  },
  ArrayFlatMap: {
    version: 10,
    example: 'arr.flatMap(x => x)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'flatMap',
    },
  },
  ObjectFromEntries: {
    version: 10,
    example: 'Object.fromEntries(entries)',
    astInfo: {
      nodeType: 'CallExpression',
      object: 'Object',
      property: 'fromEntries',
    },
  },
  OptionalCatchBinding: {
    version: 10,
    example: 'try { ... } catch { ... }',
    astInfo: {
      nodeType: 'CatchClause',
      noParam: true,
    },
  },

  // ----------------------------------------------------------
  // ES11 / ES2020
  // ----------------------------------------------------------
  BigInt: {
    version: 11,
    example: '123n',
    astInfo: {
      nodeType: 'BigIntLiteral',
    },
  },
  DynamicImport: {
    version: 11,
    example: 'import("module.js")',
    astInfo: {
      nodeType: 'ImportExpression',
    },
  },
  OptionalChaining: {
    version: 11,
    example: 'obj?.prop',
    astInfo: {
      nodeType: 'ChainExpression',
    },
  },
  NullishCoalescing: {
    version: 11,
    example: 'a ?? b',
    astInfo: {
      nodeType: 'LogicalExpression',
      operator: '??',
    },
  },
  globalThis: {
    version: 11,
    example: 'globalThis',
    astInfo: {
      nodeType: 'Identifier',
      name: 'globalThis',
    },
  },
  PromiseAllSettled: {
    version: 11,
    example: 'Promise.allSettled(promises)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'allSettled',
    },
  },
  StringMatchAll: {
    version: 11,
    example: 'str.matchAll(regex)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'matchAll',
    },
  },

  // ----------------------------------------------------------
  // ES12 / ES2021
  // ----------------------------------------------------------
  LogicalAssignment: {
    version: 12,
    example: 'x &&= y;',
    astInfo: {
      nodeType: 'AssignmentExpression',
      operators: ['&&=', '||=', '??='],
    },
  },
  NumericSeparators: {
    version: 12,
    example: '1_000_000',
    astInfo: {
      nodeType: 'NumericLiteralWithSeparator',
    },
  },
  StringReplaceAll: {
    version: 12,
    example: 'str.replaceAll("a", "b")',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'replaceAll',
    },
  },
  PromiseAny: {
    version: 12,
    example: 'Promise.any(promises)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'any',
    },
  },
  WeakRef: {
    version: 12,
    example: 'new WeakRef(obj)',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'WeakRef',
    },
  },
  FinalizationRegistry: {
    version: 12,
    example: 'new FinalizationRegistry(cb)',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'FinalizationRegistry',
    },
  },

  // ----------------------------------------------------------
  // ES13 / ES2022
  // ----------------------------------------------------------
  TopLevelAwait: {
    version: 13,
    example: 'await foo()',
    astInfo: {
      nodeType: 'AwaitExpression',
      topLevel: true,
    },
  },
  PrivateClassFields: {
    version: 13,
    example: 'class MyClass { #x = 1; }',
    astInfo: {
      nodeType: 'PropertyDefinition',
      isPrivate: true,
    },
  },
  ClassStaticBlocks: {
    version: 13,
    example: 'class MyClass { static {} }',
    astInfo: {
      nodeType: 'StaticBlock',
    },
  },
  ErgonomicBrandChecks: {
    version: 13,
    example: '#field in obj',
    astInfo: {
      nodeType: 'BinaryExpression',
      operator: 'in',
      leftIsPrivate: true,
    },
  },
  ErrorCause: {
    version: 13,
    example: 'new Error("...", { cause: e })',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'Error',
      hasOptionsCause: true,
    },
  },
  ArrayPrototypeAt: {
    version: 13,
    example: 'arr.at(-1)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'at',
    },
  },

  // ----------------------------------------------------------
  // ES14 / ES2023
  // ----------------------------------------------------------
  Hashbang: {
    version: 14,
    example: '#!/usr/bin/env node',
    astInfo: {
      nodeType: 'Hashbang',
    },
  },
  ArrayToReversed: {
    version: 14,
    example: 'arr.toReversed()',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'toReversed',
    },
  },
  ArrayToSorted: {
    version: 14,
    example: 'arr.toSorted(compareFn)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'toSorted',
    },
  },
  ArrayToSpliced: {
    version: 14,
    example: 'arr.toSpliced(start, deleteCount, ...)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'toSpliced',
    },
  },
  ArrayWith: {
    version: 14,
    example: 'arr.with(index, value)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'with',
    },
  },
};

module.exports = ES_FEATURES;
