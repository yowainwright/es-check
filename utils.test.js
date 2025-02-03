// test/checkFunctions.spec.js

const assert = require('assert');
const {
  checkVarKindMatch,
  checkCalleeMatch,
  checkOperatorMatch,
  checkDefault,
  checkMap,
} = require('./utils');

describe('Check Functions', function () {
  describe('checkVarKindMatch', function () {
    it('should return false if astInfo.kind is not provided', function () {
      const node = { kind: 'const' };
      const astInfo = {}; // no "kind"
      assert.strictEqual(checkVarKindMatch(node, astInfo), false);
    });

    it('should return true if node.kind equals astInfo.kind', function () {
      const node = { kind: 'const' };
      const astInfo = { kind: 'const' };
      assert.strictEqual(checkVarKindMatch(node, astInfo), true);
    });

    it('should return false if node.kind does not match astInfo.kind', function () {
      const node = { kind: 'let' };
      const astInfo = { kind: 'const' };
      assert.strictEqual(checkVarKindMatch(node, astInfo), false);
    });
  });

  describe('checkCalleeMatch', function () {
    it('should return false if astInfo.callee is not provided', function () {
      const node = {
        callee: { type: 'Identifier', name: 'Promise' },
      };
      const astInfo = {}; // no "callee"
      assert.strictEqual(checkCalleeMatch(node, astInfo), false);
    });

    it('should return false if node.callee is missing', function () {
      const node = {};
      const astInfo = { callee: 'Promise' };
      assert.strictEqual(checkCalleeMatch(node, astInfo), false);
    });

    it('should return false if node.callee.type !== "Identifier"', function () {
      const node = {
        callee: { type: 'MemberExpression', name: 'Promise' },
      };
      const astInfo = { callee: 'Promise' };
      assert.strictEqual(checkCalleeMatch(node, astInfo), false);
    });

    it('should return false if the callee name does not match astInfo.callee', function () {
      const node = {
        callee: { type: 'Identifier', name: 'WeakRef' },
      };
      const astInfo = { callee: 'Promise' };
      assert.strictEqual(checkCalleeMatch(node, astInfo), false);
    });

    it('should return true if callee name matches astInfo.callee', function () {
      const node = {
        callee: { type: 'Identifier', name: 'Promise' },
      };
      const astInfo = { callee: 'Promise' };
      assert.strictEqual(checkCalleeMatch(node, astInfo), true);
    });
  });

  describe('checkOperatorMatch', function () {
    it('should return false if astInfo.operator is not provided', function () {
      const node = { operator: '??' };
      const astInfo = {}; // no "operator"
      assert.strictEqual(checkOperatorMatch(node, astInfo), false);
    });

    it('should return false if node.operator does not match astInfo.operator', function () {
      const node = { operator: '**' };
      const astInfo = { operator: '??' };
      assert.strictEqual(checkOperatorMatch(node, astInfo), false);
    });

    it('should return true if node.operator matches astInfo.operator', function () {
      const node = { operator: '??' };
      const astInfo = { operator: '??' };
      assert.strictEqual(checkOperatorMatch(node, astInfo), true);
    });
  });

  describe('checkDefault', function () {
    it('should always return true', function () {
      assert.strictEqual(checkDefault(), true);
    });
  });

  describe('checkMap usage examples', function () {
    it('checkMap.VariableDeclaration should call checkVarKindMatch internally and return correct boolean', function () {
      const node = { kind: 'const' };
      const astInfo = { kind: 'const' };
      const result = checkMap.VariableDeclaration(node, astInfo);
      assert.strictEqual(result, true);

      const nodeMismatch = { kind: 'let' };
      const result2 = checkMap.VariableDeclaration(nodeMismatch, astInfo);
      assert.strictEqual(result2, false);
    });

    it('checkMap.LogicalExpression should call checkOperatorMatch internally', function () {
      const node = { operator: '??' };
      const astInfo = { operator: '??' };
      const result = checkMap.LogicalExpression(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('checkMap.ArrowFunctionExpression should call checkDefault internally', function () {
      const result = checkMap.ArrowFunctionExpression();
      assert.strictEqual(result, true);
    });

    it('checkMap.default should return false if node type is unsupported', function () {
      const result = checkMap.default();
      assert.strictEqual(result, false);
    });
  });

  describe('checkCallExpression', () => {
    const { checkMap } = require('./utils');
  
    it('correctly distinguishes between global calls and member expressions', () => {
      const symbolNode = {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'Symbol'
        }
      };
      
      const getElementNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: {
            type: 'Identifier',
            name: 'window'
          },
          property: {
            type: 'Identifier',
            name: 'getElementById'
          }
        }
      };
  
      assert.strictEqual(checkMap.CallExpression(symbolNode, { callee: 'Symbol' }), true);    
      assert.strictEqual(checkMap.CallExpression(getElementNode, { callee: 'getElementById' }), false);
      assert.strictEqual(checkMap.CallExpression(getElementNode, { 
        object: 'window',
        property: 'getElementById'
      }), true);
    });
  });

});
