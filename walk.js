const acorn = require('acorn');
const walk = require('acorn-walk');
const { ES_FEATURES } = require('./constants');

function detectFeatures(code, sourceType) {
  const ast = acorn.parse(code, {
    ecmaVersion: 'latest',
    sourceType,
  });

  const foundFeatures = {};
  for (const featureName of Object.keys(ES_FEATURES)) {
    foundFeatures[featureName] = false;
  }

  const visitors = {};

  for (const [featureName, { astInfo }] of Object.entries(ES_FEATURES)) {
    const { nodeType } = astInfo;

    if (!visitors[nodeType]) {
      visitors[nodeType] = function nodeVisitor(node) {};
      visitors[nodeType].checks = [];
    }

    visitors[nodeType].checks.push({ featureName, astInfo });
  }

  for (const nodeType of Object.keys(visitors)) {
    const originalVisitor = visitors[nodeType];

    visitors[nodeType] = function(node) {
      for (const { featureName, astInfo } of originalVisitor.checks) {
        switch (nodeType) {
          case 'VariableDeclaration': {
            if (astInfo.kind && node.kind === astInfo.kind) {
              foundFeatures[featureName] = true;
            }
            break;
          }
          case 'ArrowFunctionExpression': {
            foundFeatures[featureName] = true;
            break;
          }
          case 'ChainExpression': {
            foundFeatures[featureName] = true;
            break;
          }
          case 'LogicalExpression': {
            if (astInfo.operator && node.operator === astInfo.operator) {
              foundFeatures[featureName] = true;
            }
            break;
          }
          case 'NewExpression': {
            if (astInfo.callee && node.callee.type === 'Identifier') {
              if (node.callee.name === astInfo.callee) {
                foundFeatures[featureName] = true;
              }
            }
            break;
          }
          default:
            break;
        }
      }
    }
  }
  walk.simple(ast, visitors);
  return foundFeatures;
}
