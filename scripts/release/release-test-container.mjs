import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertCommandSuccess, isMain, normalizeVersion, runCommand } from "./utils.mjs";

function getDependency(dependencies, name, fallback) {
  return dependencies[name] || fallback;
}

function importModule(specifier) {
  return import(specifier);
}

function runChecked(run, command, args, options = {}) {
  const result = run(command, args, options);
  assertCommandSuccess(result, `${command} ${args.join(" ")}`);
}

export function verifyCli(dependencies = {}) {
  const run = getDependency(dependencies, "run", runCommand);
  runChecked(run, "es-check", ["--help"], { capture: true });
  runChecked(run, "es-check", ["--version"]);
  runChecked(run, "es-check", ["es5", "fixtures/es5.js"]);
  const unsupported = run("es-check", ["es5", "fixtures/es6.js"]);
  if (unsupported.status === 0) {
    throw new Error("Expected ES6 fixture to fail an ES5 check");
  }
  runChecked(run, "es-check", ["es6", "fixtures/es6.js"]);
  runChecked(run, "es-check", ["es6", "fixtures/module.js", "--module"]);
  runChecked(run, "es-check", ["es5", "fixtures/es5.js", "--light"]);
}

function installLocalPackage(version, run) {
  runChecked(run, "npm", ["init", "-y"], { capture: true });
  runChecked(run, "npm", ["install", `es-check@${version}`]);
}

export async function verifyApiModule(api) {
  assert.equal(typeof api.runChecks, "function");
  assert.equal(typeof api.loadConfig, "function");
  assert.equal(typeof api.createLogger, "function");
  const config = [
    {
      ecmaVersion: "es5",
      files: ["fixtures/es5.js"],
      checkFeatures: true,
    },
  ];
  const logger = api.createLogger({ silent: true });
  const result = await api.runChecks(config, { logger });
  assert.equal(result.success, true);
}

export async function verifyApi(version, dependencies = {}) {
  const run = getDependency(dependencies, "run", runCommand);
  const requirePackage = getDependency(
    dependencies,
    "requirePackage",
    createRequire(import.meta.url),
  );
  const importPackage = getDependency(dependencies, "importPackage", importModule);
  const normalizedVersion = normalizeVersion(version);
  installLocalPackage(normalizedVersion, run);
  const commonJsApi = requirePackage("es-check");
  const esmApi = await importPackage("es-check");
  await verifyApiModule(commonJsApi);
  await verifyApiModule(esmApi);
  assert.equal(typeof esmApi.default?.runChecks, "function");
}

function createNpmPlan(directory, packageReference) {
  return {
    directory,
    commands: [
      ["npm", ["init", "-y"]],
      ["npm", ["install", packageReference]],
      ["./node_modules/.bin/es-check", ["es5", "fixtures/es5.js"]],
    ],
  };
}

function createPnpmPlan(directory, packageReference) {
  return {
    directory,
    commands: [
      ["npm", ["init", "-y"]],
      ["pnpm", ["add", packageReference]],
      ["pnpm", ["exec", "es-check", "es5", "fixtures/es5.js"]],
    ],
  };
}

function createYarnPlan(directory, packageReference) {
  return {
    directory,
    commands: [
      ["npm", ["init", "-y"]],
      ["yarn", ["add", packageReference]],
      ["./node_modules/.bin/es-check", ["es5", "fixtures/es5.js"]],
    ],
  };
}

export function getPackageManagerPlans(version, rootDirectory) {
  const normalizedVersion = normalizeVersion(version);
  const packageReference = `es-check@${normalizedVersion}`;
  const npmPlan = createNpmPlan(join(rootDirectory, "npm"), packageReference);
  const pnpmPlan = createPnpmPlan(join(rootDirectory, "pnpm"), packageReference);
  const yarnPlan = createYarnPlan(join(rootDirectory, "yarn"), packageReference);
  return [npmPlan, pnpmPlan, yarnPlan];
}

function runPackageManagerPlan(plan, run) {
  mkdirSync(plan.directory, { recursive: true });
  cpSync("fixtures", join(plan.directory, "fixtures"), { recursive: true });
  plan.commands.forEach(([command, args]) => {
    const isNpmInit = command === "npm" && args[0] === "init";
    const capture = isNpmInit;
    runChecked(run, command, args, { cwd: plan.directory, capture });
  });
}

export function testPackageManagers(version, dependencies = {}) {
  const run = getDependency(dependencies, "run", runCommand);
  const createTemp = getDependency(dependencies, "createTemp", mkdtempSync);
  const rootDirectory = createTemp(join(tmpdir(), "es-check-managers-"));
  const plans = getPackageManagerPlans(version, rootDirectory);
  plans.forEach((plan) => runPackageManagerPlan(plan, run));
}

export function verifyCompatibility(dependencies = {}) {
  const run = getDependency(dependencies, "run", runCommand);
  runChecked(run, "es-check", ["--help"], { capture: true });
  runChecked(run, "es-check", ["--verbose", "es6", "fixtures/es6.js"]);
  runChecked(run, "es-check", ["completion", "bash"], { capture: true });
  runChecked(run, "es-check", ["completion", "zsh"], { capture: true });
}

export async function main([mode], env = process.env) {
  if (mode === "cli") return verifyCli();
  if (mode === "api") return verifyApi(env.ES_CHECK_VERSION);
  if (mode === "package-managers") {
    return testPackageManagers(env.ES_CHECK_VERSION);
  }
  if (mode === "compatibility") return verifyCompatibility();
  throw new Error(`Unknown release test mode: ${mode || "missing"}`);
}

if (isMain(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  });
}
