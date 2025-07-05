/**
 * Map of ES features (by name) → earliest ES minVersion + AST detection hints
 * ES6 (2015) = 6, ES7 (2016) = 7, ES8 (2017) = 8, ES9 (2018) = 9,
 * ES10 (2019) = 10, ES11 (2020) = 11, ES12 (2021) = 12,
 * ES13 (2022) = 13, ES14 (2023) = 14, etc.
 */
const ES_FEATURES = {
  // ----------------------------------------------------------
  // ES6 / ES2015
  // ----------------------------------------------------------
  ArraySpread: {
    minVersion: 6,
    example: '[...arr]',
    astInfo: {
      nodeType: 'ArrayExpression',
      childType: 'SpreadElement',
    },
  },
  let: {
    minVersion: 6,
    example: 'let x = 10;',
    astInfo: {
      nodeType: 'VariableDeclaration',
      kind: 'let',
    },
  },
  const: {
    minVersion: 6,
    example: 'const x = 10;',
    astInfo: {
      nodeType: 'VariableDeclaration',
      kind: 'const',
    },
  },
  class: {
    minVersion: 6,
    example: 'class MyClass {}',
    astInfo: {
      nodeType: 'ClassDeclaration',
    },
  },
  extends: {
    minVersion: 6,
    example: 'class MyClass extends OtherClass {}',
    astInfo: {
      nodeType: 'ClassDeclaration',
      property: 'superClass',
    },
  },
  import: {
    minVersion: 6,
    example: 'import * as mod from "mod";',
    astInfo: {
      nodeType: 'ImportDeclaration',
    },
  },
  export: {
    minVersion: 6,
    example: 'export default x;',
    astInfo: {
      nodeType: 'ExportDeclaration',
    },
  },
  ArrowFunctions: {
    minVersion: 6,
    example: 'const fn = () => {};',
    astInfo: {
      nodeType: 'ArrowFunctionExpression',
    },
  },
  TemplateLiterals: {
    minVersion: 6,
    example: 'const str = `Hello, ${name}!`;',
    astInfo: {
      nodeType: 'TemplateLiteral',
    },
  },
  Destructuring: {
    minVersion: 6,
    example: 'const { x } = obj;',
    astInfo: {
      nodeType: 'ObjectPattern',
    },
  },
  DefaultParams: {
    minVersion: 6,
    example: 'function foo(x=10) {}',
    astInfo: {
      nodeType: 'AssignmentPattern',
    },
  },
  RestSpread: {
    minVersion: 6,
    example: 'function(...args) {}',
    astInfo: {
      nodeType: 'RestElement',
    },
  },
  ForOf: {
    minVersion: 6,
    example: 'for (const x of iterable) {}',
    astInfo: {
      nodeType: 'ForOfStatement',
    },
  },
  Map: {
    minVersion: 6,
    example: 'new Map()',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'Map',
    },
  },
  Set: {
    minVersion: 6,
    example: 'new Set()',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'Set',
    },
  },
  WeakMap: {
    minVersion: 6,
    example: 'new WeakMap()',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'WeakMap',
    },
  },
  WeakSet: {
    minVersion: 6,
    example: 'new WeakSet()',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'WeakSet',
    },
  },
  Promise: {
    minVersion: 6,
    example: 'new Promise((resolve, reject) => {})',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'Promise',
    },
  },
  PromiseResolve: {
    minVersion: 6,
    example: 'Promise.resolve(value)',
    astInfo: {
      nodeType: 'CallExpression',
      object: 'Promise',
      property: 'resolve',
    },
  },
  PromiseReject: {
    minVersion: 6,
    example: 'Promise.reject(value)',
    astInfo: {
      nodeType: 'CallExpression',
      object: 'Promise',
      property: 'reject',
    },
  },
  Symbol: {
    minVersion: 6,
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
    minVersion: 7,
    example: 'a ** b',
    astInfo: {
      nodeType: 'BinaryExpression',
      operator: '**',
    },
  },
  ArrayPrototypeIncludes: {
    minVersion: 7,
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
    minVersion: 8,
    example: 'async function foo() { await bar(); }',
    astInfo: {
      nodeType: 'AwaitExpression',
    },
  },
  ObjectValues: {
    minVersion: 8,
    example: 'Object.values(obj)',
    astInfo: {
      nodeType: 'CallExpression',
      object: 'Object',
      property: 'values',
    },
  },
  ObjectEntries: {
    minVersion: 8,
    example: 'Object.entries(obj)',
    astInfo: {
      nodeType: 'CallExpression',
      object: 'Object',
      property: 'entries',
    },
  },
  StringPadStart: {
    minVersion: 8,
    example: 'str.padStart(10)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'padStart',
    },
  },
  StringPadEnd: {
    minVersion: 8,
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
    minVersion: 9,
    example: 'const obj2 = { ...obj};',
    astInfo: {
      nodeType: 'ObjectExpression',
      childType: 'SpreadElement',
    },
  },
  AsyncIteration: {
    minVersion: 9,
    example: 'for await (const x of asyncIterable) {}',
    astInfo: {
      nodeType: 'ForAwaitStatement',
    },
  },
  PromiseFinally: {
    minVersion: 9,
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
    minVersion: 10,
    example: 'arr.flat()',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'flat',
    },
  },
  ArrayFlatMap: {
    minVersion: 10,
    example: 'arr.flatMap(x => x)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'flatMap',
    },
  },
  ObjectFromEntries: {
    minVersion: 10,
    example: 'Object.fromEntries(entries)',
    astInfo: {
      nodeType: 'CallExpression',
      object: 'Object',
      property: 'fromEntries',
    },
  },
  OptionalCatchBinding: {
    minVersion: 10,
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
    minVersion: 11,
    example: '123n',
    astInfo: {
      nodeType: 'BigIntLiteral',
    },
  },
  DynamicImport: {
    minVersion: 11,
    example: 'import("module.js")',
    astInfo: {
      nodeType: 'ImportExpression',
    },
  },
  OptionalChaining: {
    minVersion: 11,
    example: 'obj?.prop',
    astInfo: {
      nodeType: 'ChainExpression',
    },
  },
  NullishCoalescing: {
    minVersion: 11,
    example: 'a ?? b',
    astInfo: {
      nodeType: 'LogicalExpression',
      operator: '??',
    },
  },
  globalThis: {
    minVersion: 11,
    example: 'globalThis',
    astInfo: {
      nodeType: 'Identifier',
      name: 'globalThis',
    },
  },
  PromiseAllSettled: {
    minVersion: 11,
    example: 'Promise.allSettled(promises)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'allSettled',
    },
  },
  StringMatchAll: {
    minVersion: 11,
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
    minVersion: 12,
    example: 'x &&= y;',
    astInfo: {
      nodeType: 'AssignmentExpression',
      operators: ['&&=', '||=', '??='],
    },
  },
  NumericSeparators: {
    minVersion: 12,
    example: '1_000_000',
    astInfo: {
      nodeType: 'NumericLiteralWithSeparator',
    },
  },
  StringReplaceAll: {
    minVersion: 12,
    example: 'str.replaceAll("a", "b")',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'replaceAll',
    },
  },
  PromiseAny: {
    minVersion: 12,
    example: 'Promise.any(promises)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'any',
    },
  },
  WeakRef: {
    minVersion: 12,
    example: 'new WeakRef(obj)',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'WeakRef',
    },
  },
  FinalizationRegistry: {
    minVersion: 12,
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
    minVersion: 13,
    example: 'await foo()',
    astInfo: {
      nodeType: 'AwaitExpression',
      topLevel: true,
    },
  },
  PrivateClassFields: {
    minVersion: 13,
    example: 'class MyClass { #x = 1; }',
    astInfo: {
      nodeType: 'PropertyDefinition',
      isPrivate: true,
    },
  },
  ClassStaticBlocks: {
    minVersion: 13,
    example: 'class MyClass { static {} }',
    astInfo: {
      nodeType: 'StaticBlock',
    },
  },
  ErgonomicBrandChecks: {
    minVersion: 13,
    example: '#field in obj',
    astInfo: {
      nodeType: 'BinaryExpression',
      operator: 'in',
      leftIsPrivate: true,
    },
  },
  ErrorCause: {
    minVersion: 13,
    example: 'new Error("...", { cause: e })',
    astInfo: {
      nodeType: 'NewExpression',
      callee: 'Error',
      hasOptionsCause: true,
    },
  },
  ArrayPrototypeAt: {
    minVersion: 13,
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
    minVersion: 14,
    example: '#!/usr/bin/env node',
    astInfo: {
      nodeType: 'Hashbang',
    },
  },
  ArrayToReversed: {
    minVersion: 14,
    example: 'arr.toReversed()',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'toReversed',
    },
  },
  ArrayToSorted: {
    minVersion: 14,
    example: 'arr.toSorted(compareFn)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'toSorted',
    },
  },
  ArrayToSpliced: {
    minVersion: 14,
    example: 'arr.toSpliced(start, deleteCount, ...)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'toSpliced',
    },
  },
  ArrayWith: {
    minVersion: 14,
    example: 'arr.with(index, value)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'with',
    },
  },

  // ----------------------------------------------------------
  // ES14 / ES2023 (continued)
  // ----------------------------------------------------------
  ArrayFindLast: {
    minVersion: 14,
    example: 'arr.findLast(x => x > 5)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'findLast',
    },
  },
  ArrayFindLastIndex: {
    minVersion: 14,
    example: 'arr.findLastIndex(x => x > 5)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'findLastIndex',
    },
  },

  // ----------------------------------------------------------
  // ES15 / ES2024
  // ----------------------------------------------------------
  ObjectHasOwn: {
    minVersion: 13,
    example: 'Object.hasOwn(obj, "prop")',
    astInfo: {
      nodeType: 'CallExpression',
      object: 'Object',
      property: 'hasOwn',
    },
  },
  StringIsWellFormed: {
    minVersion: 15,
    example: 'str.isWellFormed()',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'isWellFormed',
    },
  },
  StringToWellFormed: {
    minVersion: 15,
    example: 'str.toWellFormed()',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'toWellFormed',
    },
  },
  RegExpUnicodeSetFlag: {
    minVersion: 15,
    example: '/pattern/v',
    astInfo: {
      nodeType: 'RegExpLiteral',
      flags: 'v',
    },
  },

  // ----------------------------------------------------------
  // ES16 / ES2025
  // ----------------------------------------------------------
  ArrayGroup: {
    minVersion: 16,
    example: 'arr.group(x => x.category)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'group',
    },
  },
  ArrayGroupToMap: {
    minVersion: 16,
    example: 'arr.groupToMap(x => x.category)',
    astInfo: {
      nodeType: 'CallExpression',
      property: 'groupToMap',
    },
  },
  PromiseTry: {
    minVersion: 16,
    example: 'Promise.try(() => syncOrAsyncFunction())',
    astInfo: {
      nodeType: 'CallExpression',
      object: 'Promise',
      property: 'try',
    },
  },
  DuplicateNamedCaptureGroups: {
    minVersion: 16,
    example: '/(?<name>a)|(?<name>b)/',
    astInfo: {
      nodeType: 'RegExpLiteral',
      duplicateNamedGroups: true,
    },
  },
};

const NODE_TYPES = {
  VARIABLE_DECLARATION: 'VariableDeclaration',
  ARROW_FUNCTION_EXPRESSION: 'ArrowFunctionExpression',
  CHAIN_EXPRESSION: 'ChainExpression',
  LOGICAL_EXPRESSION: 'LogicalExpression',
  NEW_EXPRESSION: 'NewExpression',
};

const POLYFILL_PATTERNS = [
  // Array methods
  { pattern: /Array\.prototype\.toSorted/, feature: 'ArrayToSorted' },
  { pattern: /Array\.prototype\.findLast/, feature: 'ArrayFindLast' },
  { pattern: /Array\.prototype\.findLastIndex/, feature: 'ArrayFindLastIndex' },
  { pattern: /Array\.prototype\.at/, feature: 'ArrayAt' },

  // String methods
  { pattern: /String\.prototype\.replaceAll/, feature: 'StringReplaceAll' },
  { pattern: /String\.prototype\.matchAll/, feature: 'StringMatchAll' },
  { pattern: /String\.prototype\.at/, feature: 'StringAt' },

  // Object methods
  { pattern: /Object\.hasOwn/, feature: 'ObjectHasOwn' },

  // Promise methods
  { pattern: /Promise\.any/, feature: 'PromiseAny' },

  // RegExp methods
  { pattern: /RegExp\.prototype\.exec/, feature: 'RegExpExec' },

  // Global methods
  { pattern: /globalThis/, feature: 'GlobalThis' },
];

const IMPORT_PATTERNS = [
  { pattern: /from\s+['"]core-js\/modules\/es\.array\.to-sorted['"]/, feature: 'ArrayToSorted' },
  { pattern: /from\s+['"]core-js\/modules\/es\.array\.find-last['"]/, feature: 'ArrayFindLast' },
  { pattern: /from\s+['"]core-js\/modules\/es\.array\.find-last-index['"]/, feature: 'ArrayFindLastIndex' },
  { pattern: /from\s+['"]core-js\/modules\/es\.array\.at['"]/, feature: 'ArrayAt' },
  { pattern: /from\s+['"]core-js\/modules\/es\.string\.replace-all['"]/, feature: 'StringReplaceAll' },
  { pattern: /from\s+['"]core-js\/modules\/es\.string\.match-all['"]/, feature: 'StringMatchAll' },
  { pattern: /from\s+['"]core-js\/modules\/es\.string\.at['"]/, feature: 'StringAt' },
  { pattern: /from\s+['"]core-js\/modules\/es\.object\.has-own['"]/, feature: 'ObjectHasOwn' },
  { pattern: /from\s+['"]core-js\/modules\/es\.promise\.any['"]/, feature: 'PromiseAny' },
  { pattern: /from\s+['"]core-js\/modules\/es\.regexp\.exec['"]/, feature: 'RegExpExec' },
  { pattern: /from\s+['"]core-js\/modules\/es\.global-this['"]/, feature: 'GlobalThis' },
];

const BROWSER_TO_ES_VERSION = {
  ie: {
    '11': 5
  },
  edge: {
    '15': 6,
    '16': 7,
    '17': 8,
    '18': 9,
    '79': 10, // Chromium-based Edge
    '80': 11
  },
  firefox: {
    '52': 6,
    '55': 7,
    '60': 8,
    '65': 9,
    '70': 10,
    '75': 11
  },
  chrome: {
    '51': 6,
    '55': 7,
    '60': 8,
    '70': 9,
    '75': 10,
    '80': 11
  },
  safari: {
    '10': 6,
    '10.1': 7,
    '11': 8,
    '12': 9,
    '13': 10,
    '13.1': 11
  },
  opera: {
    '38': 6,
    '42': 7,
    '47': 8,
    '57': 9,
    '62': 10,
    '67': 11
  },
  ios_saf: {
    '10': 6,
    '10.3': 7,
    '11': 8,
    '12': 9,
    '13': 10,
    '13.4': 11
  },
  android: {
    '67': 6,
    '76': 7,
    '80': 8,
    '85': 9,
    '90': 10,
    '95': 11
  }
};

const JS_VERSIONS = [
  'es3', 'es4', 'es5', 'es6', 'es2015',
  'es7', 'es2016', 'es8', 'es2017', 'es9', 'es2018',
  'es10', 'es2019', 'es11', 'es2020', 'es12', 'es2021',
  'es13', 'es2022', 'es14', 'es2023', 'es15', 'es2024', 'es16', 'es2025', 'checkBrowser'
];

/**
 * Maps feature names from ES_FEATURES to their polyfill patterns.
 * This version uses standardized keys and robust regex for both manual and module polyfills.
 */
const FEATURE_TO_POLYFILL_MAP = {
    // ES2015 (ES6)
    'Array.from': [/\bArray\.from\s*=/, /['"]core-js\/modules\/es\.array\.from['"]/],
    'Array.of': [/\bArray\.of\s*=/, /['"]core-js\/modules\/es\.array\.of['"]/],
    'Array.prototype.find': [/\bArray\.prototype\.find\s*=/, /['"]core-js\/modules\/es\.array\.find['"]/],
    'Array.prototype.findIndex': [/\bArray\.prototype\.findIndex\s*=/, /['"]core-js\/modules\/es\.array\.find-index['"]/],
    'Object.assign': [/\bObject\.assign\s*=/, /['"]core-js\/modules\/es\.object\.assign['"]/, /object-assign/],
    'Promise': [/\bPromise\s*=/, /['"]core-js\/modules\/es\.promise['"]/, /es6-promise/],
    'String.prototype.startsWith': [/\bString\.prototype\.startsWith\s*=/, /['"]core-js\/modules\/es\.string\.starts-with['"]/],
    'String.prototype.endsWith': [/\bString\.prototype\.endsWith\s*=/, /['"]core-js\/modules\/es\.string\.ends-with['"]/],
    'String.prototype.includes': [/\bString\.prototype\.includes\s*=/, /['"]core-js\/modules\/es\.string\.includes['"]/],
    'Symbol': [/\bSymbol\s*=/, /['"]core-js\/modules\/es\.symbol['"]/],
    'Map': [/\bMap\s*=/, /['"]core-js\/modules\/es\.map['"]/],
    'Set': [/\bSet\s*=/, /['"]core-js\/modules\/es\.set['"]/],
    'WeakMap': [/\bWeakMap\s*=/, /['"]core-js\/modules\/es\.weak-map['"]/],
    'WeakSet': [/\bWeakSet\s*=/, /['"]core-js\/modules\/es\.weak-set['"]/],

    // ES2016
    'Array.prototype.includes': [/\bArray\.prototype\.includes\s*=/, /['"]core-js\/modules\/es\.array\.includes['"]/],

    // ES2017
    'Object.values': [/\bObject\.values\s*=/, /['"]core-js\/modules\/es\.object\.values['"]/],
    'Object.entries': [/\bObject\.entries\s*=/, /['"]core-js\/modules\/es\.object\.entries['"]/],
    'Object.getOwnPropertyDescriptors': [/\bObject\.getOwnPropertyDescriptors\s*=/, /['"]core-js\/modules\/es\.object\.get-own-property-descriptors['"]/],
    'String.prototype.padStart': [/\bString\.prototype\.padStart\s*=/, /['"]core-js\/modules\/es\.string\.pad-start['"]/],
    'String.prototype.padEnd': [/\bString\.prototype\.padEnd\s*=/, /['"]core-js\/modules\/es\.string\.pad-end['"]/],

    // ES2018
    'Promise.prototype.finally': [/\bPromise\.prototype\.finally\s*=/, /['"]core-js\/modules\/es\.promise\.finally['"]/],

    // ES2019
    'Array.prototype.flat': [/\bArray\.prototype\.flat\s*=/, /['"]core-js\/modules\/es\.array\.flat['"]/],
    'Array.prototype.flatMap': [/\bArray\.prototype\.flatMap\s*=/, /['"]core-js\/modules\/es\.array\.flat-map['"]/],
    'Object.fromEntries': [/\bObject\.fromEntries\s*=/, /['"]core-js\/modules\/es\.object\.from-entries['"]/],
    'String.prototype.trimStart': [/\bString\.prototype\.trimStart\s*=/, /['"]core-js\/modules\/es\.string\.trim-start['"]/],
    'String.prototype.trimEnd': [/\bString\.prototype\.trimEnd\s*=/, /['"]core-js\/modules\/es\.string\.trim-end['"]/],

    // ES2020
    'Promise.allSettled': [/\bPromise\.allSettled\s*=/, /['"]core-js\/modules\/es\.promise\.all-settled['"]/],
    'String.prototype.matchAll': [/\bString\.prototype\.matchAll\s*=/, /['"]core-js\/modules\/es\.string\.match-all['"]/],
    'globalThis': [/globalThis\s*=/, /['"]core-js\/modules\/es\.global-this['"]/],
    'BigInt': [/\bBigInt\s*=/, /['"]core-js\/modules\/es\.bigint['"]/],

    // ES2021
    'Promise.any': [/\bPromise\.any\s*=/, /['"]core-js\/modules\/es\.promise\.any['"]/],
    'String.prototype.replaceAll': [/\bString\.prototype\.replaceAll\s*=/, /['"]core-js\/modules\/es\.string\.replace-all['"]/],

    // ES2022
    'Array.prototype.at': [/\bArray\.prototype\.at\s*=/, /['"]core-js\/modules\/es\.array\.at['"]/],
    'String.prototype.at': [/\bString\.prototype\.at\s*=/, /['"]core-js\/modules\/es\.string\.at['"]/],

    // ES2023
    'Array.prototype.findLast': [/\bArray\.prototype\.findLast\s*=/, /['"]core-js\/modules\/es\.array\.find-last['"]/],
    'Array.prototype.findLastIndex': [/\bArray\.prototype\.findLastIndex\s*=/, /['"]core-js\/modules\/es\.array\.find-last-index['"]/],
    'Array.prototype.toReversed': [/\bArray\.prototype\.toReversed\s*=/, /['"]core-js\/modules\/es\.array\.to-reversed['"]/],
    'Array.prototype.toSorted': [/\bArray\.prototype\.toSorted\s*=/, /['"]core-js\/modules\/es\.array\.to-sorted['"]/],
    'Array.prototype.toSpliced': [/\bArray\.prototype\.toSpliced\s*=/, /['"]core-js\/modules\/es\.array\.to-spliced['"]/],
    'Array.prototype.with': [/\bArray\.prototype\.with\s*=/, /['"]core-js\/modules\/es\.array\.with['"]/],

    // ES2024
    'Object.hasOwn': [/\bObject\.hasOwn\s*=/, /['"]core-js\/modules\/es\.object\.has-own['"]/],
    'String.prototype.isWellFormed': [/\bString\.prototype\.isWellFormed\s*=/, /['"]core-js\/modules\/es\.string\.is-well-formed['"]/],
    'String.prototype.toWellFormed': [/\bString\.prototype\.toWellFormed\s*=/, /['"]core-js\/modules\/es\.string\.to-well-formed['"]/],

    // ES2025
    'Array.prototype.group': [/\bArray\.prototype\.group\s*=/, /['"]core-js\/modules\/es\.array\.group['"]/],
    'Array.prototype.groupToMap': [/\bArray\.prototype\.groupToMap\s*=/, /['"]core-js\/modules\/es\.array\.group-to-map['"]/],
    'Promise.try': [/\bPromise\.try\s*=/, /['"]core-js\/modules\/es\.promise\.try['"]/],
};

module.exports = {
  ES_FEATURES,
  NODE_TYPES,
  POLYFILL_PATTERNS,
  IMPORT_PATTERNS,
  BROWSER_TO_ES_VERSION,
  FEATURE_TO_POLYFILL_MAP,
  JS_VERSIONS,
};
