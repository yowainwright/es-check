const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ES8_FEATURES } = require("../../../../../lib/constants/es/2017");
const { ES_FEATURES } = require("../../../../../lib/constants/es");

test("ES2017 features are registered in the catalogue at edition 8", () => {
  const entries = Object.entries(ES8_FEATURES);
  assert(entries.length > 0);
  entries.forEach(([name, feature]) => {
    assert.equal(feature.minVersion, 8, name);
    assert.equal(ES_FEATURES[name], feature, name);
  });
});
