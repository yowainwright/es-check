const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ES6_FEATURES } = require("../../../../../lib/constants/es/2015");
const { ES_FEATURES } = require("../../../../../lib/constants/es");

test("ES2015 features are registered in the catalogue at edition 6", () => {
  const entries = Object.entries(ES6_FEATURES);
  assert(entries.length > 0);
  entries.forEach(([name, feature]) => {
    assert.equal(feature.minVersion, 6, name);
    assert.equal(ES_FEATURES[name], feature, name);
  });
});
