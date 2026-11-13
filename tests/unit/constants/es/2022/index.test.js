const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ES13_FEATURES } = require("../../../../../lib/constants/es/2022");
const { ES_FEATURES } = require("../../../../../lib/constants/es");

test("ES2022 features are registered in the catalogue at edition 13", () => {
  const entries = Object.entries(ES13_FEATURES);
  assert(entries.length > 0);
  entries.forEach(([name, feature]) => {
    assert.equal(feature.minVersion, 13, name);
    assert.equal(ES_FEATURES[name], feature, name);
  });
});
