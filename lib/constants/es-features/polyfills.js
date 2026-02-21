const POLYFILL_PATTERNS = [
  { pattern: /Array\.prototype\.toSorted/, feature: "ArrayToSorted" },
  { pattern: /Array\.prototype\.findLast/, feature: "ArrayFindLast" },
  { pattern: /Array\.prototype\.findLastIndex/, feature: "ArrayFindLastIndex" },
  { pattern: /Array\.prototype\.at/, feature: "ArrayAt" },
  { pattern: /String\.prototype\.replaceAll/, feature: "StringReplaceAll" },
  { pattern: /String\.prototype\.matchAll/, feature: "StringMatchAll" },
  { pattern: /String\.prototype\.at/, feature: "StringAt" },
  { pattern: /Object\.hasOwn/, feature: "ObjectHasOwn" },
  { pattern: /Promise\.any/, feature: "PromiseAny" },
  { pattern: /RegExp\.prototype\.exec/, feature: "RegExpExec" },
  { pattern: /globalThis/, feature: "GlobalThis" },
];

const IMPORT_PATTERNS = [
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.array\.to-sorted['"]/,
    feature: "ArrayToSorted",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.array\.find-last['"]/,
    feature: "ArrayFindLast",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.array\.find-last-index['"]/,
    feature: "ArrayFindLastIndex",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.array\.at['"]/,
    feature: "ArrayAt",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.string\.replace-all['"]/,
    feature: "StringReplaceAll",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.string\.match-all['"]/,
    feature: "StringMatchAll",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.string\.at['"]/,
    feature: "StringAt",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.object\.has-own['"]/,
    feature: "ObjectHasOwn",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.promise\.any['"]/,
    feature: "PromiseAny",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.regexp\.exec['"]/,
    feature: "RegExpExec",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.global-this['"]/,
    feature: "GlobalThis",
  },
];

const FEATURE_TO_POLYFILL_MAP = {
  "Array.from": [
    /\bArray\.from\s*=/,
    /['"]core-js\/modules\/es\.array\.from['"]/,
    /['"]core-js\/actual\/array\/from['"]/,
  ],
  "Array.of": [
    /\bArray\.of\s*=/,
    /['"]core-js\/modules\/es\.array\.of['"]/,
    /['"]core-js\/actual\/array\/of['"]/,
  ],
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
    /\bobject-assign\b/,
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

  "Array.prototype.includes": [
    /\bArray\.prototype\.includes\s*=/,
    /['"]core-js\/modules\/es\.array\.includes['"]/,
  ],

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

  "Promise.prototype.finally": [
    /\bPromise\.prototype\.finally\s*=/,
    /['"]core-js\/modules\/es\.promise\.finally['"]/,
  ],

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

  "Promise.allSettled": [
    /\bPromise\.allSettled\s*=/,
    /['"]core-js\/modules\/es\.promise\.all-settled['"]/,
  ],
  "String.prototype.matchAll": [
    /\bString\.prototype\.matchAll\s*=/,
    /['"]core-js\/modules\/es\.string\.match-all['"]/,
  ],
  globalThis: [/\bglobalThis\s*=/, /['"]core-js\/modules\/es\.global-this['"]/],
  BigInt: [/\bBigInt\s*=/, /['"]core-js\/modules\/es\.bigint['"]/],

  "Promise.any": [
    /\bPromise\.any\s*=/,
    /['"]core-js\/modules\/es\.promise\.any['"]/,
  ],
  "String.prototype.replaceAll": [
    /\bString\.prototype\.replaceAll\s*=/,
    /['"]core-js\/modules\/es\.string\.replace-all['"]/,
  ],

  "Array.prototype.at": [
    /\bArray\.prototype\.at\s*=/,
    /['"]core-js\/modules\/es\.array\.at['"]/,
    /['"]core-js\/actual\/array\/at['"]/,
  ],
  "String.prototype.at": [
    /\bString\.prototype\.at\s*=/,
    /['"]core-js\/modules\/es\.string\.at['"]/,
    /['"]core-js\/actual\/string\/at['"]/,
  ],

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
    /['"]core-js\/actual\/array\/to-reversed['"]/,
    /['"]core-js\/stable\/array\/to-reversed['"]/,
    /(?:__webpack_require__\([^)]*core-js[^)]*to-reversed|core[-_]js[^/\n]*toReversed)/,
    /\bcore[-_]js[-_]modules[-_][^/\n]*to[-_]reversed/,
  ],
  "Array.prototype.toSorted": [
    /\bArray\.prototype\.toSorted\s*=/,
    /['"]core-js\/modules\/es\.array\.to-sorted['"]/,
    /['"]core-js\/actual\/array\/to-sorted['"]/,
    /['"]core-js\/stable\/array\/to-sorted['"]/,
    /__webpack_require__\([^)]*core-js\/modules\/es\.array\.to-sorted[^)]*\)/,
    /\bcore[-_]js[-_]modules[-_][^/\n]*to[-_]sorted/,
  ],
  "Array.prototype.toSpliced": [
    /\bArray\.prototype\.toSpliced\s*=/,
    /['"]core-js\/modules\/es\.array\.to-spliced['"]/,
    /['"]core-js\/actual\/array\/to-spliced['"]/,
  ],
  "Array.prototype.with": [
    /\bArray\.prototype\.with\s*=/,
    /['"]core-js\/modules\/es\.array\.with['"]/,
    /['"]core-js\/actual\/array\/with['"]/,
    /['"]core-js\/stable\/array\/with['"]/,
    /(?:__webpack_require__\([^)]*core-js[^)]*array[^)]*with|core[-_]js[^/\n]*array[-_]with)/,
    /\bcore[-_]js[-_]modules[-_][^/\n]*array[-_]with/,
  ],

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

  "Array.fromAsync": [
    /\bArray\.fromAsync\s*=/,
    /['"]core-js\/modules\/es\.array\.from-async['"]/,
    /['"]core-js\/actual\/array\/from-async['"]/,
  ],
  "Error.isError": [
    /\bError\.isError\s*=/,
    /['"]core-js\/modules\/es\.error\.is-error['"]/,
    /['"]core-js\/actual\/error\/is-error['"]/,
  ],
  "Intl.DurationFormat": [
    /\bIntl\.DurationFormat\s*=/,
    /['"]core-js\/modules\/es\.intl\.duration-format['"]/,
    /['"]@formatjs\/intl-durationformat['"]/,
  ],

  ArrayToSorted: [
    /\bArray\.prototype\.toSorted\s*=/,
    /['"]core-js\/modules\/es\.array\.to-sorted['"]/,
    /['"]core-js\/actual\/array\/to-sorted['"]/,
    /['"]core-js\/stable\/array\/to-sorted['"]/,
    /__webpack_require__\([^)]*core-js\/modules\/es\.array\.to-sorted[^)]*\)/,
    /\bcore[-_]js[-_]modules[-_]es[-_]array[-_]toSorted\b/,
  ],
  ArrayToReversed: [
    /\bArray\.prototype\.toReversed\s*=/,
    /['"]core-js\/modules\/es\.array\.to-reversed['"]/,
    /['"]core-js\/actual\/array\/to-reversed['"]/,
    /['"]core-js\/stable\/array\/to-reversed['"]/,
    /(?:__webpack_require__\([^)]*core-js[^)]*to-reversed|core[-_]js[^/\n]*toReversed)/,
    /\bcore[-_]js[-_]modules[-_][^/\n]*to[-_]reversed/,
  ],
  ArrayWith: [
    /\bArray\.prototype\.with\s*=/,
    /['"]core-js\/modules\/es\.array\.with['"]/,
    /['"]core-js\/actual\/array\/with['"]/,
    /['"]core-js\/stable\/array\/with['"]/,
    /(?:__webpack_require__\([^)]*core-js[^)]*array[^)]*with|core[-_]js[-_]array[-_]with)/,
    /\bcore[-_]js[-_]modules[-_][^/\n]*array[-_]with/,
  ],
};

module.exports = {
  POLYFILL_PATTERNS,
  IMPORT_PATTERNS,
  FEATURE_TO_POLYFILL_MAP,
};
