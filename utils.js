const fs = require('fs');

function parseIgnoreList(options) {
  let ignoreList = new Set();

  // Handle comma-separated CLI list
  if (options.ignore) {
    options.ignore.split(',').forEach(feature =>
      ignoreList.add(feature.trim())
    );
  }

  // Handle ignore file
  if (options.ignoreFile) {
    try {
      const fileContent = fs.readFileSync(options.ignoreFile, 'utf8');
      const ignoreConfig = JSON.parse(fileContent);

      if (Array.isArray(ignoreConfig.features)) {
        ignoreConfig.features.forEach(feature =>
          ignoreList.add(feature)
        );
      }
    } catch (err) {
      throw new Error(`Failed to parse ignore file: ${err.message}`);
    }
  }

  return ignoreList;
}

// Check if node.kind matches astInfo.kind
function checkVarKindMatch(node, astInfo) {
  if (!astInfo.kind) return false;
  return node.kind === astInfo.kind;
}

// Check if node.callee.name matches astInfo.callee
function checkCalleeMatch(node, astInfo) {
  if (!astInfo.callee) return false;
  if (!node.callee) return false;
  if (node.callee.type !== 'Identifier') return false;
  return node.callee.name === astInfo.callee;
}

// Check if node.operator matches astInfo.operator
function checkOperatorMatch(node, astInfo) {
  if (!astInfo.operator) return false;
  return node.operator === astInfo.operator;
}

// Default check function that always returns true
function checkDefault() {
  return true;
}

// Map of node types to check functions
const checkMap = {
  VariableDeclaration: checkVarKindMatch,
  LogicalExpression: checkOperatorMatch,
  ArrowFunctionExpression: checkDefault,
  CallExpression: (node, astInfo) => {
    // Handle member expressions (e.g., window.getElementById)
    if (node.callee.type === 'MemberExpression') {
      // If astInfo has object and property, check if they match
      if (astInfo.object && astInfo.property) {
        return (
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === astInfo.object &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === astInfo.property
        );
      }
      // If astInfo only has callee, it's not a match for a member expression
      return false;
    } else if (node.callee.type === 'Identifier') {
      // e.g. Symbol("desc")
      const { callee } = astInfo;
      // If astInfo.callee is "Symbol", check node.callee.name
      if (callee && node.callee.name === callee) {
        return true;
      }
    }
    return false;
  },
  default: () => false
};

module.exports = {
  parseIgnoreList,
  checkVarKindMatch,
  checkCalleeMatch,
  checkOperatorMatch,
  checkDefault,
  checkMap
};
