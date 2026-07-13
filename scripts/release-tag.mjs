#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const VERSION_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function git(args, options = {}) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (options.allowFailure || result.status === 0) {
    return {
      status: result.status,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  }

  throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
}

function readPackageVersion() {
  const manifest = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf8"),
  );
  if (typeof manifest.version !== "string") {
    throw new Error("package.json version is missing");
  }
  return manifest.version;
}

function formatTagName(version) {
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(`Invalid package version: ${version}`);
  }
  return `v${version}`;
}

function assertMissingTag(tagName, dryRun) {
  const localTag = git(
    ["rev-parse", "-q", "--verify", `refs/tags/${tagName}`],
    {
      allowFailure: true,
    },
  );
  if (localTag.status === 0)
    throw new Error(`Local tag already exists: ${tagName}`);

  if (dryRun) return;

  const remoteTag = git(
    ["ls-remote", "--exit-code", "--tags", "origin", `refs/tags/${tagName}`],
    { allowFailure: true },
  );
  if (remoteTag.status === 0) {
    throw new Error(`Remote tag already exists: ${tagName}`);
  }
  if (remoteTag.status !== 2) {
    throw new Error(
      remoteTag.stderr || `Unable to check remote tag: ${tagName}`,
    );
  }
}

function assertReleaseReady(tagName, dryRun) {
  const branch = git(["branch", "--show-current"]).stdout;
  if (branch !== "main")
    throw new Error("Release tags must be created from main");

  const status = git(["status", "--short"]).stdout;
  if (status)
    throw new Error("Working tree must be clean before tagging a release");

  assertMissingTag(tagName, dryRun);
  if (dryRun) return;

  git(["fetch", "origin", "main", "--tags"]);
  const head = git(["rev-parse", "HEAD"]).stdout;
  const upstream = git(["rev-parse", "origin/main"]).stdout;
  if (head !== upstream) {
    throw new Error("Local main must match origin/main before tagging");
  }
}

function run() {
  const dryRun = process.argv.includes("--dry-run");
  const version = readPackageVersion();
  const tagName = formatTagName(version);

  assertReleaseReady(tagName, dryRun);

  if (dryRun) {
    console.log(`Dry run: would create and push ${tagName}`);
    return;
  }

  git(["tag", "--annotate", tagName, "--message", `Release ${version}`]);
  const push = git(["push", "origin", `refs/tags/${tagName}`], {
    allowFailure: true,
  });
  if (push.status === 0) {
    console.log(`Pushed ${tagName}`);
    return;
  }

  git(["tag", "--delete", tagName], { allowFailure: true });
  throw new Error(push.stderr || `Unable to push ${tagName}`);
}

try {
  run();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
