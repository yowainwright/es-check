#!/usr/bin/env node

const { execFileSync } = require("child_process");
const assert = require("assert");
const path = require("path");

console.log("Testing false positive detection...\n");

const esCheckPath = path.join(__dirname, "..", "..", "lib", "cli", "index.js");

// Test 1: Numeric separator false positive
console.log(
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
  console.log("✅ Test 1 passed\n");
} catch (error) {
  console.error("❌ Test 1 failed - false positive for numeric separator");
  console.error(error.stderr || error.stdout || error.message);
  process.exit(1);
}

// Test 2: Exponent operator false positive
console.log(
  "Test 2: String with ** should NOT be flagged as exponent operator",
);
try {
  execFileSync(
    "node",
    [esCheckPath, "es5", "./tests/fixtures/false-positive-exponent.js"],
    { encoding: "utf8" },
  );
  console.log("✅ Test 2 passed\n");
} catch (error) {
  console.error("❌ Test 2 failed - false positive for exponent operator");
  console.error(error.stderr || error.stdout || error.message);
  process.exit(1);
}

// Test 3: Decimal in ternary false positive
console.log(
  "Test 3: Ternary with decimal should NOT be flagged as optional chaining",
);
try {
  execFileSync(
    "node",
    [esCheckPath, "es5", "./tests/fixtures/false-positive-decimal.js"],
    { encoding: "utf8" },
  );
  console.log("✅ Test 3 passed\n");
} catch (error) {
  console.error("❌ Test 3 failed - false positive for optional chaining");
  console.error(error.stderr || error.stdout || error.message);
  process.exit(1);
}

console.log("All false positive tests passed! ✅");
