function hasOptionsCause(node) {
  const args = node.arguments;
  if (!args || args.length < 2) return false;

  const optionsArg = args[1];
  if (optionsArg?.type !== "ObjectExpression") return false;

  return optionsArg.properties?.some(
    (prop) =>
      prop.type === "Property" &&
      prop.key?.type === "Identifier" &&
      prop.key?.name === "cause",
  );
}

function hasNumericArgument(node) {
  const args = node.arguments;
  const hasArgs = args && args.length === 1;
  if (!hasArgs) return false;

  const arg = args[0];
  const isNumericLiteral =
    arg.type === "Literal" && typeof arg.value === "number";

  const isUnaryExpression = arg.type === "UnaryExpression";
  const isNegationOperator = arg.operator === "-";
  const hasNumericLiteralArgument =
    arg.argument?.type === "Literal" && typeof arg.argument.value === "number";
  const isNegativeNumeric =
    isUnaryExpression && isNegationOperator && hasNumericLiteralArgument;

  return isNumericLiteral || isNegativeNumeric;
}

const ARRAY_LIKE_NAMES = new Set([
  "arr",
  "array",
  "list",
  "items",
  "values",
  "arguments",
]);

const ARRAY_CONSTRUCTOR_FUNCTIONS = new Set([
  "Array",
  "from",
  "of",
  "slice",
  "filter",
  "map",
  "concat",
]);

const ARRAY_METHODS = new Set([
  "slice",
  "filter",
  "map",
  "concat",
  "from",
  "of",
]);

const COMMON_NON_ARRAY_NAMES = new Set([
  "obj",
  "object",
  "foo",
  "bar",
  "baz",
  "data",
  "config",
  "options",
  "params",
  "props",
  "state",
  "item",
  "element",
  "node",
  "target",
  "source",
  "result",
  "response",
  "request",
  "payload",
  "model",
  "view",
  "controller",
  "service",
  "utils",
  "helpers",
  "custom",
]);
function isArrayExpression(calleeObject) {
  return calleeObject.type === "ArrayExpression";
}

function isArrayLikeIdentifier(calleeObject) {
  const isIdentifier = calleeObject.type === "Identifier";
  if (!isIdentifier) return false;

  const objectName = calleeObject.name.toLowerCase();

  const isCommonNonArrayName = COMMON_NON_ARRAY_NAMES.has(objectName);
  if (isCommonNonArrayName) return false;

  return ARRAY_LIKE_NAMES.has(objectName);
}

function isArrayConstructorCall(calleeObject) {
  const isCallExpression = calleeObject.type === "CallExpression";
  if (!isCallExpression) return false;

  const innerCallee = calleeObject.callee;
  const isIdentifierCallee = innerCallee?.type === "Identifier";
  const isMemberExpressionCallee = innerCallee?.type === "MemberExpression";

  if (isIdentifierCallee) {
    const functionName = innerCallee.name;
    return ARRAY_CONSTRUCTOR_FUNCTIONS.has(functionName);
  }

  if (isMemberExpressionCallee) {
    const innerProperty = innerCallee.property;
    const hasPropertyName = innerProperty?.name;
    const isArrayMethod =
      hasPropertyName && ARRAY_METHODS.has(innerProperty.name);
    return isArrayMethod;
  }

  return false;
}

function isArrayLikeCall(node) {
  const callee = node.callee;
  const calleeObject = callee?.object;
  const hasCalleeObject = calleeObject != null;

  if (!hasCalleeObject) return false;

  const isArrayExpr = isArrayExpression(calleeObject);
  const isArrayIdent = isArrayLikeIdentifier(calleeObject);
  const isArrayConstr = isArrayConstructorCall(calleeObject);
  const isArray = isArrayExpr || isArrayIdent || isArrayConstr;

  return isArray;
}

// ── Set-like call detection (mirrors Array-like approach) ──

const SET_LIKE_NAMES = new Set(["set", "sets", "seta", "setb", "set1", "set2"]);

/**
 * Words that start/end with "set" but are not Set instances.
 * Used as a blocklist when the broader startsWith/endsWith heuristic is active.
 */
const COMMON_NON_SET_NAMES = new Set([
  "settings",
  "setup",
  "setter",
  "setstate",
  "setvalue",
  "setdata",
  "setitem",
  "setinterval",
  "settimeout",
  "offset",
  "dataset",
  "reset",
  "asset",
  "charset",
  "onset",
  "subset",
  "mindset",
  "closet",
  "baseset",
]);

function isSetConstructorCall(calleeObject) {
  // new Set() or new Set([...])
  if (
    calleeObject.type === "NewExpression" &&
    calleeObject.callee?.name === "Set"
  ) {
    return true;
  }
  return false;
}

function isSetLikeIdentifier(calleeObject) {
  if (calleeObject.type !== "Identifier") return false;
  const name = calleeObject.name.toLowerCase();
  if (COMMON_NON_SET_NAMES.has(name)) return false;
  return (
    SET_LIKE_NAMES.has(name) || name.startsWith("set") || name.endsWith("set")
  );
}

function isSetLikeCall(node) {
  const calleeObject = node.callee?.object;
  if (!calleeObject) return false;

  return (
    isSetConstructorCall(calleeObject) || isSetLikeIdentifier(calleeObject)
  );
}

function checkMap(node, astInfo) {
  const callee = node.callee;
  const calleeObject = callee?.object;
  const calleeProperty = callee?.property;
  const calleeObjectName = calleeObject?.name;
  const calleePropertyName = calleeProperty?.name;

  const hasKindMismatch = astInfo.kind && node.kind !== astInfo.kind;
  const hasOperatorMismatch =
    astInfo.operator && node.operator !== astInfo.operator;
  const hasCalleeMismatch =
    astInfo.callee && (!callee || callee.name !== astInfo.callee);

  const hasCalleeObject = calleeObjectName === astInfo.object;
  const hasCalleeIdentifier =
    callee?.type === "Identifier" && callee?.name === astInfo.object;
  const hasPropertyMismatch =
    astInfo.property && calleePropertyName !== astInfo.property;
  const hasPropertyMatch = calleePropertyName === astInfo.property;
  const shouldExclude = astInfo.excludeObjects?.includes(calleeObjectName);

  const needsObjectAndProperty = astInfo.object && astInfo.property;
  const hasObjectAndPropertyMismatch =
    needsObjectAndProperty && !(hasCalleeObject && hasPropertyMatch);

  const hasObjectPropertyMismatch =
    !needsObjectAndProperty &&
    astInfo.object &&
    hasCalleeObject &&
    hasPropertyMismatch;
  const hasObjectButNoMatch =
    !needsObjectAndProperty &&
    astInfo.object &&
    !hasCalleeObject &&
    !hasCalleeIdentifier;
  const hasPropertyWithoutMatch =
    astInfo.property && !astInfo.object && !hasPropertyMatch;
  const hasPropertyWithExclusion =
    astInfo.property && !astInfo.object && hasPropertyMatch && shouldExclude;

  const hasOptionsCauseMismatch =
    astInfo.hasOptionsCause && !hasOptionsCause(node);

  const callerType = calleeObject?.type;
  const hasExcludedCallerType =
    astInfo.excludeCallerTypes?.includes(callerType);

  const hasNumericArgMismatch =
    astInfo.requireNumericArg && !hasNumericArgument(node);

  const hasArrayLikeCallMismatch =
    astInfo.requireArrayLikeCall && !isArrayLikeCall(node);

  const hasSetLikeCallMismatch =
    astInfo.requireSetLikeCall && !isSetLikeCall(node);

  const hasMismatch =
    hasKindMismatch ||
    hasOperatorMismatch ||
    hasCalleeMismatch ||
    hasObjectPropertyMismatch ||
    hasObjectButNoMatch ||
    hasPropertyWithoutMatch ||
    hasPropertyWithExclusion ||
    hasObjectAndPropertyMismatch ||
    hasOptionsCauseMismatch ||
    hasExcludedCallerType ||
    hasNumericArgMismatch ||
    hasArrayLikeCallMismatch ||
    hasSetLikeCallMismatch;

  if (hasMismatch) return false;

  return true;
}

module.exports = {
  checkMap,
};
