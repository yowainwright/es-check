// https://github.com/zloirock/core-js/tree/master/packages/core-js-compat#additional-api
const FEATURE_CORE_JS_MODULES = {
  DisposableStack: "es.disposable-stack.constructor",
  AsyncDisposableStack: "es.async-disposable-stack.constructor",
  SuppressedError: "es.suppressed-error.constructor",
  SymbolDispose: "es.symbol.dispose",
  SymbolAsyncDispose: "es.symbol.async-dispose",
  IteratorZip: "es.iterator.zip",
  IteratorZipKeyed: "es.iterator.zip-keyed",
  IteratorChunks: "es.iterator.chunks",
  IteratorWindows: "es.iterator.windows",
  IteratorIncludes: "es.iterator.includes",
  IteratorJoin: "es.iterator.join",
  JSONParseSource: "es.json.parse",
  IteratorFrom: "es.iterator.from",
  IteratorMap: "es.iterator.map",
  IteratorFilter: "es.iterator.filter",
  IteratorTake: "es.iterator.take",
  IteratorDrop: "es.iterator.drop",
  IteratorFlatMap: "es.iterator.flat-map",
  IteratorReduce: "es.iterator.reduce",
  IteratorToArray: "es.iterator.to-array",
  IteratorForEach: "es.iterator.for-each",
  IteratorSome: "es.iterator.some",
  IteratorEvery: "es.iterator.every",
  IteratorFind: "es.iterator.find",
  AggregateError: "es.aggregate-error",
  ArrayBufferTransfer: "es.array-buffer.transfer",
  ArrayBufferTransferToFixedLength: "es.array-buffer.transfer-to-fixed-length",
  ArrayFindLast: "es.array.find-last",
  ArrayFindLastIndex: "es.array.find-last-index",
  ArrayFlat: "es.array.flat",
  ArrayFlatMap: "es.array.flat-map",
  ArrayFromAsync: "es.array.from-async",
  ArrayPrototypeAt: "es.array.at",
  ArrayPrototypeIncludes: "es.array.includes",
  ArrayToReversed: "es.array.to-reversed",
  ArrayToSorted: "es.array.to-sorted",
  ArrayToSpliced: "es.array.to-spliced",
  ArrayWith: "es.array.with",
  DataView: "es.data-view",
  DataViewGetFloat16: "es.data-view.get-float16",
  DataViewSetFloat16: "es.data-view.set-float16",
  ErrorCause: "es.error.cause",
  ErrorIsError: "es.error.is-error",
  Iterator: "es.iterator.constructor",
  IteratorConcat: "es.iterator.concat",
  JSONIsRawJSON: "es.json.is-raw-json",
  JSONRawJSON: "es.json.raw-json",
  Map: "es.map",
  MapGetOrInsert: ["es.map.get-or-insert", "es.weak-map.get-or-insert"],
  MapGetOrInsertComputed: ["es.map.get-or-insert-computed", "es.weak-map.get-or-insert-computed"],
  MapGroupBy: "es.map.group-by",
  MathSumPrecise: "es.math.sum-precise",
  ObjectEntries: "es.object.entries",
  ObjectFromEntries: "es.object.from-entries",
  ObjectGroupBy: "es.object.group-by",
  ObjectHasOwn: "es.object.has-own",
  ObjectValues: "es.object.values",
  Promise: "es.promise",
  PromiseAllSettled: "es.promise.all-settled",
  PromiseAny: "es.promise.any",
  PromiseFinally: "es.promise.finally",
  PromiseReject: "es.promise",
  PromiseResolve: "es.promise",
  PromiseTry: "es.promise.try",
  PromiseWithResolvers: "es.promise.with-resolvers",
  RegExpEscape: "es.regexp.escape",
  Set: "es.set",
  SetDifference: "es.set.difference.v2",
  SetIntersection: "es.set.intersection.v2",
  SetIsDisjointFrom: "es.set.is-disjoint-from.v2",
  SetIsSubsetOf: "es.set.is-subset-of.v2",
  SetIsSupersetOf: "es.set.is-superset-of.v2",
  SetSymmetricDifference: "es.set.symmetric-difference.v2",
  SetUnion: "es.set.union.v2",
  StringIsWellFormed: "es.string.is-well-formed",
  StringMatchAll: "es.string.match-all",
  StringPadEnd: "es.string.pad-end",
  StringPadStart: "es.string.pad-start",
  StringReplaceAll: "es.string.replace-all",
  StringToWellFormed: "es.string.to-well-formed",
  Symbol: "es.symbol",
  Uint8ArrayFromBase64: "es.uint8-array.from-base64",
  Uint8ArrayFromHex: "es.uint8-array.from-hex",
  Uint8ArraySetFromBase64: "es.uint8-array.set-from-base64",
  Uint8ArraySetFromHex: "es.uint8-array.set-from-hex",
  Uint8ArrayToBase64: "es.uint8-array.to-base64",
  Uint8ArrayToHex: "es.uint8-array.to-hex",
  WeakMap: "es.weak-map",
  WeakSet: "es.weak-set",
  globalThis: "es.global-this",
};

const coreJsFeatures = Object.keys(FEATURE_CORE_JS_MODULES).sort();
const POLYFILLABLE_FEATURES = new Set(coreJsFeatures);
const CORE_JS_POLYFILLABLE = POLYFILLABLE_FEATURES;

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
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.disposable-stack\.constructor(?:\.js)?['"]/,
    feature: "DisposableStack",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.async-disposable-stack\.constructor(?:\.js)?['"]/,
    feature: "AsyncDisposableStack",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.suppressed-error\.constructor(?:\.js)?['"]/,
    feature: "SuppressedError",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.symbol\.dispose(?:\.js)?['"]/,
    feature: "SymbolDispose",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.symbol\.async-dispose(?:\.js)?['"]/,
    feature: "SymbolAsyncDispose",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.zip(?:\.js)?['"]/,
    feature: "IteratorZip",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.zip-keyed(?:\.js)?['"]/,
    feature: "IteratorZipKeyed",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.chunks(?:\.js)?['"]/,
    feature: "IteratorChunks",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.windows(?:\.js)?['"]/,
    feature: "IteratorWindows",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.includes(?:\.js)?['"]/,
    feature: "IteratorIncludes",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.join(?:\.js)?['"]/,
    feature: "IteratorJoin",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.json\.parse(?:\.js)?['"]/,
    feature: "JSONParseSource",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.array\.from-async(?:\.js)?['"]/,
    feature: "ArrayFromAsync",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.error\.is-error(?:\.js)?['"]/,
    feature: "ErrorIsError",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.concat(?:\.js)?['"]/,
    feature: "IteratorConcat",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.json\.raw-json(?:\.js)?['"]/,
    feature: "JSONRawJSON",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.json\.is-raw-json(?:\.js)?['"]/,
    feature: "JSONIsRawJSON",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.math\.sum-precise(?:\.js)?['"]/,
    feature: "MathSumPrecise",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.uint8-array\.from-base64(?:\.js)?['"]/,
    feature: "Uint8ArrayFromBase64",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.uint8-array\.from-hex(?:\.js)?['"]/,
    feature: "Uint8ArrayFromHex",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.uint8-array\.to-base64(?:\.js)?['"]/,
    feature: "Uint8ArrayToBase64",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.uint8-array\.to-hex(?:\.js)?['"]/,
    feature: "Uint8ArrayToHex",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.uint8-array\.set-from-base64(?:\.js)?['"]/,
    feature: "Uint8ArraySetFromBase64",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.uint8-array\.set-from-hex(?:\.js)?['"]/,
    feature: "Uint8ArraySetFromHex",
  },
  {
    pattern: [
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.map\.get-or-insert(?:\.js)?['"]/,
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.weak-map\.get-or-insert(?:\.js)?['"]/,
    ],
    feature: "MapGetOrInsert",
  },
  {
    pattern: [
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.map\.get-or-insert-computed(?:\.js)?['"]/,
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.weak-map\.get-or-insert-computed(?:\.js)?['"]/,
    ],
    feature: "MapGetOrInsertComputed",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.constructor(?:\.js)?['"]/,
    feature: "Iterator",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.from(?:\.js)?['"]/,
    feature: "IteratorFrom",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.map(?:\.js)?['"]/,
    feature: "IteratorMap",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.filter(?:\.js)?['"]/,
    feature: "IteratorFilter",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.take(?:\.js)?['"]/,
    feature: "IteratorTake",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.drop(?:\.js)?['"]/,
    feature: "IteratorDrop",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.flat-map(?:\.js)?['"]/,
    feature: "IteratorFlatMap",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.reduce(?:\.js)?['"]/,
    feature: "IteratorReduce",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.to-array(?:\.js)?['"]/,
    feature: "IteratorToArray",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.for-each(?:\.js)?['"]/,
    feature: "IteratorForEach",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.some(?:\.js)?['"]/,
    feature: "IteratorSome",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.every(?:\.js)?['"]/,
    feature: "IteratorEvery",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.find(?:\.js)?['"]/,
    feature: "IteratorFind",
  },
  {
    pattern: /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.array\.to-sorted['"]/,
    feature: "ArrayToSorted",
  },
  {
    pattern: /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.array\.find-last['"]/,
    feature: "ArrayFindLast",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.array\.find-last-index['"]/,
    feature: "ArrayFindLastIndex",
  },
  {
    pattern: /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.array\.at['"]/,
    feature: "ArrayAt",
  },
  {
    pattern:
      /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.string\.replace-all['"]/,
    feature: "StringReplaceAll",
  },
  {
    pattern: /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.string\.match-all['"]/,
    feature: "StringMatchAll",
  },
  {
    pattern: /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.string\.at['"]/,
    feature: "StringAt",
  },
  {
    pattern: /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.object\.has-own['"]/,
    feature: "ObjectHasOwn",
  },
  {
    pattern: /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.promise\.any['"]/,
    feature: "PromiseAny",
  },
  {
    pattern: /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.regexp\.exec['"]/,
    feature: "RegExpExec",
  },
  {
    pattern: /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.global-this['"]/,
    feature: "GlobalThis",
  },
];

const FEATURE_TO_POLYFILL_MAP = {
  JSONParseSource: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.json\.parse(?:\.js)?['"]/,
  ],
  Iterator: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.constructor(?:\.js)?['"]/,
  ],
  IteratorFrom: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.from(?:\.js)?['"]/,
  ],
  IteratorMap: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.map(?:\.js)?['"]/,
  ],
  IteratorFilter: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.filter(?:\.js)?['"]/,
  ],
  IteratorTake: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.take(?:\.js)?['"]/,
  ],
  IteratorDrop: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.drop(?:\.js)?['"]/,
  ],
  IteratorFlatMap: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.flat-map(?:\.js)?['"]/,
  ],
  IteratorReduce: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.reduce(?:\.js)?['"]/,
  ],
  IteratorToArray: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.to-array(?:\.js)?['"]/,
  ],
  IteratorForEach: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.for-each(?:\.js)?['"]/,
  ],
  IteratorSome: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.some(?:\.js)?['"]/,
  ],
  IteratorEvery: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.every(?:\.js)?['"]/,
  ],
  IteratorFind: [
    /(?:from\s+|require\s*\(\s*|import\s+)['"]core-js\/modules\/es\.iterator\.find(?:\.js)?['"]/,
  ],
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
  Promise: [/\bPromise\s*=/, /['"]core-js\/modules\/es\.promise['"]/, /es6-promise/],
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

  "Object.values": [/\bObject\.values\s*=/, /['"]core-js\/modules\/es\.object\.values['"]/],
  "Object.entries": [/\bObject\.entries\s*=/, /['"]core-js\/modules\/es\.object\.entries['"]/],
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

  "Promise.any": [/\bPromise\.any\s*=/, /['"]core-js\/modules\/es\.promise\.any['"]/],
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

  "Object.hasOwn": [/\bObject\.hasOwn\s*=/, /['"]core-js\/modules\/es\.object\.has-own['"]/],
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
  "Promise.try": [/\bPromise\.try\s*=/, /['"]core-js\/modules\/es\.promise\.try['"]/],

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
  FEATURE_CORE_JS_MODULES,
  POLYFILLABLE_FEATURES,
  CORE_JS_POLYFILLABLE,
  POLYFILL_PATTERNS,
  IMPORT_PATTERNS,
  FEATURE_TO_POLYFILL_MAP,
};
