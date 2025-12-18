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

function checkMap(node, astInfo) {
  const hasKindMismatch = astInfo.kind && node.kind !== astInfo.kind;
  const hasOperatorMismatch =
    astInfo.operator && node.operator !== astInfo.operator;
  const hasCalleeMismatch =
    astInfo.callee && (!node.callee || node.callee.name !== astInfo.callee);

  const hasCalleeObject = node.callee?.object?.name === astInfo.object;
  const hasCalleeIdentifier =
    node.callee?.type === "Identifier" && node.callee?.name === astInfo.object;
  const hasPropertyMismatch =
    astInfo.property && node.callee?.property?.name !== astInfo.property;
  const hasPropertyMatch = node.callee?.property?.name === astInfo.property;
  const shouldExclude = astInfo.excludeObjects?.includes(
    node.callee?.object?.name,
  );

  // For object.property patterns (like RegExp.escape), require BOTH object AND property to match
  const needsObjectAndProperty = astInfo.object && astInfo.property;
  const hasObjectAndPropertyMatch =
    needsObjectAndProperty && hasCalleeObject && hasPropertyMatch;
  const hasObjectAndPropertyMismatch =
    needsObjectAndProperty && !(hasCalleeObject && hasPropertyMatch);

  const hasObjectPropertyMismatch =
    !needsObjectAndProperty && astInfo.object && hasCalleeObject && hasPropertyMismatch;
  const hasObjectButNoMatch =
    !needsObjectAndProperty && astInfo.object && !hasCalleeObject && !hasCalleeIdentifier;
  const hasPropertyWithoutMatch =
    astInfo.property && !astInfo.object && !hasPropertyMatch;
  const hasPropertyWithExclusion =
    astInfo.property && !astInfo.object && hasPropertyMatch && shouldExclude;

  // ErrorCause: require options argument with cause property
  const hasOptionsCauseMismatch =
    astInfo.hasOptionsCause && !hasOptionsCause(node);

  const hasMismatch =
    hasKindMismatch ||
    hasOperatorMismatch ||
    hasCalleeMismatch ||
    hasObjectPropertyMismatch ||
    hasObjectButNoMatch ||
    hasPropertyWithoutMatch ||
    hasPropertyWithExclusion ||
    hasObjectAndPropertyMismatch ||
    hasOptionsCauseMismatch;

  if (hasMismatch) return false;

  return true;
}

module.exports = {
  checkMap,
};
