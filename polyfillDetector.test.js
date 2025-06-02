const assert = require('assert');
const { detectPolyfills, filterPolyfilled } = require('./polyfillDetector');

describe('Polyfill Detection', () => {
  describe('detectPolyfills', () => {
    it('should detect core-js polyfills', () => {
      const code = `
        import 'core-js/modules/es.array.to-sorted';
        import 'core-js/modules/es.object.has-own';
        
        const arr = [3, 1, 2];
        const sorted = arr.toSorted();
        const hasOwn = Object.hasOwn({}, 'prop');
      `;
      
      const polyfills = detectPolyfills(code);
      assert(polyfills.has('ArrayToSorted'), 'Should detect Array.prototype.toSorted polyfill');
      assert(polyfills.has('ObjectHasOwn'), 'Should detect Object.hasOwn polyfill');
    });
    
    it('should detect polyfill patterns in code', () => {
      const code = `
        // Polyfill for Array.prototype.toSorted
        if (!Array.prototype.toSorted) {
          Array.prototype.toSorted = function() {
            return [...this].sort();
          };
        }
        
        // Usage
        const arr = [3, 1, 2];
        const sorted = arr.toSorted();
      `;
      
      const polyfills = detectPolyfills(code);
      assert(polyfills.has('ArrayToSorted'), 'Should detect Array.prototype.toSorted polyfill');
    });
    
    it('should not detect anything in regular code', () => {
      const code = `
        // Regular ES5 code
        var arr = [3, 1, 2];
        var sorted = arr.slice().sort();
      `;
      
      const polyfills = detectPolyfills(code);
      assert.strictEqual(polyfills.size, 0, 'Should not detect any polyfills in regular code');
    });
  });
  
  describe('filterPolyfilled', () => {
    it('should filter out polyfilled features', () => {
      const unsupportedFeatures = ['ArrayToSorted', 'ObjectHasOwn', 'StringReplaceAll'];
      const polyfills = new Set(['ArrayToSorted', 'ObjectHasOwn']);
      
      const filtered = filterPolyfilled(unsupportedFeatures, polyfills);
      assert.deepStrictEqual(filtered, ['StringReplaceAll'], 'Should filter out polyfilled features');
    });
    
    it('should return all features if no polyfills', () => {
      const unsupportedFeatures = ['ArrayToSorted', 'ObjectHasOwn'];
      const polyfills = new Set();
      
      const filtered = filterPolyfilled(unsupportedFeatures, polyfills);
      assert.deepStrictEqual(filtered, unsupportedFeatures, 'Should return all features if no polyfills');
    });
    
    it('should handle empty unsupported features', () => {
      const unsupportedFeatures = [];
      const polyfills = new Set(['ArrayToSorted']);
      
      const filtered = filterPolyfilled(unsupportedFeatures, polyfills);
      assert.deepStrictEqual(filtered, [], 'Should handle empty unsupported features');
    });
  });
});
