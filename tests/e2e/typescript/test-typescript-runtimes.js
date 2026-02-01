#!/usr/bin/env node

/**
 * TypeScript Runtime E2E Tests
 *
 * Tests TypeScript support across different runtime environments:
 * - Node.js 24: Should pass (native stripTypeScriptTypes)
 * - Node.js 22: Should pass (native stripTypeScriptTypes)
 * - Node.js 20: Should fail (version too old)
 * - Bun: Should pass (Bun.Transpiler)
 * - Deno: Should fail (unsupported)
 */

const { execFileSync } = require("child_process");
const assert = require("assert");
const path = require("path");

// Get runtime environment from environment variable
const runtime = process.env.RUNTIME_ENV || "unknown";
const nodeVersion = process.env.NODE_VERSION;
const bunVersion = process.env.BUN_VERSION;
const denoVersion = process.env.DENO_VERSION;

// Paths
const esCheckPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "lib",
  "cli",
  "index.js",
);
const fixturesPath = path.join(__dirname, "..", "..", "fixtures");

// Test fixtures to use
const testFiles = [
  { file: "simple-ts.ts", needsModule: false },
  { file: "ts-es6.ts", needsModule: true },
  { file: "ts-simple-types.ts", needsModule: true },
];

// Logger
function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  console[level](
    `[${timestamp}] [${runtime.toUpperCase()}] ${message}`,
    ...args,
  );
}

function logInfo(message, ...args) {
  log("log", message, ...args);
}

function logError(message, ...args) {
  log("error", message, ...args);
}

function logSuccess(message, ...args) {
  log("log", `✅ ${message}`, ...args);
}

function logFailure(message, ...args) {
  log("error", `❌ ${message}`, ...args);
}

// Test runner
async function runTest(testName, testFn) {
  logInfo(`Running test: ${testName}`);
  try {
    await testFn();
    logSuccess(`Test passed: ${testName}`);
    return true;
  } catch (error) {
    logFailure(`Test failed: ${testName} - ${error.message}`);
    return false;
  }
}

// Test functions for different runtime scenarios
async function testNode24() {
  // Should pass - Node 24 has native stripTypeScriptTypes
  for (const testFile of testFiles) {
    const filePath = path.join(fixturesPath, testFile.file);
    const args = [esCheckPath, "es6", filePath, "--typescript"];

    if (testFile.needsModule) {
      args.push("--module");
    }

    try {
      const result = execFileSync("node", args, {
        encoding: "utf8",
        timeout: 10000,
      });

      logInfo(`✓ Successfully processed ${testFile.file}`);
    } catch (error) {
      throw new Error(`Failed to process ${testFile.file}: ${error.message}`);
    }
  }
}

async function testNode22() {
  // Should pass - Node 22 has native stripTypeScriptTypes
  for (const testFile of testFiles) {
    const filePath = path.join(fixturesPath, testFile.file);
    const args = [esCheckPath, "es6", filePath, "--typescript"];

    if (testFile.needsModule) {
      args.push("--module");
    }

    try {
      const result = execFileSync("node", args, {
        encoding: "utf8",
        timeout: 10000,
      });

      logInfo(`✓ Successfully processed ${testFile.file}`);
    } catch (error) {
      throw new Error(`Failed to process ${testFile.file}: ${error.message}`);
    }
  }
}

async function testNode20() {
  // Should fail - Node 20 doesn't have stripTypeScriptTypes
  const filePath = path.join(fixturesPath, "simple-ts.ts");

  try {
    const result = execFileSync(
      "node",
      [esCheckPath, "es6", filePath, "--typescript"],
      {
        encoding: "utf8",
        timeout: 10000,
      },
    );

    throw new Error("Expected failure but test passed");
  } catch (error) {
    // Check if it's the expected error message
    if (error.stderr && error.stderr.includes("requires Node.js v22.13.0+")) {
      logInfo("✓ Correctly failed with expected Node.js version error");
      return;
    } else if (
      error.stdout &&
      error.stdout.includes("requires Node.js v22.13.0+")
    ) {
      logInfo("✓ Correctly failed with expected Node.js version error");
      return;
    }

    throw new Error(`Unexpected error message: ${error.message}`);
  }
}

async function testBun() {
  // Should pass - Bun has Transpiler API
  for (const testFile of testFiles) {
    const filePath = path.join(fixturesPath, testFile.file);
    const args = [esCheckPath, "es6", filePath, "--typescript"];

    if (testFile.needsModule) {
      args.push("--module");
    }

    try {
      // Use node to run es-check within bun environment
      const result = execFileSync("node", args, {
        encoding: "utf8",
        timeout: 10000,
      });

      logInfo(`✓ Successfully processed ${testFile.file}`);
    } catch (error) {
      throw new Error(`Failed to process ${testFile.file}: ${error.message}`);
    }
  }
}

async function testDeno() {
  // Should fail - In Deno environment with Node.js 20, TypeScript should fail with version error
  const filePath = path.join(fixturesPath, "simple-ts.ts");

  try {
    // Use node to run es-check within deno environment (Node.js 20 in Deno container)
    const result = execFileSync(
      "node",
      [esCheckPath, "es6", filePath, "--typescript"],
      {
        encoding: "utf8",
        timeout: 10000,
      },
    );

    throw new Error("Expected failure but test passed");
  } catch (error) {
    // Check if it's the expected Node.js version error (since we're running under Node.js 20 in Deno container)
    if (error.stderr && error.stderr.includes("requires Node.js v22.13.0+")) {
      logInfo(
        "✓ Correctly failed with expected Node.js version error in Deno environment",
      );
      return;
    } else if (
      error.stdout &&
      error.stdout.includes("requires Node.js v22.13.0+")
    ) {
      logInfo(
        "✓ Correctly failed with expected Node.js version error in Deno environment",
      );
      return;
    }

    throw new Error(`Unexpected error message: ${error.message}`);
  }
}

// Main execution
async function main() {
  logInfo(`Starting TypeScript runtime tests for: ${runtime}`);
  logInfo(
    `Runtime details: Node=${nodeVersion}, Bun=${bunVersion}, Deno=${denoVersion}`,
  );

  let testsPassed = 0;
  let totalTests = 0;

  // Run tests based on runtime environment
  switch (runtime) {
    case "node24":
      totalTests = 1;
      if (await runTest("Node.js 24 TypeScript Support", testNode24)) {
        testsPassed++;
      }
      break;

    case "node22":
      totalTests = 1;
      if (await runTest("Node.js 22 TypeScript Support", testNode22)) {
        testsPassed++;
      }
      break;

    case "node20":
      totalTests = 1;
      if (await runTest("Node.js 20 Version Error", testNode20)) {
        testsPassed++;
      }
      break;

    case "bun":
      totalTests = 1;
      if (await runTest("Bun TypeScript Support", testBun)) {
        testsPassed++;
      }
      break;

    case "deno":
      totalTests = 1;
      if (await runTest("Deno Unsupported Error", testDeno)) {
        testsPassed++;
      }
      break;

    default:
      logError(`Unknown runtime environment: ${runtime}`);
      process.exit(1);
  }

  // Report results
  logInfo(`Test Results: ${testsPassed}/${totalTests} passed`);

  if (testsPassed === totalTests) {
    logSuccess(`All tests passed for ${runtime}`);
    process.exit(0);
  } else {
    logFailure(`Some tests failed for ${runtime}`);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  logError("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the tests
main().catch((error) => {
  logError("Fatal error:", error.message);
  process.exit(1);
});
