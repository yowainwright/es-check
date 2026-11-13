const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ES16_FEATURES } = require("../../../../../lib/constants/es/2025");
const { ES_FEATURES } = require("../../../../../lib/constants/es");

test("ES2025 features are registered in the catalogue at edition 16", () => {
  const entries = Object.entries(ES16_FEATURES);
  assert(entries.length > 0);
  entries.forEach(([name, feature]) => {
    assert.equal(feature.minVersion, 16, name);
    assert.equal(ES_FEATURES[name], feature, name);
  });
});
