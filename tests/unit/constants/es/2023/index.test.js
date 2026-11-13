const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ES14_FEATURES } = require("../../../../../lib/constants/es/2023");
const { ES_FEATURES } = require("../../../../../lib/constants/es");

test("ES2023 features are registered in the catalogue at edition 14", () => {
  const entries = Object.entries(ES14_FEATURES);
  assert(entries.length > 0);
  entries.forEach(([name, feature]) => {
    assert.equal(feature.minVersion, 14, name);
    assert.equal(ES_FEATURES[name], feature, name);
  });
});
