// Test for ignorePolyfillable option (issue #390)
const arr = [1, 2, 3];

// These should be ignored when --ignorePolyfillable=core-js is used
const sorted = arr.toSorted();
const reversed = arr.toReversed();
const modified = arr.with(1, 'new');
const found = arr.findLast(x => x > 1);

// But this should still be flagged as it's not polyfillable
const result = 0n; // BigInt literal