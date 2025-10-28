const POLYFILL_PATTERNS = [
  // Array methods
  { pattern: /Array\.prototype\.toSorted/, feature: "ArrayToSorted" },
  { pattern: /Array\.prototype\.findLast/, feature: "ArrayFindLast" },
  { pattern: /Array\.prototype\.findLastIndex/, feature: "ArrayFindLastIndex" },
  { pattern: /Array\.prototype\.at/, feature: "ArrayAt" },

  // String methods
  { pattern: /String\.prototype\.replaceAll/, feature: "StringReplaceAll" },
  { pattern: /String\.prototype\.matchAll/, feature: "StringMatchAll" },
  { pattern: /String\.prototype\.at/, feature: "StringAt" },

  // Object methods
  { pattern: /Object\.hasOwn/, feature: "ObjectHasOwn" },

  // Promise methods
  { pattern: /Promise\.any/, feature: "PromiseAny" },

  // RegExp methods
  { pattern: /RegExp\.prototype\.exec/, feature: "RegExpExec" },

  // Global methods
  { pattern: /globalThis/, feature: "GlobalThis" },
];

const IMPORT_PATTERNS = [
  {
    pattern: /from\s+['"]core-js\/modules\/es\.array\.to-sorted['"]/,
    feature: "ArrayToSorted",
  },
  {
    pattern: /from\s+['"]core-js\/modules\/es\.array\.find-last['"]/,
    feature: "ArrayFindLast",
  },
  {
    pattern: /from\s+['"]core-js\/modules\/es\.array\.find-last-index['"]/,
    feature: "ArrayFindLastIndex",
  },
  {
    pattern: /from\s+['"]core-js\/modules\/es\.array\.at['"]/,
    feature: "ArrayAt",
  },
  {
    pattern: /from\s+['"]core-js\/modules\/es\.string\.replace-all['"]/,
    feature: "StringReplaceAll",
  },
  {
    pattern: /from\s+['"]core-js\/modules\/es\.string\.match-all['"]/,
    feature: "StringMatchAll",
  },
  {
    pattern: /from\s+['"]core-js\/modules\/es\.string\.at['"]/,
    feature: "StringAt",
  },
  {
    pattern: /from\s+['"]core-js\/modules\/es\.object\.has-own['"]/,
    feature: "ObjectHasOwn",
  },
  {
    pattern: /from\s+['"]core-js\/modules\/es\.promise\.any['"]/,
    feature: "PromiseAny",
  },
  {
    pattern: /from\s+['"]core-js\/modules\/es\.regexp\.exec['"]/,
    feature: "RegExpExec",
  },
  {
    pattern: /from\s+['"]core-js\/modules\/es\.global-this['"]/,
    feature: "GlobalThis",
  },
];

/**
 * Maps feature names from ES_FEATURES to their polyfill patterns.
 * This version uses standardized keys and robust regex for both manual and module polyfills.
 */
const FEATURE_TO_POLYFILL_MAP = {
  // ES2015 (ES6)
  "Array.from": [
    /\bArray\.from\s*=/,
    /['"]core-js\/modules\/es\.array\.from['"]/,
  ],
  "Array.of": [/\bArray\.of\s*=/, /['"]core-js\/modules\/es\.array\.of['"]/],
  "Array.prototype.find": [
    /\bArray\.prototype\.find\s*=/,
    /['"]core-js\/modules\/es\.array\.find['"]/,
  ],
  "Array.prototype.findIndex": [
    /\bArray\.prototype\.findIndex\s*=/,
    /['"]core-js\/modules\/es\.array\.find-index['"]/,
  ],
  "Object.assign": [
    /\bObject\.assign\s*=/,
    /['"]core-js\/modules\/es\.object\.assign['"]/,
    /object-assign/,
  ],
  Promise: [
    /\bPromise\s*=/,
    /['"]core-js\/modules\/es\.promise['"]/,
    /es6-promise/,
  ],
  "String.prototype.startsWith": [
    /\bString\.prototype\.startsWith\s*=/,
    /['"]core-js\/modules\/es\.string\.starts-with['"]/,
  ],
  "String.prototype.endsWith": [
    /\bString\.prototype\.endsWith\s*=/,
    /['"]core-js\/modules\/es\.string\.ends-with['"]/,
  ],
  "String.prototype.includes": [
    /\bString\.prototype\.includes\s*=/,
    /['"]core-js\/modules\/es\.string\.includes['"]/,
  ],
  Symbol: [/\bSymbol\s*=/, /['"]core-js\/modules\/es\.symbol['"]/],
  Map: [/\bMap\s*=/, /['"]core-js\/modules\/es\.map['"]/],
  Set: [/\bSet\s*=/, /['"]core-js\/modules\/es\.set['"]/],
  WeakMap: [/\bWeakMap\s*=/, /['"]core-js\/modules\/es\.weak-map['"]/],
  WeakSet: [/\bWeakSet\s*=/, /['"]core-js\/modules\/es\.weak-set['"]/],

  // ES2016
  "Array.prototype.includes": [
    /\bArray\.prototype\.includes\s*=/,
    /['"]core-js\/modules\/es\.array\.includes['"]/,
  ],

  // ES2017
  "Object.values": [
    /\bObject\.values\s*=/,
    /['"]core-js\/modules\/es\.object\.values['"]/,
  ],
  "Object.entries": [
    /\bObject\.entries\s*=/,
    /['"]core-js\/modules\/es\.object\.entries['"]/,
  ],
  "Object.getOwnPropertyDescriptors": [
    /\bObject\.getOwnPropertyDescriptors\s*=/,
    /['"]core-js\/modules\/es\.object\.get-own-property-descriptors['"]/,
  ],
  "String.prototype.padStart": [
    /\bString\.prototype\.padStart\s*=/,
    /['"]core-js\/modules\/es\.string\.pad-start['"]/,
  ],
  "String.prototype.padEnd": [
    /\bString\.prototype\.padEnd\s*=/,
    /['"]core-js\/modules\/es\.string\.pad-end['"]/,
  ],

  // ES2018
  "Promise.prototype.finally": [
    /\bPromise\.prototype\.finally\s*=/,
    /['"]core-js\/modules\/es\.promise\.finally['"]/,
  ],

  // ES2019
  "Array.prototype.flat": [
    /\bArray\.prototype\.flat\s*=/,
    /['"]core-js\/modules\/es\.array\.flat['"]/,
  ],
  "Array.prototype.flatMap": [
    /\bArray\.prototype\.flatMap\s*=/,
    /['"]core-js\/modules\/es\.array\.flat-map['"]/,
  ],
  "Object.fromEntries": [
    /\bObject\.fromEntries\s*=/,
    /['"]core-js\/modules\/es\.object\.from-entries['"]/,
  ],
  "String.prototype.trimStart": [
    /\bString\.prototype\.trimStart\s*=/,
    /['"]core-js\/modules\/es\.string\.trim-start['"]/,
  ],
  "String.prototype.trimEnd": [
    /\bString\.prototype\.trimEnd\s*=/,
    /['"]core-js\/modules\/es\.string\.trim-end['"]/,
  ],

  // ES2020
  "Promise.allSettled": [
    /\bPromise\.allSettled\s*=/,
    /['"]core-js\/modules\/es\.promise\.all-settled['"]/,
  ],
  "String.prototype.matchAll": [
    /\bString\.prototype\.matchAll\s*=/,
    /['"]core-js\/modules\/es\.string\.match-all['"]/,
  ],
  globalThis: [/globalThis\s*=/, /['"]core-js\/modules\/es\.global-this['"]/],
  BigInt: [/\bBigInt\s*=/, /['"]core-js\/modules\/es\.bigint['"]/],

  // ES2021
  "Promise.any": [
    /\bPromise\.any\s*=/,
    /['"]core-js\/modules\/es\.promise\.any['"]/,
  ],
  "String.prototype.replaceAll": [
    /\bString\.prototype\.replaceAll\s*=/,
    /['"]core-js\/modules\/es\.string\.replace-all['"]/,
  ],

  // ES2022
  "Array.prototype.at": [
    /\bArray\.prototype\.at\s*=/,
    /['"]core-js\/modules\/es\.array\.at['"]/,
  ],
  "String.prototype.at": [
    /\bString\.prototype\.at\s*=/,
    /['"]core-js\/modules\/es\.string\.at['"]/,
  ],

  // ES2023
  "Array.prototype.findLast": [
    /\bArray\.prototype\.findLast\s*=/,
    /['"]core-js\/modules\/es\.array\.find-last['"]/,
  ],
  "Array.prototype.findLastIndex": [
    /\bArray\.prototype\.findLastIndex\s*=/,
    /['"]core-js\/modules\/es\.array\.find-last-index['"]/,
  ],
  "Array.prototype.toReversed": [
    /\bArray\.prototype\.toReversed\s*=/,
    /['"]core-js\/modules\/es\.array\.to-reversed['"]/,
  ],
  "Array.prototype.toSorted": [
    /\bArray\.prototype\.toSorted\s*=/,
    /['"]core-js\/modules\/es\.array\.to-sorted['"]/,
  ],
  "Array.prototype.toSpliced": [
    /\bArray\.prototype\.toSpliced\s*=/,
    /['"]core-js\/modules\/es\.array\.to-spliced['"]/,
  ],
  "Array.prototype.with": [
    /\bArray\.prototype\.with\s*=/,
    /['"]core-js\/modules\/es\.array\.with['"]/,
  ],

  // ES2024
  "Object.hasOwn": [
    /\bObject\.hasOwn\s*=/,
    /['"]core-js\/modules\/es\.object\.has-own['"]/,
  ],
  "String.prototype.isWellFormed": [
    /\bString\.prototype\.isWellFormed\s*=/,
    /['"]core-js\/modules\/es\.string\.is-well-formed['"]/,
  ],
  "String.prototype.toWellFormed": [
    /\bString\.prototype\.toWellFormed\s*=/,
    /['"]core-js\/modules\/es\.string\.to-well-formed['"]/,
  ],

  // ES2025
  "Array.prototype.group": [
    /\bArray\.prototype\.group\s*=/,
    /['"]core-js\/modules\/es\.array\.group['"]/,
  ],
  "Array.prototype.groupToMap": [
    /\bArray\.prototype\.groupToMap\s*=/,
    /['"]core-js\/modules\/es\.array\.group-to-map['"]/,
  ],
  "Promise.try": [
    /\bPromise\.try\s*=/,
    /['"]core-js\/modules\/es\.promise\.try['"]/,
  ],
};

module.exports = {
  POLYFILL_PATTERNS,
  IMPORT_PATTERNS,
  FEATURE_TO_POLYFILL_MAP,
};
