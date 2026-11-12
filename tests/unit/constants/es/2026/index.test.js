const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ES17_FEATURES } = require("../../../../../lib/constants/es/2026");
const { ES_FEATURES } = require("../../../../../lib/constants/es");

test("ES2026 features are registered in the catalogue at edition 17", () => {
  const entries = Object.entries(ES17_FEATURES);
  assert(entries.length > 0);
  entries.forEach(([name, feature]) => {
    assert.equal(feature.minVersion, 17, name);
    assert.equal(ES_FEATURES[name], feature, name);
  });
});
