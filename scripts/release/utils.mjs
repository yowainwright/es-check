import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const DIST_TAG_PATTERN = /^[a-z][a-z0-9._-]*$/;

export function requireValue(name, value) {
  const isMissing = typeof value !== "string" || value.trim() === "";
  if (isMissing) throw new Error(`${name} is required`);
  if (/[\r\n]/.test(value)) throw new Error(`${name} must be one line`);
  return value;
}

export function normalizeVersion(value) {
  const version = requireValue("version", value).replace(/^v/, "");
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(`Invalid version: ${value}`);
  }
  return version;
}

export function resolveDistTag(version) {
  const normalizedVersion = normalizeVersion(version);
  const prerelease = normalizedVersion.match(/-(alpha|beta|rc)(?:[.-]|$)/);
  return prerelease?.[1] || "latest";
}

export function validateDistTag(value) {
  const distTag = requireValue("dist tag", value);
  if (!DIST_TAG_PATTERN.test(distTag)) {
    throw new Error(`Invalid dist tag: ${distTag}`);
  }
  return distTag;
}

export function isPrerelease(version) {
  return normalizeVersion(version).includes("-");
}

export function parsePackOutput(output) {
  const jsonStart = output.indexOf("[");
  if (jsonStart < 0) throw new Error("npm pack JSON output not found");
  const [packageData] = JSON.parse(output.slice(jsonStart));
  return requireValue("npm tarball filename", packageData?.filename);
}

export function appendGithubOutput(name, value, outputPath) {
  const outputName = requireValue("output name", name);
  const outputValue = requireValue(outputName, value);
  const githubOutput = requireValue("GITHUB_OUTPUT", outputPath);
  appendFileSync(githubOutput, `${outputName}=${outputValue}\n`);
}

export function runCommand(command, args, options = {}) {
  const stdio = options.capture ? ["ignore", "pipe", "pipe"] : "inherit";
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
    stdio,
  });
  if (result.error) throw result.error;
  return {
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

export function assertCommandSuccess(result, label) {
  if (result.status === 0) return;
  const detail = result.stderr.trim();
  throw new Error(detail || `${label} failed`);
}

export function log(message) {
  process.stdout.write(`${message}\n`);
}

export function isMain(moduleUrl) {
  if (!process.argv[1]) return false;
  return fileURLToPath(moduleUrl) === resolve(process.argv[1]);
}
