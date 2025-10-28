const { describe, it } = require('node:test');
const assert = require('node:assert');
const { checkVarKindMatch, checkCalleeMatch, checkOperatorMatch, checkDefault, checkMap } = require('../../../lib/helpers/ast.js');

describe('helpers/ast.js', () => {
  describe('checkVarKindMatch()', () => {
    it('should return true when kinds match', () => {
      const node = { kind: 'const' };
      const astInfo = { kind: 'const' };

      const result = checkVarKindMatch(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('should return false when kinds do not match', () => {
      const node = { kind: 'let' };
      const astInfo = { kind: 'const' };

      const result = checkVarKindMatch(node, astInfo);
      assert.strictEqual(result, false);
    });

    it('should handle var kind', () => {
      const node = { kind: 'var' };
      const astInfo = { kind: 'var' };

      const result = checkVarKindMatch(node, astInfo);
      assert.strictEqual(result, true);
    });
  });

  describe('checkCalleeMatch()', () => {
    it('should return true when callee names match', () => {
      const node = { callee: { name: 'require' } };
      const astInfo = { callee: 'require' };

      const result = checkCalleeMatch(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('should return false when callee names do not match', () => {
      const node = { callee: { name: 'import' } };
      const astInfo = { callee: 'require' };

      const result = checkCalleeMatch(node, astInfo);
      assert.strictEqual(result, false);
    });

    it('should return false when callee is missing', () => {
      const node = {};
      const astInfo = { callee: 'require' };

      const result = checkCalleeMatch(node, astInfo);
      assert.strictEqual(result, false);
    });

    it('should return false when callee has no name', () => {
      const node = { callee: {} };
      const astInfo = { callee: 'require' };

      const result = checkCalleeMatch(node, astInfo);
      assert.strictEqual(result, false);
    });
  });

  describe('checkOperatorMatch()', () => {
    it('should return true when operators match', () => {
      const node = { operator: '===' };
      const astInfo = { operator: '===' };

      const result = checkOperatorMatch(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('should return false when operators do not match', () => {
      const node = { operator: '==' };
      const astInfo = { operator: '===' };

      const result = checkOperatorMatch(node, astInfo);
      assert.strictEqual(result, false);
    });

    it('should handle spread operator', () => {
      const node = { operator: '...' };
      const astInfo = { operator: '...' };

      const result = checkOperatorMatch(node, astInfo);
      assert.strictEqual(result, true);
    });
  });

  describe('checkDefault()', () => {
    it('should always return true', () => {
      assert.strictEqual(checkDefault(), true);
    });

    it('should return true regardless of arguments', () => {
      assert.strictEqual(checkDefault({}, {}), true);
      assert.strictEqual(checkDefault(null, null), true);
      assert.strictEqual(checkDefault(undefined, undefined), true);
    });
  });

  describe('checkMap()', () => {
    it('should return true when no constraints are specified', () => {
      const node = {};
      const astInfo = {};

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('should check kind constraint', () => {
      const node = { kind: 'const' };
      const astInfo = { kind: 'const' };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('should fail when kind does not match', () => {
      const node = { kind: 'let' };
      const astInfo = { kind: 'const' };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    it('should check operator constraint', () => {
      const node = { operator: '===' };
      const astInfo = { operator: '===' };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('should fail when operator does not match', () => {
      const node = { operator: '==' };
      const astInfo = { operator: '===' };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    it('should check callee constraint', () => {
      const node = { callee: { name: 'require' } };
      const astInfo = { callee: 'require' };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('should fail when callee does not match', () => {
      const node = { callee: { name: 'import' } };
      const astInfo = { callee: 'require' };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    it('should check object constraint', () => {
      const node = {
        callee: {
          object: { name: 'Array' }
        }
      };
      const astInfo = { object: 'Array' };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('should check object and property constraints', () => {
      const node = {
        callee: {
          object: { name: 'Array' },
          property: { name: 'from' }
        }
      };
      const astInfo = { object: 'Array', property: 'from' };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('should fail when property does not match', () => {
      const node = {
        callee: {
          object: { name: 'Array' },
          property: { name: 'map' }
        }
      };
      const astInfo = { object: 'Array', property: 'from' };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    it('should handle Identifier type callee with object constraint', () => {
      const node = {
        callee: {
          type: 'Identifier',
          name: 'Array'
        }
      };
      const astInfo = { object: 'Array' };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('should check property without object', () => {
      const node = {
        callee: {
          property: { name: 'includes' }
        }
      };
      const astInfo = { property: 'includes' };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('should exclude objects when specified', () => {
      const node = {
        callee: {
          object: { name: 'String' },
          property: { name: 'includes' }
        }
      };
      const astInfo = {
        property: 'includes',
        excludeObjects: ['String']
      };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, false);
    });

    it('should pass when object is not in exclude list', () => {
      const node = {
        callee: {
          object: { name: 'Array' },
          property: { name: 'includes' }
        }
      };
      const astInfo = {
        property: 'includes',
        excludeObjects: ['String']
      };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });

    it('should handle multiple constraints', () => {
      const node = {
        kind: 'const',
        operator: '===',
        callee: { name: 'require' }
      };
      const astInfo = {
        kind: 'const',
        operator: '===',
        callee: 'require'
      };

      const result = checkMap(node, astInfo);
      assert.strictEqual(result, true);
    });
  });
});
