import { copyFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  appendGithubOutput,
  assertCommandSuccess,
  isMain,
  isPrerelease,
  log,
  normalizeVersion,
  parsePackOutput,
  requireValue,
  resolveDistTag,
  runCommand,
  validateDistTag,
} from "./utils.mjs";

const PACKAGE_NAME = "es-check";

function getDependency(dependencies, name, fallback) {
  return dependencies[name] || fallback;
}

export function readPackageVersion(manifestPath) {
  const packagePath = manifestPath || join(process.cwd(), "package.json");
  const manifest = JSON.parse(readFileSync(packagePath, "utf8"));
  return normalizeVersion(manifest.version);
}

export function writeDistTag({ version, outputPath }, dependencies = {}) {
  const writeOutput = getDependency(
    dependencies,
    "writeOutput",
    appendGithubOutput,
  );
  const distTag = resolveDistTag(version);
  writeOutput("tag", distTag, outputPath);
  return distTag;
}

export function packPackage({ outputPath }, dependencies = {}) {
  const run = getDependency(dependencies, "run", runCommand);
  const writeOutput = getDependency(
    dependencies,
    "writeOutput",
    appendGithubOutput,
  );
  const result = run("npm", ["pack", "--ignore-scripts", "--json"], {
    capture: true,
  });
  assertCommandSuccess(result, "npm pack");
  const tarball = parsePackOutput(result.stdout);
  writeOutput("tarball", tarball, outputPath);
  return tarball;
}

export function prepareAttestation(inputs, dependencies = {}) {
  const copyFile = getDependency(dependencies, "copyFile", copyFileSync);
  const writeOutput = getDependency(
    dependencies,
    "writeOutput",
    appendGithubOutput,
  );
  const tarball = requireValue("TARBALL", inputs.tarball);
  const bundlePath = requireValue("ATTESTATION_BUNDLE", inputs.bundlePath);
  const sigstoreBundle = `${tarball}.sigstore.json`;
  copyFile(bundlePath, sigstoreBundle);
  writeOutput("sigstore_bundle", sigstoreBundle, inputs.outputPath);
  return sigstoreBundle;
}

function packageExists(packageReference, run) {
  const result = run("npm", ["view", packageReference, "version"], {
    capture: true,
  });
  return result.status === 0;
}

function createPublishArgs(tarball, distTag) {
  return [
    "publish",
    tarball,
    "--provenance",
    "--access",
    "public",
    "--tag",
    distTag,
  ];
}

export function publishNpm(inputs, dependencies = {}) {
  const run = getDependency(dependencies, "run", runCommand);
  const writeLog = getDependency(dependencies, "log", log);
  const tarball = requireValue("TARBALL", inputs.tarball);
  const distTag = validateDistTag(inputs.distTag);
  const version = readPackageVersion(inputs.manifestPath);
  const packageReference = `${PACKAGE_NAME}@${version}`;
  if (packageExists(packageReference, run)) {
    writeLog(`${packageReference} is already published`);
    return false;
  }
  const result = run("npm", createPublishArgs(tarball, distTag));
  assertCommandSuccess(result, "npm publish");
  return true;
}

function createReleaseArgs({ version, tarball, sigstoreBundle }) {
  const prereleaseArgs = isPrerelease(version) ? ["--prerelease"] : [];
  return [
    "release",
    "create",
    version,
    tarball,
    sigstoreBundle,
    "--title",
    version,
    "--generate-notes",
    ...prereleaseArgs,
  ];
}

function getReleaseInputs(inputs) {
  const version = requireValue("VERSION", inputs.version);
  normalizeVersion(version);
  const tarball = requireValue("TARBALL", inputs.tarball);
  const sigstoreBundle = requireValue("SIGSTORE_BUNDLE", inputs.sigstoreBundle);
  return { version, tarball, sigstoreBundle };
}

function getReleaseArgs(releaseExists, release) {
  if (!releaseExists) return createReleaseArgs(release);
  const { version, tarball, sigstoreBundle } = release;
  return ["release", "upload", version, tarball, sigstoreBundle, "--clobber"];
}

export function publishGithub(inputs, dependencies = {}) {
  const run = getDependency(dependencies, "run", runCommand);
  const release = getReleaseInputs(inputs);
  const viewResult = run("gh", ["release", "view", release.version], {
    capture: true,
  });
  const releaseExists = viewResult.status === 0;
  const args = getReleaseArgs(releaseExists, release);
  const result = run("gh", args);
  assertCommandSuccess(result, "GitHub release publish");
  return releaseExists ? "uploaded" : "created";
}

function prepareAttestationFromEnv(env) {
  return prepareAttestation({
    tarball: env.TARBALL,
    bundlePath: env.ATTESTATION_BUNDLE,
    outputPath: env.GITHUB_OUTPUT,
  });
}

function publishGithubFromEnv(env) {
  return publishGithub({
    version: env.VERSION,
    tarball: env.TARBALL,
    sigstoreBundle: env.SIGSTORE_BUNDLE,
  });
}

export function main([command], env = process.env) {
  const outputPath = env.GITHUB_OUTPUT;
  if (command === "resolve-dist-tag") {
    return writeDistTag({ version: env.VERSION, outputPath });
  }
  if (command === "pack") return packPackage({ outputPath });
  if (command === "prepare-attestation") return prepareAttestationFromEnv(env);
  if (command === "publish-npm") {
    return publishNpm({ tarball: env.TARBALL, distTag: env.DIST_TAG });
  }
  if (command === "publish-github") return publishGithubFromEnv(env);
  throw new Error(`Unknown publish command: ${command || "missing"}`);
}

if (isMain(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  }
}
