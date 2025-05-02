const fs = require('fs');

/**
 * Parse ignore list from options
 * @param {Object} options - Options object
 * @param {string} [options.ignore] - Comma-separated list of features to ignore
 * @param {string} [options.ignoreFile] - Path to JSON file containing features to ignore
 * @returns {Set<string>} Set of features to ignore
 */
function parseIgnoreList(options) {
  // Handle case where options is undefined or null
  if (!options) {
    return new Set();
  }

  const ignoreList = new Set();

  // Handle comma-separated CLI list
  if (options.ignore) {
    // Early return if ignore is empty
    if (options.ignore.trim() === '') {
      return ignoreList;
    }

    options.ignore.split(',').forEach(feature => {
      const trimmed = feature.trim();
      if (trimmed) {
        ignoreList.add(trimmed);
      }
    });
  }

  // Handle allowList (features to allow even in lower ES versions)
  if (options.allowList) {
    // Early return if allowList is empty
    if (options.allowList.trim() === '') {
      return ignoreList;
    }

    options.allowList.split(',').forEach(feature => {
      const trimmed = feature.trim();
      if (trimmed) {
        ignoreList.add(trimmed);
      }
    });
  }

  // Get ignoreFile from either camelCase or kebab-case option
  const ignoreFilePath = options.ignoreFile || options['ignore-file'];

  // If no ignore file is specified, return early with what we have
  if (!ignoreFilePath) {
    return ignoreList;
  }

  // Handle ignore file
  try {
    // Check if file exists
    if (!fs.existsSync(ignoreFilePath)) {
      throw new Error(`Ignore file not found: ${ignoreFilePath}`);
    }

    const fileContent = fs.readFileSync(ignoreFilePath, 'utf8');

    // Early return if file is empty
    if (!fileContent.trim()) {
      return ignoreList;
    }

    const ignoreConfig = JSON.parse(fileContent);

    if (!ignoreConfig) {
      return ignoreList;
    }

    if (Array.isArray(ignoreConfig.features)) {
      ignoreConfig.features.forEach(feature => {
        if (feature && typeof feature === 'string') {
          ignoreList.add(feature.trim());
        }
      });
    }
  } catch (err) {
    throw new Error(`Failed to parse ignore file: ${err.message}`);
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
  NewExpression: (node, astInfo) => {
    if (!astInfo.callee) {
      return false;
    }
    // e.g. node.callee.type === 'Identifier' && node.callee.name === 'Promise'
    if (!node.callee || node.callee.type !== 'Identifier') {
      return false;
    }

    if (node.callee.name !== astInfo.callee) {
      return false;
    }

    if (astInfo.hasOptionsCause) {
      if (!node.arguments || node.arguments.length < 2) {
        return false;
      }

      const secondArg = node.arguments[1];
      if (secondArg.type !== 'ObjectExpression') {
        return false;
      }

      return secondArg.properties.some(prop =>
        prop.key &&
        prop.key.type === 'Identifier' &&
        prop.key.name === 'cause'
      );
    }

    return true;
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
