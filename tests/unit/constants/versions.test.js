const { test } = require("node:test");
const assert = require("assert");

const { LATEST_PARSER_VERSION } = require("../../../lib/constants/versions");

test("LATEST_PARSER_VERSION should be a valid number", () => {
  assert.strictEqual(typeof LATEST_PARSER_VERSION, "number");
  assert.strictEqual(LATEST_PARSER_VERSION >= 2020, true, "Should be at least ES2020");
});

test("LATEST_PARSER_VERSION should be reasonable for current year", () => {
  const currentYear = new Date().getFullYear();
  const maxReasonableVersion = currentYear + 5; // Allow some future planning

  assert.strictEqual(LATEST_PARSER_VERSION <= maxReasonableVersion, true, "Should not be too far in the future");
  assert.strictEqual(LATEST_PARSER_VERSION >= 2020, true, "Should be recent enough");
});