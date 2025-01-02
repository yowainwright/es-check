// utils.js

/**
 * Checks if node.kind === astInfo.kind (e.g., 'const', 'let').
 */
function checkVarKindMatch(node, astInfo) {
  if (!astInfo.kind) return false;
  return node.kind === astInfo.kind;
}

/**
 * Checks if a NewExpression node's callee is an Identifier
 * that matches astInfo.callee (e.g. "Promise", "WeakRef").
 */
function checkCalleeMatch(node, astInfo) {
  if (!astInfo.callee) return false;
  // e.g. node.callee.type === 'Identifier' && node.callee.name === 'Promise'
  if (!node.callee || node.callee.type !== 'Identifier') return false;
  return node.callee.name === astInfo.callee;
}

/**
 * Checks if a LogicalExpression node's operator matches astInfo.operator (e.g., '??').
 */
function checkOperatorMatch(node, astInfo) {
  if (!astInfo.operator) return false;
  return node.operator === astInfo.operator;
}

/**
 * For simple presence-based checks (e.g., ArrowFunctionExpression).
 */
function checkPresence() {
  return true;
}

/**
 * A more "universal" check for a CallExpression, used for many ES features:
 *   - arrayMethod => property: 'flat', 'includes', 'at', etc.
 *   - objectMethod => object: 'Object', property: 'fromEntries', etc.
 */
function checkCallExpression(node, astInfo) {
  // Must be `CallExpression`
  if (node.type !== 'CallExpression') return false;

  // We might check if node.callee is a MemberExpression, e.g. array.includes(...)
  // or if node.callee is an Identifier, e.g. Symbol(...).
  if (node.callee.type === 'MemberExpression') {
    const { object, property } = astInfo;
    // e.g. object: 'Object', property: 'entries'
    // => node.callee.object.name === 'Object' && node.callee.property.name === 'entries'
    if (object) {
      // Make sure node.callee.object is an Identifier with correct name
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
 * Check ObjectExpression for childType, e.g. 'SpreadElement'
 */
function checkObjectExpression(node, astInfo) {
  // If we want to detect object spread, we might check if node.properties
  // contain a SpreadElement
  if (astInfo.childType === 'SpreadElement') {
    return node.properties.some((p) => p.type === 'SpreadElement');
  }
  return false;
}

/**
 * Check ClassDeclaration presence or superClass usage
 */
function checkClassDeclaration(node, astInfo) {
  // Just having a ClassDeclaration means classes are used.
  // If astInfo has `property: 'superClass'`, it means "extends" usage
  if (astInfo.property === 'superClass') {
    return !!node.superClass; // if superClass is not null, "extends" is used
  }
  return true; // default: any ClassDeclaration means the feature is used
}

/**
 * Example check for BinaryExpression (e.g., exponent operator `**`).
 */
function checkBinaryExpression(node, astInfo) {
  if (!astInfo.operator) return false;
  return node.operator === astInfo.operator;
}

/**
 * Example check for ForAwaitStatement
 */
function checkForAwaitStatement(node) {
  // If we see a ForAwaitStatement at all, it's used (ES2018 async iteration)
  return true;
}

/**
 * Example check for CatchClause with no param => optional catch binding
 */
function checkCatchClause(node, astInfo) {
  if (astInfo.noParam) {
    // ES2019 optional catch binding => catch {}
    return !node.param;
  }
  return false;
}

/**
 * Example check for BigIntLiteral or numeric with underscore
 * (Acorn might parse BigInt as node.type === 'Literal' with a bigint property)
 */
function checkBigIntLiteral(node) {
  // Some Acorn versions: node.type === 'Literal' && typeof node.value === 'bigint'
  // Others: node.type === 'BigIntLiteral'
  // Adjust for your parser’s shape. We'll do a basic check:
  if (typeof node.value === 'bigint') {
    return true;
  }
  return false;
}

/**
 * A single "catch-all" object mapping node types to specialized checkers
 */
const checkMap = {
  // Existing from your snippet:
  VariableDeclaration: (node, astInfo) => checkVarKindMatch(node, astInfo),
  ArrowFunctionExpression: () => checkPresence(),
  ChainExpression: () => checkPresence(),
  LogicalExpression: (node, astInfo) => checkOperatorMatch(node, astInfo),
  NewExpression: (node, astInfo) => checkCalleeMatch(node, astInfo),

  // ** Added Node Types **

  // For "CallExpression": .includes, .flat, .at, etc.
  CallExpression: (node, astInfo) => checkCallExpression(node, astInfo),

  // For "ObjectExpression": object spread
  ObjectExpression: (node, astInfo) => checkObjectExpression(node, astInfo),

  // For "ClassDeclaration": classes, extends
  ClassDeclaration: (node, astInfo) => checkClassDeclaration(node, astInfo),

  // For "BinaryExpression": exponent operator, etc.
  BinaryExpression: (node, astInfo) => checkBinaryExpression(node, astInfo),

  // For "ForAwaitStatement": async iteration
  ForAwaitStatement: (node) => checkForAwaitStatement(node),

  // For "CatchClause": optional catch binding
  CatchClause: (node, astInfo) => checkCatchClause(node, astInfo),

  // For "Literal": numeric separators or bigints (depending on your parser)
  //   If your parser uses node.raw.includes('_'), it might detect numeric separators.
  //   For BigInt, you might check `typeof node.value === 'bigint'`.
  Literal: (node, astInfo) => {
    if (astInfo.nodeType === 'BigIntLiteral') {
      return checkBigIntLiteral(node);
    }
    // or if checking numeric separators
    // if (astInfo.nodeType === 'NumericLiteralWithSeparator' && node.raw.includes('_')) ...
    return false;
  },

  // Provide a default if the nodeType is not in this map
  default: () => false,
};

module.exports = {
  checkVarKindMatch,
  checkCalleeMatch,
  checkOperatorMatch,
  checkPresence,
  checkMap,
};
