const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ES10_FEATURES } = require("../../../../../lib/constants/es/2019");
const { ES_FEATURES } = require("../../../../../lib/constants/es");

test("ES2019 features are registered in the catalogue at edition 10", () => {
  const entries = Object.entries(ES10_FEATURES);
  assert(entries.length > 0);
  entries.forEach(([name, feature]) => {
    assert.equal(feature.minVersion, 10, name);
    assert.equal(ES_FEATURES[name], feature, name);
  });
});
