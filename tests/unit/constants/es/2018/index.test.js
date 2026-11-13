const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ES9_FEATURES } = require("../../../../../lib/constants/es/2018");
const { ES_FEATURES } = require("../../../../../lib/constants/es");

test("ES2018 features are registered in the catalogue at edition 9", () => {
  const entries = Object.entries(ES9_FEATURES);
  assert(entries.length > 0);
  entries.forEach(([name, feature]) => {
    assert.equal(feature.minVersion, 9, name);
    assert.equal(ES_FEATURES[name], feature, name);
  });
});
