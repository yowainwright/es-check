const assert = require('assert');
const detectFeatures = require('./detectFeatures');

describe('detectFeatures', () => {
  describe('Basic functionality', () => {
    it('should detect ES6 features', () => {
      const code = `
        const x = 1;
        let y = 2;
        class MyClass {}
        () => {};
      `;

      const { foundFeatures, unsupportedFeatures } = detectFeatures(code, 6, 'script', new Set());

      assert(Object.values(foundFeatures).some(Boolean), 'Should detect some ES6 features');
      assert.strictEqual(unsupportedFeatures.length, 0, 'No unsupported features for ES6');
    });

    it('should detect unsupported features for lower versions', () => {
      const code = `
        const x = 1;
        let y = 2;
      `;

      try {
        detectFeatures(code, 5, 'script', new Set());
        assert.fail('Should throw for ES5 with ES6 features');
      } catch (error) {
        assert(error, 'Should throw an error for ES6 features in ES5');
        assert(error.features && error.features.length > 0, 'Error should contain features property');
      }
    });

    it('should respect the ignoreList', () => {
      const code = `
        const x = 1;
        let y = 2;
      `;

      const ignoreList = new Set(['let', 'const']);

      try {
        const { unsupportedFeatures } = detectFeatures(code, 5, 'script', ignoreList);
        assert.strictEqual(unsupportedFeatures.length, 0, 'Should have no unsupported features when they are in ignoreList');
      } catch (error) {
        assert.fail('Should not throw when features are in ignoreList');
      }
    });
  });

  describe('detectPolyfills', () => {
    it('should detect polyfills when checkForPolyfills is enabled', () => {
      const code = `
        import 'core-js/modules/es.array.to-sorted';

        const arr = [3, 1, 2];
        const sorted = arr.toSorted();
      `;

      const options = { checkForPolyfills: true };

      try {
        const { unsupportedFeatures } = detectFeatures(code, 2020, 'module', new Set(), options);
        assert.strictEqual(unsupportedFeatures.length, 0, 'Should have no unsupported features when polyfills are detected');
      } catch (error) {
        assert.fail('Should not throw when polyfills are detected');
      }
    });

    it('should detect polyfill patterns in code', () => {
      const code = `
        if (!Array.prototype.toSorted) {
          Array.prototype.toSorted = function() {
            return [...this].sort();
          };
        }

        const arr = [3, 1, 2];
        const sorted = arr.toSorted();
      `;

      const options = { checkForPolyfills: true };

      try {
        const { unsupportedFeatures } = detectFeatures(code, 2020, 'script', new Set(), options);
        assert.strictEqual(unsupportedFeatures.length, 0, 'Should have no unsupported features when polyfills are detected');
      } catch (error) {
        assert.fail('Should not throw when polyfills are detected');
      }
    });
  });

  describe('Module handling', () => {
    it('should parse ES modules correctly', () => {
      const code = `
        import { foo } from './foo.js';
        export const bar = 1;
      `;

      const { foundFeatures } = detectFeatures(code, 6, 'module', new Set());
      assert(Object.values(foundFeatures).some(Boolean), 'Should detect some features in ES modules');
    });

    it('should throw for ES modules in script mode', () => {
      const code = `
        import { foo } from './foo.js';
        export const bar = 1;
      `;

      try {
        detectFeatures(code, 6, 'script', new Set());
        assert.fail('Should throw for ES modules in script mode');
      } catch (error) {
        assert(error, 'Should throw an error');
      }
    });
  });

  describe('Feature detection', () => {
    it('should not confuse console.group with ArrayGroup', () => {
      const code = `
        console.group('Test Group');
        console.log('Inside group');
        console.groupEnd();
      `;

      try {
        const { foundFeatures, unsupportedFeatures } = detectFeatures(code, 13, 'script', new Set());
        assert.strictEqual(unsupportedFeatures.length, 0, 'console.group should not be detected as ArrayGroup');
        assert.strictEqual(foundFeatures.ArrayGroup, false, 'ArrayGroup should not be detected for console.group');
      } catch (error) {
        assert.fail(`Should not throw for console.group in ES2022: ${error.message}`);
      }
    });

    it('should detect ES2020 features', () => {
      const code = `
        const obj = {
          prop: 1,
          method() {
            return this.prop;
          }
        };

        const value = obj?.prop;
        const nullish = null ?? 'default';
      `;
      const { foundFeatures } = detectFeatures(code, 2020, 'script', new Set());
      assert(Object.values(foundFeatures).some(Boolean), 'Should detect some ES2020 features');
    });

    it('should detect ES2021 features', () => {
      const code = `
        const str = 'hello';
        const replaced = str.replaceAll('l', 'x');
      `;
      const { foundFeatures } = detectFeatures(code, 2021, 'script', new Set());
      assert(Object.values(foundFeatures).some(Boolean), 'Should detect some ES2021 features');
    });

    it('should detect ES2022 features', () => {
      const code = `
        // Class with private fields (ES2022)
        class MyClass {
          #privateField = 1;

          getPrivate() {
            return this.#privateField;
          }
        }

        // Class fields (ES2022)
        class AnotherClass {
          publicField = 42;
          static staticField = 'static';
        }

        // Object.hasOwn (ES2022)
        function testHasOwn(obj, prop) {
          return Object.hasOwn(obj, prop);
        }

        // Error cause (ES2022)
        function testErrorCause() {
          try {
            throw new Error('Failed', { cause: 'Network error' });
          } catch (e) {
            return e.cause;
          }
        }
      `;

      const { foundFeatures } = detectFeatures(code, 2022, 'script', new Set());
      assert(Object.values(foundFeatures).some(Boolean), 'Should detect some ES2022 features');
    });
  });
});
