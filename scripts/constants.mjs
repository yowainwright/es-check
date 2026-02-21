export const ES_VERSION_TO_YEAR = {
  5: 2009,
  6: 2015,
  7: 2016,
  8: 2017,
  9: 2018,
  10: 2019,
  11: 2020,
  12: 2021,
  13: 2022,
  14: 2023,
  15: 2024,
  16: 2025,
  17: 2026,
};

export const CHROME_TO_ES = {
  46: 6,
  55: 7,
  58: 8,
  60: 9,
  75: 10,
  80: 11,
  85: 12,
  93: 13,
  97: 14,
  117: 15,
  136: 16,
  150: 17,
};

export const FEATURE_MDN_MAPPING = {
  ObjectSpread: "javascript.operators.spread.spread_in_object_literals",
  SpreadInArrays: "javascript.operators.spread.spread_in_arrays",
  OptionalChaining: "javascript.operators.optional_chaining",
  NullishCoalescing: "javascript.operators.nullish_coalescing",
  LogicalAssignment: "javascript.operators.logical_and_assignment",
  LogicalAssignmentOr: "javascript.operators.logical_or_assignment",
  LogicalAssignmentNullish:
    "javascript.operators.nullish_coalescing_assignment",
  PrivateFields: "javascript.classes.private_class_fields",
  StaticInitializationBlocks: "javascript.classes.static.initialization_blocks",
  TopLevelAwait: "javascript.operators.await.top_level",
  BigInt: "javascript.builtins.BigInt",
  NumericSeparators: "javascript.grammar.numeric_separators",
};

export const CHILD_FEATURES = {
  "es.promise": ["PromiseResolve", "PromiseReject"],
  "es.array.includes": ["ArrayPrototypeIncludes"],
  "es.array.at": ["ArrayPrototypeAt"],
};

export const SPECIAL_CASES = {
  "es.global-this": "globalThis",
};

export const SEGMENT_REPLACEMENTS = {
  regexp: "RegExp",
  "array-buffer": "ArrayBuffer",
  "weak-ref": "WeakRef",
  "weak-map": "WeakMap",
  "weak-set": "WeakSet",
  "global-this": "GlobalThis",
  int8: "Int8",
  int16: "Int16",
  int32: "Int32",
  uint8: "Uint8",
  uint16: "Uint16",
  uint32: "Uint32",
  float16: "Float16",
  float32: "Float32",
  float64: "Float64",
  bigint: "BigInt",
};
