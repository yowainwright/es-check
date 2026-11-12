const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ES7_FEATURES } = require("../../../../../lib/constants/es/2016");
const { ES_FEATURES } = require("../../../../../lib/constants/es");

test("ES2016 features are registered in the catalogue at edition 7", () => {
  const entries = Object.entries(ES7_FEATURES);
  assert(entries.length > 0);
  entries.forEach(([name, feature]) => {
    assert.equal(feature.minVersion, 7, name);
    assert.equal(ES_FEATURES[name], feature, name);
  });
});
