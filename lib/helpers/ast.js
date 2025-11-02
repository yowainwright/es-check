function checkMap(node, astInfo) {
  const hasKindMismatch = astInfo.kind && node.kind !== astInfo.kind;
  const hasOperatorMismatch = astInfo.operator && node.operator !== astInfo.operator;
  const hasCalleeMismatch = astInfo.callee && (!node.callee || node.callee.name !== astInfo.callee);

  const hasCalleeObject = node.callee?.object?.name === astInfo.object;
  const hasCalleeIdentifier = node.callee?.type === "Identifier" && node.callee?.name === astInfo.object;
  const hasPropertyMismatch = astInfo.property && node.callee?.property?.name !== astInfo.property;
  const hasPropertyMatch = node.callee?.property?.name === astInfo.property;
  const shouldExclude = astInfo.excludeObjects?.includes(node.callee?.object?.name);

  const hasObjectPropertyMismatch = astInfo.object && hasCalleeObject && hasPropertyMismatch;
  const hasObjectButNoMatch = astInfo.object && !hasCalleeObject && !hasCalleeIdentifier;
  const hasPropertyWithoutMatch = astInfo.property && !astInfo.object && !hasPropertyMatch;
  const hasPropertyWithExclusion = astInfo.property && !astInfo.object && hasPropertyMatch && shouldExclude;

  const hasMismatch = hasKindMismatch || hasOperatorMismatch || hasCalleeMismatch || hasObjectPropertyMismatch || hasObjectButNoMatch || hasPropertyWithoutMatch || hasPropertyWithExclusion;

  if (hasMismatch) return false;

  return true;
}

module.exports = {
  checkMap,
};
