const { test } = require("node:test");
const assert = require("node:assert");
const constants = require("../../../lib/constants");
const es = require("../../../lib/constants/es");
const browserslist = require("../../../lib/constants/browserslist");
const polyfills = require("../../../lib/constants/polyfills");

test("shared constants re-export each module's data", () => {
  const expected = Object.assign({}, es, browserslist, polyfills);
  Object.entries(expected).forEach(([name, value]) => {
    assert.strictEqual(constants[name], value, name);
  });
});
