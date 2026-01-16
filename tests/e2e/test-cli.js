#!/usr/bin/env node

const { execFileSync } = require("child_process");
const assert = require("assert");
const path = require("path");
const fs = require("fs");
const { createTestLogger } = require("../helpers");

const log = createTestLogger();

log.info("Testing CLI functionality...\n");

const esCheckPath = path.join(__dirname, "..", "..", "lib", "cli", "index.js");

// Test 1: Check ES5 file passes
log.info("Test 1: ES5 file should pass ES5 check");
try {
  execFileSync("node", [esCheckPath, "es5", "./tests/fixtures/es5.js"], {
    encoding: "utf8",
  });
  log.info("[PASS] Test 1 passed\n");
} catch (error) {
  log.error("[FAIL] Test 1 failed");
  process.exit(1);
}

// Test 2: Check ES6 file fails ES5 check
log.info("Test 2: ES6 file should fail ES5 check");
try {
  execFileSync("node", [esCheckPath, "es5", "./tests/fixtures/es6.js"], {
    encoding: "utf8",
  });
  log.error("[FAIL] Test 2 failed - should have thrown an error");
  process.exit(1);
} catch (error) {
  log.info("[PASS] Test 2 passed (expected failure)\n");
}

// Test 3: Check with --module flag
log.info("Test 3: Module syntax with --module flag");
try {
  execFileSync(
    "node",
    [esCheckPath, "es6", "./tests/fixtures/modules/es6-module.js", "--module"],
    { encoding: "utf8" },
  );
  log.info("[PASS] Test 3 passed\n");
} catch (error) {
  log.error("[FAIL] Test 3 failed");
  process.exit(1);
}

// Test 4: Check with --allowHashBang flag (ES6 since file uses const)
log.info("Test 4: Hash bang file with --allowHashBang flag");
try {
  execFileSync(
    "node",
    [
      esCheckPath,
      "es6",
      "./tests/fixtures/scripts/hash-bang.js",
      "--allowHashBang",
    ],
    { encoding: "utf8" },
  );
  log.info("[PASS] Test 4 passed\n");
} catch (error) {
  log.error("[FAIL] Test 4 failed");
  process.exit(1);
}

// Test 5: Check with --checkFeatures flag
log.info("Test 5: Feature detection with --checkFeatures flag");
try {
  execFileSync(
    "node",
    [esCheckPath, "es5", "./tests/fixtures/es6.js", "--checkFeatures"],
    { encoding: "utf8" },
  );
  log.error("[FAIL] Test 5 failed - should have thrown an error");
  process.exit(1);
} catch (error) {
  log.info("[PASS] Test 5 passed (expected failure)\n");
}

log.info(
  "Test 6: Boolean flags before positional args (--module es2022 'pattern' --checkFeatures)",
);
try {
  execFileSync(
    "node",
    [
      esCheckPath,
      "--module",
      "es2022",
      "./tests/fixtures/modules/es6-module.js",
      "--checkFeatures",
    ],
    { encoding: "utf8" },
  );
  log.info("[PASS] Test 6 passed\n");
} catch (error) {
  log.error("[FAIL] Test 6 failed");
  log.error(error.message);
  process.exit(1);
}

// Test 7: Check multiple files with glob pattern
log.info("Test 7: Multiple files with glob pattern");
try {
  execFileSync("node", [esCheckPath, "es5", "./tests/fixtures/es5*.js"], {
    encoding: "utf8",
  });
  log.info("[PASS] Test 7 passed\n");
} catch (error) {
  log.error("[FAIL] Test 7 failed");
  process.exit(1);
}

// Test 8: Check with config file
log.info("Test 8: Using config file");
const configPath = path.join(__dirname, "test.escheckrc");
const config = {
  ecmaVersion: "es5",
  files: "./tests/fixtures/es5.js",
  checkFeatures: true,
};
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

try {
  execFileSync("node", [esCheckPath, "--config", configPath], {
    encoding: "utf8",
  });
  log.info("[PASS] Test 8 passed\n");
} catch (error) {
  log.error("[FAIL] Test 8 failed");
  process.exit(1);
} finally {
  // Clean up
  fs.unlinkSync(configPath);
}

log.info("Test 9: Lightweight mode with --light flag");
try {
  execFileSync(
    "node",
    [esCheckPath, "es5", "./tests/fixtures/es5.js", "--light"],
    { encoding: "utf8" },
  );
  log.info("[PASS] Test 9 passed\n");
} catch (error) {
  log.error("[FAIL] Test 9 failed");
  process.exit(1);
}

log.info("Test 10: Lightweight mode should catch ES6 code");
try {
  execFileSync(
    "node",
    [esCheckPath, "es5", "./tests/fixtures/es6.js", "--light"],
    { encoding: "utf8" },
  );
  log.error("[FAIL] Test 10 failed - should have thrown an error");
  process.exit(1);
} catch (error) {
  log.info("[PASS] Test 10 passed (expected failure)\n");
}

log.info("Test 11: Default mode without --light flag uses Acorn parser");
try {
  execFileSync("node", [esCheckPath, "es5", "./tests/fixtures/es5.js"], {
    encoding: "utf8",
  });
  log.info("[PASS] Test 11 passed\n");
} catch (error) {
  log.error("[FAIL] Test 11 failed");
  log.error(error.message);
  process.exit(1);
}

log.info("Test 12: --light and default mode produce same results");
try {
  const defaultResult = execFileSync(
    "node",
    [esCheckPath, "es6", "./tests/fixtures/es6.js", "--checkFeatures"],
    { encoding: "utf8" },
  );
  const lightResult = execFileSync(
    "node",
    [
      esCheckPath,
      "es6",
      "./tests/fixtures/es6.js",
      "--light",
      "--checkFeatures",
    ],
    { encoding: "utf8" },
  );
  assert.strictEqual(
    defaultResult.includes("passed"),
    lightResult.includes("passed"),
    "Both modes should have same pass/fail result",
  );
  log.info("[PASS] Test 12 passed\n");
} catch (error) {
  log.error("[FAIL] Test 12 failed");
  log.error(error.message);
  process.exit(1);
}

log.info(
  "Test 13: --light with feature detection catches unsupported features",
);
try {
  execFileSync(
    "node",
    [
      esCheckPath,
      "es5",
      "./tests/fixtures/es6.js",
      "--light",
      "--checkFeatures",
    ],
    { encoding: "utf8" },
  );
  log.error("[FAIL] Test 13 failed - should have thrown an error");
  process.exit(1);
} catch (error) {
  const hasFeatureError =
    error.stderr && error.stderr.includes("ES version matching errors");
  assert.ok(hasFeatureError, "Should report feature detection errors");
  log.info("[PASS] Test 13 passed (expected failure)\n");
}

log.info(
  "Test 14: Superseded features (Array.prototype.group) are detected",
);
try {
  execFileSync(
    "node",
    [
      esCheckPath,
      "es5",
      "./tests/fixtures/superseded-features.js",
      "--checkFeatures",
    ],
    { encoding: "utf8" },
  );
  log.error(
    "[FAIL] Test 14 failed - should have detected superseded features",
  );
  process.exit(1);
} catch (error) {
  const stderr = error.stderr || "";
  const hasError = stderr.includes("ES version matching errors");
  assert.ok(
    hasError,
    "Should detect superseded Array.prototype.group features",
  );
  log.info("[PASS] Test 14 passed (expected failure)\n");
}

log.info(
  "Test 15: Object spread syntax should pass for Chrome 60 (issue #383)",
);
const objectSpreadFile = path.join(__dirname, "temp-object-spread.js");
fs.writeFileSync(
  objectSpreadFile,
  "function merge(obj) { return { ...obj, added: true }; }",
);
try {
  execFileSync(
    "node",
    [
      esCheckPath,
      "checkBrowser",
      objectSpreadFile,
      "--browserslistQuery=chrome 60",
    ],
    { encoding: "utf8" },
  );
  log.info("[PASS] Test 15 passed\n");
} catch (error) {
  log.error(
    "[FAIL] Test 15 failed - Chrome 60 should support object spread",
  );
  log.error(error.message);
  process.exit(1);
} finally {
  fs.unlinkSync(objectSpreadFile);
}

log.info(
  "Test 16: Object spread should fail for Chrome 55 (ES7, before object spread)",
);
const objectSpreadFile2 = path.join(__dirname, "temp-object-spread2.js");
fs.writeFileSync(
  objectSpreadFile2,
  "function merge(obj) { return { ...obj }; }",
);
try {
  execFileSync(
    "node",
    [
      esCheckPath,
      "checkBrowser",
      objectSpreadFile2,
      "--browserslistQuery=chrome 55",
    ],
    { encoding: "utf8" },
  );
  log.error(
    "[FAIL] Test 16 failed - Chrome 55 should not support object spread",
  );
  process.exit(1);
} catch (error) {
  log.info("[PASS] Test 16 passed (expected failure)\n");
} finally {
  fs.unlinkSync(objectSpreadFile2);
}

log.info(
  "Test 17: Minimum ES version selection with mixed browsers (issue #382)",
);
const es6File = path.join(__dirname, "temp-es6-arrow.js");
fs.writeFileSync(es6File, "const fn = () => 42;");
try {
  execFileSync(
    "node",
    [
      esCheckPath,
      "checkBrowser",
      es6File,
      "--browserslistQuery=chrome 120, chrome 51",
    ],
    { encoding: "utf8" },
  );
  log.info("[PASS] Test 17 passed\n");
} catch (error) {
  log.error(
    "[FAIL] Test 17 failed - ES6 code should pass for chrome 51+ query",
  );
  log.error(error.message);
  process.exit(1);
} finally {
  fs.unlinkSync(es6File);
}

log.info("[PASS] All CLI tests passed!");
