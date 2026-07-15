"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");

const releaseModule = import("../../../../scripts/release/test-published-release.mjs");
const CREDENTIAL = "fixture-value";

const BUILD_ARGS = [
  "build",
  "--build-arg",
  "ES_CHECK_VERSION=1.2.3",
  "--file",
  "scripts/release/Dockerfile",
  "--tag",
  "es-check-release-test",
  ".",
];
const CONTAINER_ARGS = [
  "run",
  "--rm",
  "--env",
  "ES_CHECK_VERSION=1.2.3",
  "es-check-release-test",
  "api",
];

function createRunner(statuses = [], stdout = "") {
  const calls = [];
  const run = (command, args, options) => {
    const status = statuses[calls.length] ?? 0;
    calls.push({ command, args, options });
    return { status, stdout, stderr: "" };
  };
  return { calls, run };
}

function createFetchRecorder() {
  const requests = [];
  const fetch = async (...args) => {
    requests.push(args);
    return { ok: true, status: 204 };
  };
  return { fetch, requests };
}

function createDispatchInputs() {
  return {
    repository: "owner/repo",
    token: CREDENTIAL,
    version: "v1.2.3",
    releaseUrl: "https://example.com/release",
    triggerType: "release",
  };
}

test("resolveVersion prefers workflow input", async () => {
  const { resolveVersion } = await releaseModule;
  const outputs = [];
  const logs = [];
  const dependencies = {
    writeOutput: (...args) => outputs.push(args),
    log: (message) => logs.push(message),
  };
  const inputs = { inputVersion: "v1.2.3", releaseTag: "v2.0.0" };
  const version = resolveVersion(inputs, dependencies);
  assert.equal(version, "1.2.3");
  assert.deepEqual(outputs[0].slice(0, 2), ["version", "1.2.3"]);
  assert.deepEqual(logs, ["Testing es-check version: 1.2.3"]);
});

test("resolveVersion falls back to npm", async () => {
  const { resolveVersion } = await releaseModule;
  const runner = createRunner([0], "1.2.3\n");
  const dependencies = {
    run: runner.run,
    writeOutput: () => {},
    log: () => {},
  };
  const version = resolveVersion({}, dependencies);
  assert.equal(version, "1.2.3");
  assert.deepEqual(runner.calls[0].args, ["view", "es-check", "version"]);
});

test("waitForPackage retries until npm responds", async () => {
  const { waitForPackage } = await releaseModule;
  const runner = createRunner([1, 1, 0]);
  const delays = [];
  const dependencies = {
    run: runner.run,
    sleep: async (duration) => delays.push(duration),
    log: () => {},
  };
  await waitForPackage("1.2.3", { attempts: 3, delayMs: 5 }, dependencies);
  assert.equal(runner.calls.length, 3);
  assert.deepEqual(delays, [5, 5]);
});

test("waitForPackage fails after the final attempt", async () => {
  const { waitForPackage } = await releaseModule;
  const runner = createRunner([1, 1]);
  const dependencies = {
    run: runner.run,
    sleep: async () => {},
    log: () => {},
  };
  const wait = waitForPackage("1.2.3", { attempts: 2 }, dependencies);
  await assert.rejects(wait, /was not available in time/);
});

test("waitForPackage rejects invalid retry options", async () => {
  const { waitForPackage } = await releaseModule;
  assert.throws(
    () => waitForPackage("1.2.3", { delayMs: -1 }),
    /delayMs must be a non-negative integer/,
  );
});

test("buildTestImage uses the tracked Dockerfile", async () => {
  const { buildTestImage } = await releaseModule;
  const runner = createRunner();
  buildTestImage("v1.2.3", { run: runner.run });
  assert.equal(runner.calls[0].command, "docker");
  assert.deepEqual(runner.calls[0].args, BUILD_ARGS);
});

test("runContainerTest invokes the requested mode", async () => {
  const { runContainerTest } = await releaseModule;
  const runner = createRunner();
  runContainerTest("api", "1.2.3", { run: runner.run });
  assert.deepEqual(runner.calls[0].args, CONTAINER_ARGS);
  assert.throws(() => runContainerTest("unknown", "1.2.3"), /Unknown/);
});

test("createReport includes release metadata", async () => {
  const { createReport } = await releaseModule;
  const report = createReport({
    version: "v1.2.3",
    status: "success",
    date: "2026-07-13 12:00:00 UTC",
  });
  assert.match(report, /\*\*Version Tested:\*\* 1\.2\.3/);
  assert.match(report, /\*\*Status:\*\* success/);
  assert.match(report, /- ESM API/);
});

test("parseRepository rejects traversal", async () => {
  const { parseRepository } = await releaseModule;
  assert.equal(parseRepository("owner/repo"), "owner/repo");
  assert.throws(() => parseRepository("../repo"), /owner\/repo format/);
});

test("dispatchExternalTests sends the expected payload", async () => {
  const { dispatchExternalTests } = await releaseModule;
  const recorder = createFetchRecorder();
  await dispatchExternalTests(createDispatchInputs(), {
    fetch: recorder.fetch,
  });
  const [url, request] = recorder.requests[0];
  const payload = JSON.parse(request.body);
  assert.equal(url, "https://api.github.com/repos/owner/repo/dispatches");
  assert.equal(payload.client_payload.version, "1.2.3");
  assert.equal(request.headers.Authorization, `Bearer ${CREDENTIAL}`);
});
