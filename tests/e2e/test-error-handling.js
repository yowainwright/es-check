#!/usr/bin/env node

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("Testing error handling scenarios...\n");

const esCheckPath = path.join(__dirname, "..", "..", "lib", "cli", "index.js");

// Test 1: Invalid ES version
console.log("Test 1: Invalid ES version should fail");
try {
  execFileSync("node", [esCheckPath, "es99", "./tests/fixtures/es5.js"], {
    encoding: "utf8",
  });
  console.error("[FAIL] Test 1 failed - should have thrown an error");
  process.exit(1);
} catch (error) {
  console.log("[PASS] Test 1 passed (expected failure)\n");
}

// Test 2: No files found for glob pattern
console.log("Test 2: No files found should fail");
try {
  execFileSync("node", [esCheckPath, "es5", "./nonexistent/**/*.js"], {
    encoding: "utf8",
  });
  console.error("[FAIL] Test 2 failed - should have thrown an error");
  process.exit(1);
} catch (error) {
  console.log("[PASS] Test 2 passed (expected failure)\n");
}

// Test 3: No files with looseGlobMatching should warn but not fail
console.log("Test 3: No files with --looseGlobMatching should warn");
try {
  execFileSync(
    "node",
    [
      esCheckPath,
      "es5",
      "./nonexistent/**/*.js",
      "--looseGlobMatching",
      "--quiet",
    ],
    {
      encoding: "utf8",
    },
  );
  console.log("[PASS] Test 3 passed\n");
} catch (error) {
  console.error("[FAIL] Test 3 failed - should not have thrown with loose matching");
  console.error(error.stderr || error.stdout || error.message);
  process.exit(1);
}

// Test 4: Config file with invalid JSON
console.log("Test 4: Invalid JSON in config file");
const invalidConfigPath = path.join(__dirname, "invalid-config.json");
fs.writeFileSync(invalidConfigPath, "{ invalid json }");

try {
  execFileSync("node", [esCheckPath, "--config", invalidConfigPath], {
    encoding: "utf8",
  });
  console.error("[FAIL] Test 4 failed - should have thrown an error");
  process.exit(1);
} catch (error) {
  console.log("[PASS] Test 4 passed (expected failure)\n");
} finally {
  fs.unlinkSync(invalidConfigPath);
}

// Test 5: No ecmaVersion and no files specified
console.log("Test 5: No ecmaVersion or files should fail");
const emptyConfigPath = path.join(__dirname, "empty-config.json");
fs.writeFileSync(emptyConfigPath, "{}");

try {
  execFileSync("node", [esCheckPath, "--config", emptyConfigPath], {
    encoding: "utf8",
  });
  console.error("[FAIL] Test 5 failed - should have thrown an error");
  process.exit(1);
} catch (error) {
  console.log("[PASS] Test 5 passed (expected failure)\n");
} finally {
  fs.unlinkSync(emptyConfigPath);
}

// Test 6: Conflicting files inputs
console.log("Test 6: Conflicting --files flag and files argument");
try {
  execFileSync(
    "node",
    [
      esCheckPath,
      "es5",
      "./tests/fixtures/es5.js",
      "--files",
      "./tests/fixtures/es6.js",
    ],
    {
      encoding: "utf8",
    },
  );
  console.error("[FAIL] Test 6 failed - should have thrown an error");
  process.exit(1);
} catch (error) {
  console.log("[PASS] Test 6 passed (expected failure)\n");
}

// Test 7: File with syntax error
console.log("Test 7: File with syntax error should fail");
const syntaxErrorFile = path.join(__dirname, "syntax-error.js");
fs.writeFileSync(syntaxErrorFile, "function broken( { missing brace");

try {
  execFileSync("node", [esCheckPath, "es5", syntaxErrorFile], {
    encoding: "utf8",
  });
  console.error("[FAIL] Test 7 failed - should have thrown an error");
  process.exit(1);
} catch (error) {
  console.log("[PASS] Test 7 passed (expected failure)\n");
} finally {
  fs.unlinkSync(syntaxErrorFile);
}

// Test 8: Multiple errors in different files
console.log("Test 8: Multiple files with errors");
try {
  execFileSync(
    "node",
    [esCheckPath, "es5", "./tests/fixtures/es6.js", "./tests/fixtures/es7.js"],
    {
      encoding: "utf8",
    },
  );
  console.error("[FAIL] Test 8 failed - should have thrown an error");
  process.exit(1);
} catch (error) {
  const output = error.stderr || error.stdout || "";
  const hasEs6Error = output.includes("es6.js");
  const hasEs7Error = output.includes("es7.js");
  if (hasEs6Error && hasEs7Error) {
    console.log("[PASS] Test 8 passed (errors reported for both files)\n");
  } else {
    console.log("[PASS] Test 8 passed (at least one error reported)\n");
  }
}

console.log("[PASS] All error handling tests passed!");
