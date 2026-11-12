const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ES11_FEATURES } = require("../../../../../lib/constants/es/2020");
const { ES_FEATURES } = require("../../../../../lib/constants/es");

test("ES2020 features are registered in the catalogue at edition 11", () => {
  const entries = Object.entries(ES11_FEATURES);
  assert(entries.length > 0);
  entries.forEach(([name, feature]) => {
    assert.equal(feature.minVersion, 11, name);
    assert.equal(ES_FEATURES[name], feature, name);
  });
});
