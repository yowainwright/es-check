const { test } = require("node:test");
const assert = require("assert");

const { detectPolyfills } = require("../../../lib/detectFeatures");

const mockLogger = { debug: () => {}, isLevelEnabled: () => true };

test("should detect Array.toSorted from core-js/actual", () => {
  const code = `import toSorted from 'core-js/actual/array/to-sorted';`;
  const polyfills = detectPolyfills(code, mockLogger);

  assert.strictEqual(polyfills.has("ArrayToSorted"), true);
  assert.strictEqual(polyfills.has("Array.prototype.toSorted"), true);
});

test("should detect Array.toReversed from core-js/stable", () => {
  const code = `require('core-js/stable/array/to-reversed');`;
  const polyfills = detectPolyfills(code, mockLogger);

  assert.strictEqual(polyfills.has("ArrayToReversed"), true);
});

test("should detect Array.with from core-js patterns", () => {
  const code = `const withPolyfill = require('core-js/stable/array/with');`;
  const polyfills = detectPolyfills(code, mockLogger);

  assert.strictEqual(polyfills.has("ArrayWith"), true);
});

test("should detect toSorted in bundled code", () => {
  const code = `
    // Webpack bundled core-js
    var coreJsToSorted = __webpack_require__(/*! core-js/modules/es.array.to-sorted */ 1234);
  `;
  const polyfills = detectPolyfills(code, mockLogger);

  assert.strictEqual(polyfills.has("ArrayToSorted"), true);
});

test("should detect generic core-js toReversed patterns", () => {
  const code = `
    // Generic bundled pattern
    if (typeof toReversed === 'undefined' && core_js_modules_toReversed) {
      // polyfill setup
    }
  `;
  const polyfills = detectPolyfills(code, mockLogger);

  assert.strictEqual(polyfills.has("ArrayToReversed"), true);
});

test("should detect with method patterns", () => {
  const code = `
    // Minified core-js pattern
    core_js_array_with && (Array.prototype.with = core_js_array_with);
  `;
  const polyfills = detectPolyfills(code, mockLogger);

  assert.strictEqual(polyfills.has("ArrayWith"), true);
});

test("should detect multiple polyfills in same code", () => {
  const code = `
    import 'core-js/actual/array/to-sorted';
    require('core-js/stable/array/to-reversed');
    const withMethod = core_js_array_with;
  `;
  const polyfills = detectPolyfills(code, mockLogger);

  assert.strictEqual(polyfills.has("ArrayToSorted"), true);
  assert.strictEqual(polyfills.has("ArrayToReversed"), true);
  assert.strictEqual(polyfills.has("ArrayWith"), true);
});

test("should not detect false positives in comments", () => {
  const code = `
    // This is about some feature but not a polyfill
    /* Some comment about generic functionality */
    console.log("This code has no polyfills");
  `;
  const polyfills = detectPolyfills(code, mockLogger);

  assert.strictEqual(polyfills.size, 0);
});

test("should detect webpack-style bundled patterns", () => {
  const code = `
    import 'core-js/modules/es.array.to-sorted';
    require('core-js/stable/array/with');
  `;
  const polyfills = detectPolyfills(code, mockLogger);

  assert.strictEqual(polyfills.has("ArrayToSorted"), true);
  assert.strictEqual(polyfills.has("ArrayWith"), true);
});
