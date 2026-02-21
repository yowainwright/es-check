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
  const isNumericLiteral = arg.type === "Literal" && typeof arg.value === "number";

  const isUnaryExpression = arg.type === "UnaryExpression";
  const isNegationOperator = arg.operator === "-";
  const hasNumericLiteralArgument =
    arg.argument?.type === "Literal" && typeof arg.argument.value === "number";
  const isNegativeNumeric =
    isUnaryExpression && isNegationOperator && hasNumericLiteralArgument;

  return isNumericLiteral || isNegativeNumeric;
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
    hasNumericArgMismatch;

  if (hasMismatch) return false;

  return true;
}

module.exports = {
  checkMap,
};
