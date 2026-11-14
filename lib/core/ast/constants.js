const { ES_GLOBAL_MIN_VERSION } = require("../../constants/es");

const FUNCTION_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
  "MethodDefinition",
]);

const FUNCTION_SCOPE_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

const GLOBAL_BUILTIN_NAMES = new Set(Object.keys(ES_GLOBAL_MIN_VERSION));

const DECLARATION_ID_PARENT_TYPES = new Set([
  "ClassDeclaration",
  "ClassExpression",
  "FunctionDeclaration",
  "FunctionExpression",
  "VariableDeclarator",
]);

const IMPORT_LOCAL_PARENT_TYPES = new Set([
  "ImportDefaultSpecifier",
  "ImportNamespaceSpecifier",
  "ImportSpecifier",
]);

const PROPERTY_KEY_PARENT_TYPES = new Set([
  "MethodDefinition",
  "Property",
  "PropertyDefinition",
  "ImportAttribute",
]);

const LABEL_PARENT_TYPES = new Set(["BreakStatement", "ContinueStatement", "LabeledStatement"]);

const RECEIVER_EXIT_TYPES = new Set([
  "ReturnStatement",
  "ThrowStatement",
  "BreakStatement",
  "ContinueStatement",
]);

const REGEXP_MODIFIER_PREFIXES = new Set(["i", "m", "s", "-"]);

const ITERATOR_RETURNING_HELPERS = new Set([
  "map",
  "filter",
  "take",
  "drop",
  "flatMap",
  "chunks",
  "windows",
]);

const ITERATOR_FACTORIES = new Set(["values", "keys", "entries"]);

const TYPED_ARRAY_RECEIVER_TYPES = new Set([
  "typedArray",
  "Int8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float16Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",
  "uint8Array",
]);

const ITERABLE_RECEIVER_TYPES = new Set(
  Array.from(TYPED_ARRAY_RECEIVER_TYPES).concat("array", "map", "set"),
);

const JSON_PARSE_AST_INFO = { object: "JSON", property: "parse" };

const STRING_RECEIVER_TYPES = new Set(["string", "emptyString", "nonemptyString", "boxedString"]);

const MAP_RECEIVER_TYPES = new Set(["map", "weakMap", "mapLike"]);

const ARRAY_RETURNING_METHODS = new Set([
  "sort",
  "reverse",
  "fill",
  "copyWithin",
  "splice",
  "map",
  "filter",
  "slice",
  "concat",
  "flat",
  "flatMap",
  "toReversed",
  "toSorted",
  "toSpliced",
  "with",
]);

const TYPED_ARRAY_RETURNING_METHODS = new Set([
  "map",
  "filter",
  "slice",
  "subarray",
  "toReversed",
  "toSorted",
  "with",
  "reverse",
  "sort",
  "fill",
  "copyWithin",
]);

const POSSIBLY_THROWING_TYPES = new Set([
  "CallExpression",
  "NewExpression",
  "MemberExpression",
  "AwaitExpression",
  "TaggedTemplateExpression",
  "BinaryExpression",
  "UnaryExpression",
  "AssignmentExpression",
  "UpdateExpression",
  "SpreadElement",
  "YieldExpression",
]);

const CHILD_KEYS = [
  "body",
  "declarations",
  "expression",
  "left",
  "right",
  "argument",
  "callee",
  "arguments",
  "object",
  "property",
  "properties",
  "elements",
  "params",
  "id",
  "init",
  "test",
  "consequent",
  "alternate",
  "cases",
  "discriminant",
  "block",
  "handler",
  "finalizer",
  "source",
  "options",
  "attributes",
  "specifiers",
  "declaration",
  "exported",
  "imported",
  "local",
  "key",
  "value",
  "superClass",
  "expressions",
  "tag",
  "quasi",
];

module.exports = {
  FUNCTION_TYPES,
  FUNCTION_SCOPE_TYPES,
  GLOBAL_BUILTIN_NAMES,
  DECLARATION_ID_PARENT_TYPES,
  IMPORT_LOCAL_PARENT_TYPES,
  PROPERTY_KEY_PARENT_TYPES,
  LABEL_PARENT_TYPES,
  RECEIVER_EXIT_TYPES,
  REGEXP_MODIFIER_PREFIXES,
  ITERATOR_RETURNING_HELPERS,
  ITERATOR_FACTORIES,
  TYPED_ARRAY_RECEIVER_TYPES,
  ITERABLE_RECEIVER_TYPES,
  JSON_PARSE_AST_INFO,
  STRING_RECEIVER_TYPES,
  MAP_RECEIVER_TYPES,
  ARRAY_RETURNING_METHODS,
  TYPED_ARRAY_RETURNING_METHODS,
  POSSIBLY_THROWING_TYPES,
  CHILD_KEYS,
};
