import { writeFileSync } from "node:fs";
import {
  appendGithubOutput,
  assertCommandSuccess,
  isMain,
  log,
  normalizeVersion,
  requireValue,
  runCommand,
} from "./utils.mjs";

const PACKAGE_NAME = "es-check";
const IMAGE_NAME = "es-check-release-test";
const CONTAINER_MODES = new Set(["cli", "api", "package-managers", "compatibility"]);
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const TRAVERSAL_SEGMENTS = new Set([".", ".."]);
const REPORT_COVERAGE = [
  "- CLI installation",
  "- CLI ES version checks",
  "- CommonJS API",
  "- ESM API",
  "- NPM install",
  "- PNPM install",
  "- Yarn install",
  "- Completion generation",
];

function getDependency(dependencies, name, fallback) {
  return dependencies[name] || fallback;
}

function getRequestedVersion({ inputVersion, releaseTag }) {
  if (inputVersion?.trim()) return inputVersion;
  if (releaseTag?.trim()) return releaseTag;
  return null;
}

function getLatestVersion(run) {
  const result = run("npm", ["view", PACKAGE_NAME, "version"], {
    capture: true,
  });
  assertCommandSuccess(result, "npm version lookup");
  return result.stdout.trim();
}

export function resolveVersion(inputs, dependencies = {}) {
  const run = getDependency(dependencies, "run", runCommand);
  const writeOutput = getDependency(dependencies, "writeOutput", appendGithubOutput);
  const writeLog = getDependency(dependencies, "log", log);
  const requestedVersion = getRequestedVersion(inputs);
  const candidate = requestedVersion || getLatestVersion(run);
  const version = normalizeVersion(candidate);
  writeOutput("version", version, inputs.outputPath);
  writeLog(`Testing es-check version: ${version}`);
  return version;
}

function createRetryOptions(options) {
  const attempts = options.attempts ?? 30;
  const delayMs = options.delayMs ?? 30_000;
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error("attempts must be a positive integer");
  }
  if (!Number.isInteger(delayMs) || delayMs < 0) {
    throw new Error("delayMs must be a non-negative integer");
  }
  return { attempts, delayMs };
}

function delay(duration) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, duration));
}

async function checkPackage(version, attempt, retry, dependencies) {
  const result = dependencies.run("npm", ["view", `${PACKAGE_NAME}@${version}`, "version"], {
    capture: true,
  });
  if (result.status === 0) {
    dependencies.log(`${PACKAGE_NAME}@${version} is available on npm`);
    return;
  }
  if (attempt === retry.attempts) {
    throw new Error(`${PACKAGE_NAME}@${version} was not available in time`);
  }
  dependencies.log(`Attempt ${attempt}/${retry.attempts}: package not available`);
  await dependencies.sleep(retry.delayMs);
  return checkPackage(version, attempt + 1, retry, dependencies);
}

export function waitForPackage(version, options = {}, dependencies = {}) {
  const normalizedVersion = normalizeVersion(version);
  const retry = createRetryOptions(options);
  const retryDependencies = {
    run: getDependency(dependencies, "run", runCommand),
    sleep: getDependency(dependencies, "sleep", delay),
    log: getDependency(dependencies, "log", log),
  };
  return checkPackage(normalizedVersion, 1, retry, retryDependencies);
}

export function buildTestImage(version, dependencies = {}) {
  const run = getDependency(dependencies, "run", runCommand);
  const normalizedVersion = normalizeVersion(version);
  const buildArg = `ES_CHECK_VERSION=${normalizedVersion}`;
  const args = [
    "build",
    "--build-arg",
    buildArg,
    "--file",
    "scripts/release/Dockerfile",
    "--tag",
    IMAGE_NAME,
    ".",
  ];
  const result = run("docker", args);
  assertCommandSuccess(result, "release test image build");
}

export function runContainerTest(mode, version, dependencies = {}) {
  if (!CONTAINER_MODES.has(mode)) {
    throw new Error(`Unknown container test mode: ${mode}`);
  }
  const run = getDependency(dependencies, "run", runCommand);
  const normalizedVersion = normalizeVersion(version);
  const versionEnv = `ES_CHECK_VERSION=${normalizedVersion}`;
  const args = ["run", "--rm", "--env", versionEnv, IMAGE_NAME, mode];
  const result = run("docker", args);
  assertCommandSuccess(result, `release test ${mode}`);
}

export function createSummary(version) {
  const normalizedVersion = normalizeVersion(version);
  return [
    "Test Summary",
    "============",
    `Tested es-check version: ${normalizedVersion}`,
    "CLI installation: PASSED",
    "Node API and ESM exports: PASSED",
    "NPM, PNPM, and Yarn installs: PASSED",
    "Performance and compatibility checks: PASSED",
  ].join("\n");
}

export function createReport({ version, status, date }) {
  const normalizedVersion = normalizeVersion(version);
  const reportStatus = requireValue("STATUS", status);
  const reportDate = requireValue("date", date);
  const heading = [
    "# ES Check Release Test Report",
    "",
    `**Version Tested:** ${normalizedVersion}`,
    `**Test Date:** ${reportDate}`,
    `**Status:** ${reportStatus}`,
    "",
    "## Test Coverage",
  ];
  const summary = ["", "## Summary", "Published package release tests completed."];
  return [...heading, ...REPORT_COVERAGE, ...summary, ""].join("\n");
}

export function writeReport(inputs, dependencies = {}) {
  const writeFile = getDependency(dependencies, "writeFile", writeFileSync);
  const writeLog = getDependency(dependencies, "log", log);
  const report = createReport(inputs);
  const reportPath = inputs.reportPath || "test-report.md";
  writeFile(reportPath, report);
  writeLog(report);
  return reportPath;
}

export function parseRepository(value) {
  const repository = requireValue("REPOSITORY", value);
  const segments = repository.split("/");
  const hasTraversal = segments.some((segment) => TRAVERSAL_SEGMENTS.has(segment));
  const isInvalid = !REPOSITORY_PATTERN.test(repository) || hasTraversal;
  if (isInvalid) {
    throw new Error("REPOSITORY must use owner/repo format");
  }
  return repository;
}

function createDispatchHeaders(token) {
  const accessToken = requireValue("TOKEN", token);
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function createDispatchPayload(inputs) {
  return {
    event_type: "es-check-release",
    client_payload: {
      version: normalizeVersion(inputs.version),
      release_url: inputs.releaseUrl || "Manual trigger",
      trigger_type: requireValue("TRIGGER_TYPE", inputs.triggerType),
    },
  };
}

export async function dispatchExternalTests(inputs, dependencies = {}) {
  const fetchRequest = getDependency(dependencies, "fetch", globalThis.fetch);
  if (typeof fetchRequest !== "function") throw new Error("fetch is unavailable");
  const repository = parseRepository(inputs.repository);
  const url = `https://api.github.com/repos/${repository}/dispatches`;
  const headers = createDispatchHeaders(inputs.token);
  const payload = createDispatchPayload(inputs);
  const requestBody = JSON.stringify(payload);
  const response = await fetchRequest(url, {
    method: "POST",
    headers,
    body: requestBody,
  });
  if (!response.ok) {
    throw new Error(`External test dispatch failed with ${response.status}`);
  }
}

function resolveVersionFromEnv(env) {
  return resolveVersion({
    inputVersion: env.INPUT_VERSION,
    releaseTag: env.RELEASE_TAG,
    outputPath: env.GITHUB_OUTPUT,
  });
}

function dispatchFromEnv(env) {
  return dispatchExternalTests({
    repository: env.REPOSITORY,
    token: env.TOKEN,
    version: env.VERSION,
    releaseUrl: env.RELEASE_URL,
    triggerType: env.TRIGGER_TYPE,
  });
}

function writeReportFromEnv(env) {
  const isoDate = new Date().toISOString();
  const readableDate = isoDate.replace("T", " ");
  const date = readableDate.replace(/\.\d{3}Z$/, " UTC");
  return writeReport({ version: env.VERSION, status: env.STATUS, date });
}

export async function main([command, mode], env = process.env) {
  if (command === "resolve-version") return resolveVersionFromEnv(env);
  if (command === "wait-for-package") return waitForPackage(env.VERSION);
  if (command === "build-image") return buildTestImage(env.VERSION);
  if (command === "run-container") return runContainerTest(mode, env.VERSION);
  if (command === "summary") return log(createSummary(env.VERSION));
  if (command === "dispatch") return dispatchFromEnv(env);
  if (command === "report") return writeReportFromEnv(env);
  throw new Error(`Unknown release test command: ${command || "missing"}`);
}

if (isMain(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  });
}
