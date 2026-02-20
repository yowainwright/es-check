// Test for core-js polyfill detection (issue #389)
import 'core-js/actual/array/to-sorted';
require('core-js/stable/array/to-reversed');

// Core-js modern bundled patterns
const coreJsToSorted = __webpack_require__(/*! core-js/modules/es.array.to-sorted */ 1234);
const bundledSetup = core_js_modules_es_array_with;

const arr = [3, 1, 2];
const sorted = arr.toSorted();
const reversed = arr.toReversed();
const modified = arr.with(1, 'changed');