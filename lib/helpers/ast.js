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
  const basicMismatches =
    (astInfo.kind && node.kind !== astInfo.kind) ||
    (astInfo.operator && node.operator !== astInfo.operator) ||
    (astInfo.callee && (!node.callee || node.callee.name !== astInfo.callee));

  if (basicMismatches) return false;

  const hasCalleeObject = node.callee?.object?.name === astInfo.object;
  const hasCalleeIdentifier =
    node.callee?.type === "Identifier" && node.callee?.name === astInfo.object;
  const hasPropertyMatch = node.callee?.property?.name === astInfo.property;
  const shouldExclude = astInfo.excludeObjects?.includes(
    node.callee?.object?.name,
  );

  const needsObjectAndProperty = astInfo.object && astInfo.property;
  const objectAndPropertyMismatch =
    needsObjectAndProperty && !(hasCalleeObject && hasPropertyMatch);

  const objectOnlyMismatches =
    !needsObjectAndProperty &&
    astInfo.object &&
    ((hasCalleeObject && astInfo.property && !hasPropertyMatch) ||
     (!hasCalleeObject && !hasCalleeIdentifier));

  const propertyOnlyMismatches =
    astInfo.property &&
    !astInfo.object &&
    (!hasPropertyMatch || (hasPropertyMatch && shouldExclude));

  const specialMismatches =
    (astInfo.hasOptionsCause && !hasOptionsCause(node)) ||
    (astInfo.excludeCallerTypes?.includes(node.callee?.object?.type));

  const hasMismatch =
    objectAndPropertyMismatch ||
    objectOnlyMismatches ||
    propertyOnlyMismatches ||
    specialMismatches;

  return !hasMismatch;
}

module.exports = {
  checkMap,
};
