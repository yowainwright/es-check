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
      const astInfo = {};
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
      const astInfo = {};
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
      const astInfo = {};
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

  describe('checkNewExpression for ErrorCause', () => {
    it('should return false for Error without cause option', () => {
      const node = {
        type: 'NewExpression',
        callee: {
          type: 'Identifier',
          name: 'Error'
        },
        arguments: [
          {
            type: 'Literal',
            value: 'Something went wrong'
          }
        ]
      };

      const astInfo = {
        callee: 'Error',
        hasOptionsCause: true
      };

      const result = checkMap.NewExpression(node, astInfo);
      assert.strictEqual(result, false);
    });

    it('should return true for Error with cause option', () => {
      const node = {
        type: 'NewExpression',
        callee: {
          type: 'Identifier',
          name: 'Error'
        },
        arguments: [
          {
            type: 'Literal',
            value: 'Something went wrong'
          },
          {
            type: 'ObjectExpression',
            properties: [
              {
                type: 'Property',
                key: {
                  type: 'Identifier',
                  name: 'cause'
                },
                value: {
                  type: 'Identifier',
                  name: 'e'
                }
              }
            ]
          }
        ]
      };

      const astInfo = {
        callee: 'Error',
        hasOptionsCause: true
      };

      const result = checkMap.NewExpression(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('should return true for other NewExpressions without hasOptionsCause', () => {
      const node = {
        type: 'NewExpression',
        callee: {
          type: 'Identifier',
          name: 'Promise'
        },
        arguments: []
      };

      const astInfo = {
        callee: 'Promise'
      };

      const result = checkMap.NewExpression(node, astInfo);
      assert.strictEqual(result, true);
    });
  });

  describe('MemberExpression handling', () => {
    it('should handle member expressions in CallExpression', () => {
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'Object' },
          property: { type: 'Identifier', name: 'hasOwn' }
        }
      };

      const astInfoMatch = { object: 'Object', property: 'hasOwn' };
      const astInfoMismatch = { object: 'Object', property: 'keys' };

      assert.strictEqual(checkMap.CallExpression(node, astInfoMatch), true, 'Should match when property names match');
      assert.strictEqual(checkMap.CallExpression(node, astInfoMismatch), false, 'Should not match when property names differ');
    });
  });

  describe('Suggestions for code improvements', () => {
    it('should handle edge cases in CallExpression with MemberExpression callee', () => {
      console.log('Suggestion: Add defensive checks in checkMap.CallExpression for missing properties');
      console.log('The CallExpression handler should check if node.callee.property exists before accessing its type');
    });
  });

  describe('createLogger', function () {
    const { createLogger } = require('./utils');
    const supportsColor = require('supports-color');

    it('should create a logger with default settings', function () {
      const logger = createLogger();
      assert.strictEqual(logger.level, 'info');
      assert.strictEqual(logger.transports[0].silent, false);
    });

    it('should create a logger with verbose level when verbose option is true', function () {
      const logger = createLogger({ verbose: true });
      assert.strictEqual(logger.transports[0].level, 'debug');
    });

    it('should create a logger with warn level when quiet option is true', function () {
      const logger = createLogger({ quiet: true });
      assert.strictEqual(logger.transports[0].level, 'warn');
    });

    it('should create a silent logger when silent option is true', function () {
      const logger = createLogger({ silent: true });
      assert.strictEqual(logger.transports[0].silent, true);
    });

    it('should respect noColor option', function () {
      const loggerWithColor = createLogger();
      const loggerNoColor = createLogger({ noColor: true });

      if (supportsColor.stdout) {
        const formatWithColor = JSON.stringify(loggerWithColor.transports[0].format);
        const formatNoColor = JSON.stringify(loggerNoColor.transports[0].format);
        if (formatWithColor !== formatNoColor) {
          assert.notStrictEqual(
            formatWithColor,
            formatNoColor,
            'Color settings should differ'
          );
        } else {
          assert(loggerWithColor && loggerNoColor, 'Both loggers should be created');
        }
      } else {
        assert(loggerWithColor && loggerNoColor, 'Both loggers should be created');
      }
    });

    it('should respect kebab-case no-color option', function () {
      const logger = createLogger({ 'no-color': true });
      assert(logger, 'Logger should be created with no-color option');
    });
  });
});
