function checkVarKindMatch(node, astInfo) {
  return node.kind === astInfo.kind;
}

function checkCalleeMatch(node, astInfo) {
  const callee = node.callee;
  if (callee && callee.name === astInfo.callee) {
    return true;
  }
  return false;
}

function checkOperatorMatch(node, astInfo) {
  return node.operator === astInfo.operator;
}

function checkDefault() {
  return true;
}

function checkMap(node, astInfo) {
  if (astInfo.kind && !checkVarKindMatch(node, astInfo)) {
    return false;
  }

  if (astInfo.operator && !checkOperatorMatch(node, astInfo)) {
    return false;
  }

  if (astInfo.callee && !checkCalleeMatch(node, astInfo)) {
    return false;
  }

  if (astInfo.object) {
    if (
      node.callee &&
      node.callee.object &&
      node.callee.object.name === astInfo.object
    ) {
      if (
        astInfo.property &&
        node.callee.property &&
        node.callee.property.name !== astInfo.property
      ) {
        return false;
      }
    } else if (
      node.callee &&
      node.callee.type === "Identifier" &&
      node.callee.name === astInfo.object
    ) {
      return true;
    } else {
      return false;
    }
  }

  if (astInfo.property && !astInfo.object) {
    if (
      node.callee &&
      node.callee.property &&
      node.callee.property.name === astInfo.property
    ) {
      if (
        astInfo.excludeObjects &&
        node.callee.object &&
        node.callee.object.name
      ) {
        return !astInfo.excludeObjects.includes(node.callee.object.name);
      }
      return true;
    }
    return false;
  }

  return true;
}

module.exports = {
  checkVarKindMatch,
  checkCalleeMatch,
  checkOperatorMatch,
  checkDefault,
  checkMap,
};
