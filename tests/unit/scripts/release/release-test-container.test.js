"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");

const containerModule =
  import("../../../../scripts/release/release-test-container.mjs");

const CLI_CALLS = [
  ["--help"],
  ["--version"],
  ["es5", "fixtures/es5.js"],
  ["es5", "fixtures/es6.js"],
  ["es6", "fixtures/es6.js"],
  ["es6", "fixtures/module.js", "--module"],
  ["es5", "fixtures/es5.js", "--light"],
];
const COMPATIBILITY_CALLS = [
  ["--help"],
  ["--verbose", "es6", "fixtures/es6.js"],
  ["completion", "bash"],
  ["completion", "zsh"],
];

function createRunner(statuses = []) {
  const calls = [];
  const run = (command, args, options) => {
    const status = statuses[calls.length] ?? 0;
    calls.push({ command, args, options });
    return { status, stdout: "", stderr: "" };
  };
  return { calls, run };
}

test("verifyCli runs the release CLI checks", async () => {
  const { verifyCli } = await containerModule;
  const runner = createRunner([0, 0, 0, 1]);
  verifyCli({ run: runner.run });
  assert.deepEqual(
    runner.calls.map(({ args }) => args),
    CLI_CALLS,
  );
});

test("verifyCli rejects an ES6 fixture that passes ES5", async () => {
  const { verifyCli } = await containerModule;
  const runner = createRunner();
  assert.throws(
    () => verifyCli({ run: runner.run }),
    /Expected ES6 fixture to fail/,
  );
});

test("verifyApiModule checks exports and execution", async () => {
  const { verifyApiModule } = await containerModule;
  const api = {
    runChecks: async () => ({ success: true }),
    loadConfig: () => {},
    createLogger: () => ({}),
  };
  await verifyApiModule(api);
});

test("getPackageManagerPlans creates isolated commands", async () => {
  const { getPackageManagerPlans } = await containerModule;
  const plans = getPackageManagerPlans("v1.2.3", "/tmp/release");
  assert.deepEqual(
    plans.map(({ directory }) => directory),
    ["/tmp/release/npm", "/tmp/release/pnpm", "/tmp/release/yarn"],
  );
  assert.deepEqual(plans[0].commands[1], [
    "npm",
    ["install", "es-check@1.2.3"],
  ]);
  assert.deepEqual(plans[1].commands[1], ["pnpm", ["add", "es-check@1.2.3"]]);
  assert.deepEqual(plans[2].commands[1], ["yarn", ["add", "es-check@1.2.3"]]);
});

test("verifyCompatibility runs completion checks", async () => {
  const { verifyCompatibility } = await containerModule;
  const runner = createRunner();
  verifyCompatibility({ run: runner.run });
  assert.deepEqual(
    runner.calls.map(({ args }) => args),
    COMPATIBILITY_CALLS,
  );
});
