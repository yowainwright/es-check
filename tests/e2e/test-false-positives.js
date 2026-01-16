#!/usr/bin/env node

const { execFileSync } = require("child_process");
const assert = require("assert");
const path = require("path");
const { createTestLogger } = require("../helpers");

const log = createTestLogger();

log.info("Testing false positive detection...\n");

const esCheckPath = path.join(__dirname, "..", "..", "lib", "cli", "index.js");

log.info(
  "Test 1: String with underscore should NOT be flagged as numeric separator",
);
try {
  execFileSync(
    "node",
    [
      esCheckPath,
      "es5",
      "./tests/fixtures/false-positive-numeric-separator.js",
    ],
    { encoding: "utf8" },
  );
  log.info("[PASS] Test 1 passed\n");
} catch (error) {
  log.error("[FAIL] Test 1 failed - false positive for numeric separator");
  log.error(error.stderr || error.stdout || error.message);
  process.exit(1);
}

log.info("Test 2: String with ** should NOT be flagged as exponent operator");
try {
  execFileSync(
    "node",
    [esCheckPath, "es5", "./tests/fixtures/false-positive-exponent.js"],
    { encoding: "utf8" },
  );
  log.info("[PASS] Test 2 passed\n");
} catch (error) {
  log.error("[FAIL] Test 2 failed - false positive for exponent operator");
  log.error(error.stderr || error.stdout || error.message);
  process.exit(1);
}

log.info(
  "Test 3: Ternary with decimal should NOT be flagged as optional chaining",
);
try {
  execFileSync(
    "node",
    [esCheckPath, "es5", "./tests/fixtures/false-positive-decimal.js"],
    { encoding: "utf8" },
  );
  log.info("[PASS] Test 3 passed\n");
} catch (error) {
  log.error("[FAIL] Test 3 failed - false positive for optional chaining");
  log.error(error.stderr || error.stdout || error.message);
  process.exit(1);
}

log.info("All false positive tests passed! [PASS]");
