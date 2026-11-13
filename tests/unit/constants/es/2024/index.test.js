const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ES15_FEATURES } = require("../../../../../lib/constants/es/2024");
const { ES_FEATURES } = require("../../../../../lib/constants/es");

test("ES2024 features are registered in the catalogue at edition 15", () => {
  const entries = Object.entries(ES15_FEATURES);
  assert(entries.length > 0);
  entries.forEach(([name, feature]) => {
    assert.equal(feature.minVersion, 15, name);
    assert.equal(ES_FEATURES[name], feature, name);
  });
});
