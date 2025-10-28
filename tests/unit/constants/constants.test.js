const { describe, it } = require('node:test');
const assert = require('node:assert');
const constants = require('../../../lib/constants');
const versions = require('../../../lib/constants/versions.js');
const esFeatures = require('../../../lib/constants/es-features.js');
const polyfills = require('../../../lib/constants/polyfills.js');
const astTypes = require('../../../lib/constants/ast-types.js');

describe('constants/', () => {
  describe('index.js aggregator', () => {
    it('should export all version constants', () => {
      assert(constants.ECMA_VERSION_MAP);
      assert(constants.BROWSER_TO_ES_VERSION);
      assert(constants.JS_VERSIONS);
      assert(constants.VERSION_ORDER);
    });

    it('should export all ES feature constants', () => {
      assert(constants.ES_FEATURES);
    });

    it('should export all polyfill constants', () => {
      assert(constants.POLYFILL_PATTERNS);
      assert(constants.IMPORT_PATTERNS);
      assert(constants.FEATURE_TO_POLYFILL_MAP);
    });

    it('should export all AST type constants', () => {
      assert(constants.NODE_TYPES);
    });
  });

  describe('versions.js', () => {
    it('should have ECMA_VERSION_MAP with all versions', () => {
      assert(versions.ECMA_VERSION_MAP);
      assert(typeof versions.ECMA_VERSION_MAP === 'object');

      assert.strictEqual(versions.ECMA_VERSION_MAP[3], 'es5');
      assert.strictEqual(versions.ECMA_VERSION_MAP[5], 'es5');
      assert.strictEqual(versions.ECMA_VERSION_MAP[6], 'es2015');
      assert.strictEqual(versions.ECMA_VERSION_MAP.es5, 'es5');
      assert.strictEqual(versions.ECMA_VERSION_MAP.es6, 'es2015');
      assert.strictEqual(versions.ECMA_VERSION_MAP.es2015, 'es2015');
      assert.strictEqual(versions.ECMA_VERSION_MAP.es2025, 'es2025');
    });

    it('should have BROWSER_TO_ES_VERSION mapping', () => {
      assert(versions.BROWSER_TO_ES_VERSION);
      assert(typeof versions.BROWSER_TO_ES_VERSION === 'object');
      assert(Object.keys(versions.BROWSER_TO_ES_VERSION).length > 0);
    });

    it('should have JS_VERSIONS array', () => {
      assert(Array.isArray(versions.JS_VERSIONS));
      assert(versions.JS_VERSIONS.includes('es3'));
      assert(versions.JS_VERSIONS.includes('es5'));
      assert(versions.JS_VERSIONS.includes('es6'));
      assert(versions.JS_VERSIONS.includes('es2015'));
      assert(versions.JS_VERSIONS.includes('es2025'));
    });

    it('should have VERSION_ORDER array', () => {
      assert(versions.VERSION_ORDER);
      assert(Array.isArray(versions.VERSION_ORDER));

      assert.strictEqual(versions.VERSION_ORDER[0], 'es5');
      assert.strictEqual(versions.VERSION_ORDER[1], 'es2015');
      assert(versions.VERSION_ORDER.includes('es2025'));
    });

    it('should have consistent version ordering', () => {
      const es5Index = versions.VERSION_ORDER.indexOf('es5');
      const es2015Index = versions.VERSION_ORDER.indexOf('es2015');
      const es2016Index = versions.VERSION_ORDER.indexOf('es2016');
      const es2024Index = versions.VERSION_ORDER.indexOf('es2024');
      const es2025Index = versions.VERSION_ORDER.indexOf('es2025');

      assert(es5Index < es2015Index);
      assert(es2015Index < es2016Index);
      assert(es2024Index < es2025Index);
    });
  });

  describe('es-features.js', () => {
    it('should have ES_FEATURES object', () => {
      assert(esFeatures.ES_FEATURES);
      assert(typeof esFeatures.ES_FEATURES === 'object');
    });

    it('should have ES6 features defined', () => {
      const features = esFeatures.ES_FEATURES;
      assert(Object.keys(features).length > 0);
    });
  });

  describe('polyfills.js', () => {
    it('should have POLYFILL_PATTERNS object', () => {
      assert(polyfills.POLYFILL_PATTERNS);
      assert(typeof polyfills.POLYFILL_PATTERNS === 'object');
    });

    it('should have IMPORT_PATTERNS object', () => {
      assert(polyfills.IMPORT_PATTERNS);
      assert(typeof polyfills.IMPORT_PATTERNS === 'object');
    });

    it('should have FEATURE_TO_POLYFILL_MAP object', () => {
      assert(polyfills.FEATURE_TO_POLYFILL_MAP);
      assert(typeof polyfills.FEATURE_TO_POLYFILL_MAP === 'object');
    });
  });

  describe('ast-types.js', () => {
    it('should have NODE_TYPES object', () => {
      assert(astTypes.NODE_TYPES);
      assert(typeof astTypes.NODE_TYPES === 'object');
      assert(Object.keys(astTypes.NODE_TYPES).length > 0);
    });
  });

  describe('Integration between constants', () => {
    it('should export all constants through main index', () => {
      assert(constants.ECMA_VERSION_MAP);
      assert(constants.JS_VERSIONS);
      assert(constants.ES_FEATURES);
      assert(constants.POLYFILL_PATTERNS);
      assert(constants.NODE_TYPES);
    });
  });
});
