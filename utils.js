/**
 * @note Checks if node.kind === astInfo.kind (e.g., 'const', 'let').
 */
const checkVarKindMatch = (node, astInfo) => {
  if (!astInfo.kind) return false;
  return node.kind === astInfo.kind;
}

/**
 * @note Checks if a NewExpression node's callee is an Identifier
 * that matches astInfo.callee (e.g. "Promise", "WeakRef").
 */
const checkCalleeMatch = (node, astInfo) => {
  if (!astInfo.callee) return false;
  // e.g. node.callee.type === 'Identifier' && node.callee.name === 'Promise'
  if (!node.callee || node.callee.type !== 'Identifier') return false;
  return node.callee.name === astInfo.callee;
}

/**
 * @note Checks if a LogicalExpression node's operator matches astInfo.operator (e.g., '??').
 */
const checkOperatorMatch = (node, astInfo) =>{
  if (!astInfo.operator) return false;
  return node.operator === astInfo.operator;
}

/**
 * @note For simple presence-based checks (e.g., ArrowFunctionExpression).
 */
const checkDefault = () => {
  return true;
}

/**
 * @note A more "universal" check for a CallExpression, used for many ES features:
 *   - arrayMethod => property: 'flat', 'includes', 'at', etc.
 *   - objectMethod => object: 'Object', property: 'fromEntries', etc.
 */
const checkCallExpression = (node, astInfo) => {
  // Must be `CallExpression`
  if (node.type !== 'CallExpression') return false;

  // We might check if node.callee is a MemberExpression, e.g. array.includes(...)
  // or if node.callee is an Identifier, e.g. Symbol(...).
  if (node.callee.type === 'MemberExpression') {
    const { object, property } = astInfo;
    // e.g. object: 'Object', property: 'entries'
    // => node.callee.object.name === 'Object' && node.callee.property.name === 'entries'
    if (object) {
      if (
        !node.callee.object ||
        node.callee.object.type !== 'Identifier' ||
        node.callee.object.name !== object
      ) {
        return false;
      }
    }
    if (property) {
      // e.g. property: 'includes'
      if (!node.callee.property || node.callee.property.name !== property) {
        return false;
      }
    }
    return true;
  } else if (node.callee.type === 'Identifier') {
    // e.g. Symbol("desc")
    const { callee } = astInfo;
    // If astInfo.callee is "Symbol", check node.callee.name
    if (callee && node.callee.name === callee) {
      return true;
    }
  }

  return false;
}

/**
 * @note Check ObjectExpression for childType, e.g. 'SpreadElement'
 */
const checkObjectExpression = (node, astInfo) => {
  // If we want to detect object spread, we might check if node.properties
  // contain a SpreadElement
  if (astInfo.childType === 'SpreadElement') {
    return node.properties.some((p) => p.type === 'SpreadElement');
  }
  return false;
}

/**
 * @note Check ClassDeclaration presence or superClass usage
 */
const checkClassDeclaration = (node, astInfo) => {
  // Just having a ClassDeclaration means classes are used.
  // If astInfo has `property: 'superClass'`, it means "extends" usage
  if (astInfo.property === 'superClass') {
    return !!node.superClass; // if superClass is not null, "extends" is used
  }
  return true; // default: any ClassDeclaration means the feature is used
}

/**
 * @note Example check for BinaryExpression (e.g., exponent operator `**`).
 */
const checkBinaryExpression = (node, astInfo) => {
  if (!astInfo.operator) return false;
  return node.operator === astInfo.operator;
}

const checkForAwaitStatement = (node) => {
  return true;
}

/**
 * @note Example check for CatchClause with no param => optional catch binding
 */
const checkCatchClause = (node, astInfo) => {
  if (astInfo.noParam) {
    return !node.param;
  }
  return false;
}

/**
 * @note Example check for BigIntLiteral or numeric with underscore
 */
const checkBigIntLiteral = (node) =>{
  if (typeof node.value === 'bigint') {
    return true;
  }
  return false;
}

/**
 * @note the "catch-all" object mapping node types to specialized checkers
 */
const checkMap = {
  VariableDeclaration: (node, astInfo) => checkVarKindMatch(node, astInfo),
  ArrowFunctionExpression: () => checkDefault(),
  ChainExpression: () => checkDefault(),
  LogicalExpression: (node, astInfo) => checkOperatorMatch(node, astInfo),
  NewExpression: (node, astInfo) => checkCalleeMatch(node, astInfo),
  CallExpression: (node, astInfo) => checkCallExpression(node, astInfo),
  ObjectExpression: (node, astInfo) => checkObjectExpression(node, astInfo),
  ClassDeclaration: (node, astInfo) => checkClassDeclaration(node, astInfo),
  BinaryExpression: (node, astInfo) => checkBinaryExpression(node, astInfo),
  ForAwaitStatement: (node) => checkForAwaitStatement(node),
  CatchClause: (node, astInfo) => checkCatchClause(node, astInfo),
  Literal: (node, astInfo) => {
    if (astInfo.nodeType === 'BigIntLiteral') {
      return checkBigIntLiteral(node);
    }
    return false;
  },
  default: () => false,
};

module.exports = {
  checkVarKindMatch,
  checkCalleeMatch,
  checkOperatorMatch,
  checkDefault,
  checkMap,
};
