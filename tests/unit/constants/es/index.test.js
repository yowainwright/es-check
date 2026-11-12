const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  ECMA_VERSION_MAP,
  ECMA_VERSION_TO_NUMBER,
  JS_VERSIONS,
  VERSION_ORDER,
  LATEST_PARSER_VERSION,
  ES_GLOBAL_MIN_VERSION,
} = require("../../../../lib/constants/es");

test("ECMA_VERSION_MAP resolves numeric and named versions", () => {
  assert.equal(ECMA_VERSION_MAP[3], "es5");
  assert.equal(ECMA_VERSION_MAP[5], "es5");
  assert.equal(ECMA_VERSION_MAP[6], "es2015");
  assert.equal(ECMA_VERSION_MAP.es5, "es5");
  assert.equal(ECMA_VERSION_MAP.es6, "es2015");
  assert.equal(ECMA_VERSION_MAP.es2015, "es2015");
  assert.equal(ECMA_VERSION_MAP.es2025, "es2025");
  assert.equal(ECMA_VERSION_TO_NUMBER.es2025, 16);
});

test("JS_VERSIONS includes supported CLI aliases", () => {
  assert(Array.isArray(JS_VERSIONS));
  ["es3", "es5", "es6", "es2015", "es2025"].forEach((version) => {
    assert(JS_VERSIONS.includes(version));
  });
});

test("VERSION_ORDER lists editions chronologically", () => {
  assert(Array.isArray(VERSION_ORDER));
  assert.equal(VERSION_ORDER[0], "es5");
  assert.equal(VERSION_ORDER[1], "es2015");
  assert(VERSION_ORDER.includes("es2025"));
  assert(VERSION_ORDER.indexOf("es5") < VERSION_ORDER.indexOf("es2015"));
  assert(VERSION_ORDER.indexOf("es2015") < VERSION_ORDER.indexOf("es2016"));
  assert(VERSION_ORDER.indexOf("es2024") < VERSION_ORDER.indexOf("es2025"));
});

test("LATEST_PARSER_VERSION should be a valid number", () => {
  assert.equal(typeof LATEST_PARSER_VERSION, "number");
  assert(LATEST_PARSER_VERSION >= 2026, "Should be at least ES2026");
});

test("LATEST_PARSER_VERSION should be reasonable for current year", () => {
  const maxReasonableVersion = new Date().getFullYear() + 5;
  assert(LATEST_PARSER_VERSION <= maxReasonableVersion, "Should not be too far in the future");
  assert(LATEST_PARSER_VERSION >= 2026, "Should be recent enough");
});

test("global availability follows the maintained ES data", () => {
  assert.equal(ECMA_VERSION_TO_NUMBER.es2025, 16);
  assert.equal(ES_GLOBAL_MIN_VERSION.Proxy, 6);
  assert.equal(ES_GLOBAL_MIN_VERSION.AggregateError, 12);
  assert.equal(ES_GLOBAL_MIN_VERSION.Iterator, 16);
});
