#!/usr/bin/env node

const { execFile } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const {
  POPULAR_LIBRARIES,
  IGNORE_PATTERNS,
  DEFAULT_ITERATIONS,
  DEFAULT_TEST_DIR,
  DEFAULT_ES_VERSION,
  DEFAULT_MAX_FILES,
} = require("./constants");
const { createTestLogger } = require("../helpers");

const log = createTestLogger({ verbose: true });
const execFileAsync = promisify(execFile);

const iterations = parseInt(process.argv[2], 10) || DEFAULT_ITERATIONS;
const testDir = process.argv[3] || DEFAULT_TEST_DIR;
const useRealLibraries = process.argv.includes("--real-libs");
const syntaxEsVersion = DEFAULT_ES_VERSION;
const featureEsVersion = "es2020";
const esCheckCli = "./lib/cli/index.js";
const previousEsCheckCli = "./node_modules/es-check-previous/lib/cli/index.js";
const previousEsCheckVersion = "9.6.3";

async function runCompatibilityCommand(command, args) {
  try {
    await execFileAsync(command, args);
  } catch (error) {
    const expectedCompatibilityFailure = error.code === 1;
    if (!expectedCompatibilityFailure) throw error;
  }
}

function createEsCheckTool({
  name,
  cliPath,
  targetEsVersion = syntaxEsVersion,
  checkFeatures = false,
}) {
  return {
    name,
    run: async (testFiles) => {
      const startTime = performance.now();
      const args = [cliPath, targetEsVersion, ...testFiles, "--silent"];

      if (checkFeatures) {
        args.push("--checkFeatures");
      }

      await runCompatibilityCommand("node", args);
      return performance.now() - startTime;
    },
  };
}

const syntaxTools = [
  createEsCheckTool({ name: "es-check", cliPath: esCheckCli }),
  createEsCheckTool({
    name: `es-check@${previousEsCheckVersion}`,
    cliPath: previousEsCheckCli,
  }),
];

const featureTools = [
  createEsCheckTool({
    name: "es-check --checkFeatures",
    cliPath: esCheckCli,
    targetEsVersion: featureEsVersion,
    checkFeatures: true,
  }),
  createEsCheckTool({
    name: `es-check@${previousEsCheckVersion} --checkFeatures`,
    cliPath: previousEsCheckCli,
    targetEsVersion: featureEsVersion,
    checkFeatures: true,
  }),
];

function createInProcessTool({
  name,
  runChecks,
  targetEsVersion = syntaxEsVersion,
  checkFeatures = false,
}) {
  const runInProcessCheck = (testFiles) =>
    Promise.resolve(
      runChecks(
        [
          {
            ecmaVersion: targetEsVersion,
            files: testFiles,
            checkFeatures,
            cache: false,
          },
        ],
        {},
      ),
    );

  return {
    name,
    warmup: runInProcessCheck,
    run: async (testFiles) => {
      const startTime = performance.now();
      await runInProcessCheck(testFiles);
      return performance.now() - startTime;
    },
  };
}

function createInProcessTools() {
  const current = require("../../lib");

  try {
    const previous = require("es-check-previous");
    return [
      createInProcessTool({
        name: "es-check Node API --checkFeatures",
        runChecks: current.runChecks,
        targetEsVersion: featureEsVersion,
        checkFeatures: true,
      }),
      createInProcessTool({
        name: `es-check@${previousEsCheckVersion} Node API --checkFeatures`,
        runChecks: previous.runChecks,
        targetEsVersion: featureEsVersion,
        checkFeatures: true,
      }),
    ];
  } catch (error) {
    log.warn(`Skipping previous-version Node API benchmark: ${error.message}`);
    return [
      createInProcessTool({
        name: "es-check Node API --checkFeatures",
        runChecks: current.runChecks,
        targetEsVersion: featureEsVersion,
        checkFeatures: true,
      }),
    ];
  }
}

async function findJsFiles(dir) {
  const files = [];

  try {
    const { default: glob } = await import("fast-glob");
    const ignorePatterns = IGNORE_PATTERNS.filter(
      (p) => p !== "**/test/**" && p !== "**/tests/**",
    );
    return await glob(`${dir}/**/*.js`, {
      ignore: ignorePatterns,
      absolute: true,
    });
  } catch (error) {
    log.error("Error finding JS files:", error);
    return [];
  }
}

async function getLibraryFiles(libraries) {
  const files = [];
  const ignorePatterns = IGNORE_PATTERNS.filter(
    (pattern) => pattern !== "**/node_modules/**",
  );
  log.info(`\nScanning real-world libraries: ${libraries.join(", ")}...`);

  for (const lib of libraries) {
    const libPath = path.join("./node_modules", lib);

    if (!fs.existsSync(libPath)) {
      log.warn(`  ${lib}: not installed, skipping`);
      continue;
    }

    try {
      const { default: glob } = await import("fast-glob");
      const libFiles = await glob(`${libPath}/**/*.js`, {
        ignore: ignorePatterns,
        absolute: true,
      });
      log.info(`  ${lib}: found ${libFiles.length} files`);
      files.push(...libFiles);
    } catch (error) {
      log.warn(`  ${lib}: could not scan - ${error.message}`);
    }
  }

  return files;
}

async function benchmarkTools(tools, filesToTest, heading) {
  log.info(`\n=== ${heading} ===`);
  const results = {};

  for (const tool of tools) {
    log.info(`\nBenchmarking ${tool.name}...`);
    const times = [];

    if (tool.warmup) {
      await tool.warmup(filesToTest);
    }

    for (let i = 0; i < iterations; i++) {
      process.stdout.write(`  Iteration ${i + 1}/${iterations}... `);
      const time = await tool.run(filesToTest);
      times.push(time);
      process.stdout.write(`${time.toFixed(2)}ms\n`);
    }

    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    results[tool.name] = { times, avg, min, max };

    log.info(`  Average: ${avg.toFixed(2)}ms`);
    log.info(`  Min: ${min.toFixed(2)}ms`);
    log.info(`  Max: ${max.toFixed(2)}ms`);
  }

  log.info("\n=== COMPARISON ===");
  const sortedTools = Object.keys(results).sort(
    (a, b) => results[a].avg - results[b].avg,
  );

  log.info("Tools ranked by average execution time (fastest first):");
  sortedTools.forEach((toolName, index) => {
    const { avg } = results[toolName];
    const fastestAvg = results[sortedTools[0]].avg;
    const percentSlower =
      index === 0 ? 0 : ((avg - fastestAvg) / fastestAvg) * 100;

    log.info(
      `${index + 1}. ${toolName}: ${avg.toFixed(2)}ms ${index === 0 ? "(fastest)" : `(${percentSlower.toFixed(2)}% slower)`}`,
    );
  });

  log.info("\n=== MARKDOWN TABLE ===");
  log.info(
    "| Tool | Average (ms) | Min (ms) | Max (ms) | Relative Performance |",
  );
  log.info(
    "|------|-------------|----------|----------|----------------------|",
  );

  sortedTools.forEach((toolName) => {
    const { avg, min, max } = results[toolName];
    const fastestAvg = results[sortedTools[0]].avg;
    const relativePerf =
      toolName === sortedTools[0]
        ? "1x (fastest)"
        : `${(avg / fastestAvg).toFixed(2)}x slower`;

    log.info(
      `| ${toolName} | ${avg.toFixed(2)} | ${min.toFixed(2)} | ${max.toFixed(2)} | ${relativePerf} |`,
    );
  });

  return results;
}

function logRegressionCheck(results, currentTool, previousTool) {
  const current = results[currentTool];
  const previous = results[previousTool];
  if (current && previous) {
    const delta = current.avg - previous.avg;
    const percent = (delta / previous.avg) * 100;
    const direction = delta > 0 ? "slower" : "faster";
    log.info("\n=== ES-CHECK REGRESSION CHECK ===");
    log.info(
      `es-check current: ${current.avg.toFixed(2)}ms; previous ${previousEsCheckVersion}: ${previous.avg.toFixed(2)}ms`,
    );
    log.info(
      `Current is ${Math.abs(percent).toFixed(2)}% ${direction} than ${previousEsCheckVersion}.`,
    );
  }
}

async function runBenchmarks() {
  log.info(`Running benchmarks (${iterations} iterations each)...`);

  let testFiles;

  if (useRealLibraries) {
    log.info("Using real-world libraries for benchmarking...");
    testFiles = await getLibraryFiles(POPULAR_LIBRARIES);
  } else {
    log.info(`Finding JavaScript files in ${testDir}...`);
    testFiles = await findJsFiles(testDir);
  }

  log.info(`Found ${testFiles.length} JavaScript files to test`);

  if (testFiles.length === 0) {
    log.error(
      "No JavaScript files found to test. Please specify a directory with JS files.",
    );
    process.exit(1);
  }

  const maxFiles = parseInt(process.env.MAX_FILES, 10) || DEFAULT_MAX_FILES;
  const filesToTest =
    testFiles.length > maxFiles ? testFiles.slice(0, maxFiles) : testFiles;

  log.info(`Testing with ${filesToTest.length} files`);

  const syntaxResults = await benchmarkTools(
    syntaxTools,
    filesToTest,
    "SYNTAX COMPATIBILITY",
  );
  logRegressionCheck(
    syntaxResults,
    "es-check",
    `es-check@${previousEsCheckVersion}`,
  );

  const featureResults = await benchmarkTools(
    featureTools,
    filesToTest,
    `FEATURE COMPATIBILITY (${featureEsVersion})`,
  );
  logRegressionCheck(
    featureResults,
    "es-check --checkFeatures",
    `es-check@${previousEsCheckVersion} --checkFeatures`,
  );

  const packageFiles = await getLibraryFiles(POPULAR_LIBRARIES);
  const inProcessFiles =
    packageFiles.length > maxFiles
      ? packageFiles.slice(0, maxFiles)
      : packageFiles;
  const hasInProcessFiles = inProcessFiles.length > 0;

  if (hasInProcessFiles) {
    log.info(`\nTesting Node API with ${inProcessFiles.length} package files`);
    const inProcessResults = await benchmarkTools(
      createInProcessTools(),
      inProcessFiles,
      `IN-PROCESS NODE API (${featureEsVersion})`,
    );
    logRegressionCheck(
      inProcessResults,
      "es-check Node API --checkFeatures",
      `es-check@${previousEsCheckVersion} Node API --checkFeatures`,
    );
  }
}

runBenchmarks().catch((error) => {
  log.error("Error running benchmarks:", error);
  process.exit(1);
});
