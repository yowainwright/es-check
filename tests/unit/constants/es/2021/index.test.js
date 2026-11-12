const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ES12_FEATURES } = require("../../../../../lib/constants/es/2021");
const { ES_FEATURES } = require("../../../../../lib/constants/es");

test("ES2021 features are registered in the catalogue at edition 12", () => {
  const entries = Object.entries(ES12_FEATURES);
  assert(entries.length > 0);
  entries.forEach(([name, feature]) => {
    assert.equal(feature.minVersion, 12, name);
    assert.equal(ES_FEATURES[name], feature, name);
  });
});
