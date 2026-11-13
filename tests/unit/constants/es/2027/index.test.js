const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ES18_FEATURES } = require("../../../../../lib/constants/es/2027");
const {
  ES_FEATURES,
  ECMA_VERSION_MAP,
  ECMA_VERSION_TO_NUMBER,
  JS_VERSIONS,
  VERSION_ORDER,
  LATEST_PARSER_VERSION,
  ES_GLOBAL_MIN_VERSION,
} = require("../../../../../lib/constants/es");

test("ES2027 features are registered at edition 18", () => {
  Object.entries(ES18_FEATURES).forEach(([name, feature]) => {
    assert.equal(feature.minVersion, 18, name);
    assert.equal(ES_FEATURES[name], feature, name);
  });
});

test("ES2027 numeric and named aliases resolve to edition 18", () => {
  [18, 2027, "es18", "es2027"].forEach((alias) => {
    assert.equal(ECMA_VERSION_MAP[alias], "es2027");
  });
  assert.equal(ECMA_VERSION_TO_NUMBER.es2027, 18);
  assert(JS_VERSIONS.includes("es18"));
  assert(JS_VERSIONS.includes("es2027"));
  assert.equal(VERSION_ORDER.at(-1), "es2027");
  assert.equal(LATEST_PARSER_VERSION, 2027);
});

test("Temporal and resource-management globals require edition 18", () => {
  ["Temporal", "DisposableStack", "AsyncDisposableStack", "SuppressedError"].forEach((name) => {
    assert.equal(ES_GLOBAL_MIN_VERSION[name], 18, name);
  });
});
