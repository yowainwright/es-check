const { describe, it } = require('node:test');
const assert = require('node:assert');
const { getTargetVersion, parseCode, parseLightMode } = require('../../../lib/helpers/parsers.js');

describe('helpers/parsers.js', () => {
  describe('getTargetVersion()', () => {
    it('should normalize es3 to es5', () => {
      const result = getTargetVersion('es3');
      assert.strictEqual(result, 'es5');
    });

    it('should keep es5 as es5', () => {
      const result = getTargetVersion('es5');
      assert.strictEqual(result, 'es5');
    });

    it('should convert es6 to es2015', () => {
      const result = getTargetVersion('es6');
      assert.strictEqual(result, 'es2015');
    });

    it('should keep es2015 as es2015', () => {
      const result = getTargetVersion('es2015');
      assert.strictEqual(result, 'es2015');
    });

    it('should keep es2020 as es2020', () => {
      const result = getTargetVersion('es2020');
      assert.strictEqual(result, 'es2020');
    });

    it('should normalize numeric versions', () => {
      const result = getTargetVersion('5');
      assert.strictEqual(result, 'es5');
    });

    it('should handle latest version', () => {
      const result = getTargetVersion('latest');
      assert.strictEqual(typeof result, 'string');
      assert(result.startsWith('es'));
    });
  });

  describe('parseCode()', () => {
    it('should parse valid code with acorn', () => {
      const acorn = require('acorn');
      const code = 'var x = 5;';
      const result = parseCode(code, { ecmaVersion: 5 }, acorn, 'test.js');

      assert.strictEqual(result.error, null);
      assert(result.ast);
      assert.strictEqual(result.ast.type, 'Program');
    });

    it('should return error for invalid syntax', () => {
      const acorn = require('acorn');
      const code = 'var x = ;';
      const result = parseCode(code, { ecmaVersion: 5 }, acorn, 'test.js');

      assert(result.error);
      assert.strictEqual(result.ast, null);
    });
  });

  describe('parseLightMode()', () => {
    it('should pass valid ES5 code in light mode', () => {
      const code = 'var x = 5; function foo() { return x; }';
      const result = parseLightMode(code, 'es5', false, false, 'test.js');

      assert.strictEqual(result.error, null);
    });

    it('should detect ES6 syntax in ES5 light mode', () => {
      const code = 'const x = 5;';
      const result = parseLightMode(code, 'es5', false, false, 'test.js');

      assert(result.error);
      assert(result.error.err);
      assert.strictEqual(result.error.file, 'test.js');
    });

    it('should detect arrow functions in ES5 light mode', () => {
      const code = 'const fn = () => {};';
      const result = parseLightMode(code, 'es5', false, false, 'test.js');

      assert(result.error);
      assert.strictEqual(result.error.file, 'test.js');
    });

    it('should detect template literals in ES5 light mode', () => {
      const code = 'var str = `hello ${world}`;';
      const result = parseLightMode(code, 'es5', false, false, 'test.js');

      assert(result.error);
      assert.strictEqual(result.error.file, 'test.js');
    });

    it('should pass ES6 code in ES6 light mode', () => {
      const code = 'const x = 5; let y = () => {};';
      const result = parseLightMode(code, 'es6', false, false, 'test.js');

      assert.strictEqual(result.error, null);
    });

    it('should handle hashbang in light mode when allowed', () => {
      const code = '#!/usr/bin/env node\nvar x = 5;';
      const result = parseLightMode(code, 'es5', false, true, 'test.js');

      assert.strictEqual(result.error, null);
    });

    it('should handle ES modules in light mode when allowed', () => {
      const code = 'import fs from "fs";';
      const result = parseLightMode(code, 'es6', true, false, 'test.js');

      assert.strictEqual(result.error, null);
    });
  });
});
