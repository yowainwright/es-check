#!/usr/bin/env node
"use strict";

/**
 * Enhanced test runner script with better discovery and reporting
 */

const { spawn } = require("child_process");
const path = require("path");
const fg = require("fast-glob");

const TEST_PATTERNS = {
  unit: "tests/unit/**/*.test.js",
  constants: "tests/unit/constants/*.test.js",
  helpers: "tests/unit/helpers/**/*.test.js",
  cli: "tests/unit/cli/*.test.js",
  "check-runner": "tests/unit/check-runner/*.test.js",
  e2e: "tests/e2e/test-*.js",
};

async function discoverTests(pattern = "unit") {
  const testPattern = TEST_PATTERNS[pattern] || pattern;
  const files = await fg(testPattern);

  return files.sort();
}

function runTests(files, options = {}) {
  const nodeArgs = [
    "--test",
    ...(options.coverage ? ["--experimental-test-coverage"] : []),
    ...(options.reporter ? [`--test-reporter=${options.reporter}`] : []),
    ...(options.timeout
      ? [`--test-timeout=${options.timeout}`]
      : ["--test-timeout=10000"]),
    ...files,
  ];

  const child = spawn(process.execPath, nodeArgs, {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "test",
      ...(options.verbose && { VERBOSE: "true" }),
    },
  });

  return new Promise((resolve, reject) => {
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
  });
}

async function main() {
  const [, , pattern, ...flags] = process.argv;
  const options = {
    coverage: flags.includes("--coverage"),
    verbose: flags.includes("--verbose"),
    reporter: flags.find((f) => f.startsWith("--reporter="))?.split("=")[1],
    timeout: flags.find((f) => f.startsWith("--timeout="))?.split("=")[1],
  };

  try {
    const files = await discoverTests(pattern || "unit");

    if (files.length === 0) {
      console.error(`No test files found for pattern: ${pattern || "unit"}`);
      process.exit(1);
    }

    console.log(`Running ${files.length} test files...`);
    if (options.verbose) {
      console.log("Test files:", files.join("\n  "));
    }

    await runTests(files, options);
    console.log("All tests passed!");
  } catch (err) {
    console.error("Test run failed:", err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { discoverTests, runTests };
