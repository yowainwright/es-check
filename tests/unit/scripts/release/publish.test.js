"use strict";

const assert = require("node:assert/strict");
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { test } = require("node:test");

const publishModule = import("../../../../scripts/release/publish.mjs");
const utilsModule = import("../../../../scripts/release/utils.mjs");

const NPM_PUBLISH_ARGS = [
  "publish",
  "package.tgz",
  "--provenance",
  "--access",
  "public",
  "--tag",
  "beta",
];
const RELEASE_UPLOAD_ARGS = [
  "release",
  "upload",
  "v1.2.3",
  "package.tgz",
  "bundle.json",
  "--clobber",
];
const RELEASE_CREATE_ARGS = [
  "release",
  "create",
  "v1.2.3-rc.1",
  "package.tgz",
  "bundle.json",
  "--title",
  "v1.2.3-rc.1",
  "--generate-notes",
  "--prerelease",
];

function createRunner(results) {
  const calls = [];
  const run = (command, args, options) => {
    const result = results[calls.length];
    calls.push({ command, args, options });
    return result;
  };
  return { calls, run };
}

function withManifest(version, callback) {
  const directory = mkdtempSync(join(tmpdir(), "es-check-release-"));
  const manifestPath = join(directory, "package.json");
  writeFileSync(manifestPath, JSON.stringify({ version }));
  try {
    return callback(manifestPath, directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("resolveDistTag returns stable and prerelease tags", async () => {
  const { resolveDistTag } = await utilsModule;
  assert.equal(resolveDistTag("v1.2.3"), "latest");
  assert.equal(resolveDistTag("1.2.3-alpha.1"), "alpha");
  assert.equal(resolveDistTag("1.2.3-beta.2"), "beta");
  assert.equal(resolveDistTag("1.2.3-rc.3"), "rc");
});

test("resolveDistTag rejects invalid versions", async () => {
  const { resolveDistTag } = await utilsModule;
  assert.throws(() => resolveDistTag("release/latest"), /Invalid version/);
});

test("parsePackOutput accepts output before the JSON", async () => {
  const { parsePackOutput } = await utilsModule;
  const output = 'prepare output\n[{"filename":"es-check-1.2.3.tgz"}]';
  assert.equal(parsePackOutput(output), "es-check-1.2.3.tgz");
});

test("packPackage writes the tarball output", async () => {
  const { packPackage } = await publishModule;
  const packResult = {
    status: 0,
    stdout: '[{"filename":"es-check-1.2.3.tgz"}]',
    stderr: "",
  };
  const runner = createRunner([packResult]);
  const outputs = [];
  const writeOutput = (...args) => outputs.push(args);
  const tarball = packPackage({}, { run: runner.run, writeOutput });
  assert.equal(tarball, "es-check-1.2.3.tgz");
  assert.deepEqual(runner.calls[0].args, [
    "pack",
    "--ignore-scripts",
    "--json",
  ]);
  assert.deepEqual(outputs[0].slice(0, 2), ["tarball", tarball]);
});

test("prepareAttestation copies and exposes the bundle", async () => {
  const { prepareAttestation } = await publishModule;
  withManifest("1.2.3", (_manifestPath, directory) => {
    const tarball = join(directory, "package.tgz");
    const bundlePath = join(directory, "bundle.json");
    const outputs = [];
    writeFileSync(bundlePath, "bundle");
    const sigstoreBundle = prepareAttestation(
      { tarball, bundlePath, outputPath: "output" },
      { writeOutput: (...args) => outputs.push(args) },
    );
    assert.equal(readFileSync(sigstoreBundle, "utf8"), "bundle");
    assert.deepEqual(outputs[0].slice(0, 2), [
      "sigstore_bundle",
      sigstoreBundle,
    ]);
  });
});

test("publishNpm skips versions already on npm", async () => {
  const { publishNpm } = await publishModule;
  withManifest("1.2.3", (manifestPath) => {
    const runner = createRunner([{ status: 0, stdout: "1.2.3", stderr: "" }]);
    const messages = [];
    const inputs = { tarball: "package.tgz", distTag: "latest", manifestPath };
    const dependencies = {
      run: runner.run,
      log: (value) => messages.push(value),
    };
    assert.equal(publishNpm(inputs, dependencies), false);
    assert.equal(runner.calls.length, 1);
    assert.deepEqual(messages, ["es-check@1.2.3 is already published"]);
  });
});

test("publishNpm publishes missing versions", async () => {
  const { publishNpm } = await publishModule;
  withManifest("1.2.3", (manifestPath) => {
    const missing = { status: 1, stdout: "", stderr: "missing" };
    const published = { status: 0, stdout: "", stderr: "" };
    const runner = createRunner([missing, published]);
    const inputs = { tarball: "package.tgz", distTag: "beta", manifestPath };
    assert.equal(publishNpm(inputs, { run: runner.run }), true);
    assert.deepEqual(runner.calls[1].args, NPM_PUBLISH_ARGS);
  });
});

test("publishGithub uploads assets for an existing release", async () => {
  const { publishGithub } = await publishModule;
  const found = { status: 0, stdout: "", stderr: "" };
  const uploaded = { status: 0, stdout: "", stderr: "" };
  const runner = createRunner([found, uploaded]);
  const inputs = {
    version: "v1.2.3",
    tarball: "package.tgz",
    sigstoreBundle: "bundle.json",
  };
  assert.equal(publishGithub(inputs, { run: runner.run }), "uploaded");
  assert.deepEqual(runner.calls[1].args, RELEASE_UPLOAD_ARGS);
});

test("publishGithub creates prereleases", async () => {
  const { publishGithub } = await publishModule;
  const missing = { status: 1, stdout: "", stderr: "missing" };
  const created = { status: 0, stdout: "", stderr: "" };
  const runner = createRunner([missing, created]);
  const inputs = {
    version: "v1.2.3-rc.1",
    tarball: "package.tgz",
    sigstoreBundle: "bundle.json",
  };
  assert.equal(publishGithub(inputs, { run: runner.run }), "created");
  assert.deepEqual(runner.calls[1].args, RELEASE_CREATE_ARGS);
});
