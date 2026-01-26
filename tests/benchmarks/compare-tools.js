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
const esVersion = DEFAULT_ES_VERSION;
const tools = [
  {
    name: "es-check",
    run: async (testFiles) => {
      const startTime = performance.now();
      try {
        await execFileAsync("node", [
          "./index.js",
          esVersion,
          ...testFiles,
          "--silent",
        ]);
      } catch (error) {
        // Ignore errors - we're just measuring performance
      }
      return performance.now() - startTime;
    },
  },
  {
    name: "are-you-es5",
    run: async (testFiles) => {
      try {
        fs.accessSync("./node_modules/.bin/are-you-es5");
      } catch (error) {
        log.info("are-you-es5 is not installed. Installing temporarily...");
        await execFileAsync("npm", ["install", "--no-save", "are-you-es5"]);
      }

      const startTime = performance.now();
      try {
        await execFileAsync("./node_modules/.bin/are-you-es5", [
          "--files",
          testFiles.join(","),
        ]);
      } catch (error) {}
      return performance.now() - startTime;
    },
  },
  {
    name: "es-check-bundled",
    run: async (testFiles) => {
      const startTime = performance.now();
      try {
        await execFileAsync("node", [
          "./index.js",
          esVersion,
          ...testFiles,
          "--module",
          "--silent",
        ]);
      } catch (error) {}
      return performance.now() - startTime;
    },
  },
  {
    name: "es-check-light",
    run: async (testFiles) => {
      const startTime = performance.now();
      try {
        await execFileAsync("node", [
          "./index.js",
          esVersion,
          ...testFiles,
          "--light",
          "--silent",
        ]);
      } catch (error) {}
      return performance.now() - startTime;
    },
  },
  {
    name: "es-check-batch-10",
    run: async (testFiles) => {
      const startTime = performance.now();
      try {
        await execFileAsync("node", [
          "./index.js",
          esVersion,
          ...testFiles,
          "--batchSize",
          "10",
          "--silent",
        ]);
      } catch (error) {
        // Ignore errors - we're just measuring performance
      }
      return performance.now() - startTime;
    },
  },
  {
    name: "es-check-batch-50",
    run: async (testFiles) => {
      const startTime = performance.now();
      try {
        await execFileAsync("node", [
          "./index.js",
          esVersion,
          ...testFiles,
          "--batchSize",
          "50",
          "--silent",
        ]);
      } catch (error) {
        // Ignore errors - we're just measuring performance
      }
      return performance.now() - startTime;
    },
  },
  {
    name: "swc/core (rustpack)",
    run: async (testFiles) => {
      try {
        fs.accessSync("./node_modules/@swc/core");
      } catch (error) {
        log.info("@swc/core is not installed. Installing temporarily...");
        await execFileAsync("npm", ["install", "--no-save", "@swc/core"]);
      }

      const swcCheckScript = `
        const swc = require('@swc/core');
        const fs = require('fs');
        const path = require('path');

        async function checkFile(filePath) {
          try {
            const code = fs.readFileSync(filePath, 'utf8');
            await swc.parse(code, {
              syntax: 'ecmascript',
              target: '${esVersion === "es5" ? "es5" : "es6"}',
            });
            return true;
          } catch (error) {
            return false;
          }
        }

        async function main() {
          const files = ${JSON.stringify(testFiles)};
          for (const file of files) {
            await checkFile(file);
          }
        }

        main();
      `;

      const tempScriptPath = path.join(__dirname, "temp-swc-check.js");
      fs.writeFileSync(tempScriptPath, swcCheckScript);

      const startTime = performance.now();
      try {
        await execFileAsync("node", [tempScriptPath]);
      } catch (error) {
      } finally {
        fs.unlinkSync(tempScriptPath);
      }
      return performance.now() - startTime;
    },
  },
  {
    name: "babel-parser",
    run: async (testFiles) => {
      try {
        fs.accessSync("./node_modules/@babel/parser");
      } catch (error) {
        log.info("@babel/parser is not installed. Installing temporarily...");
        await execFileAsync("npm", ["install", "--no-save", "@babel/parser"]);
      }

      const babelCheckScript = `
        const parser = require('@babel/parser');
        const fs = require('fs');
        const path = require('path');

        function checkFile(filePath) {
          try {
            const code = fs.readFileSync(filePath, 'utf8');
            parser.parse(code, {
              sourceType: 'module',
              plugins: [],
            });
            return true;
          } catch (error) {
            return false;
          }
        }

        function main() {
          const files = ${JSON.stringify(testFiles)};
          for (const file of files) {
            checkFile(file);
          }
        }

        main();
      `;

      const tempScriptPath = path.join(__dirname, "temp-babel-check.js");
      fs.writeFileSync(tempScriptPath, babelCheckScript);

      const startTime = performance.now();
      try {
        await execFileAsync("node", [tempScriptPath]);
      } catch (error) {
        // Ignore errors - we're just measuring performance
      } finally {
        // Clean up temp script
        fs.unlinkSync(tempScriptPath);
      }
      return performance.now() - startTime;
    },
  },
  {
    name: "eslint (parser)",
    run: async (testFiles) => {
      const eslintParserScript = `
        const { Linter } = require('eslint');
        const fs = require('fs');

        const linter = new Linter();
        const parserOptions = {
          ecmaVersion: ${esVersion === "es5" ? 5 : 6},
          sourceType: 'script',
        };

        function checkFile(filePath) {
          try {
            const code = fs.readFileSync(filePath, 'utf8');
            const messages = linter.verify(code, { parserOptions, rules: {} }, filePath);
            return !messages.some((message) => message.fatal);
          } catch (error) {
            return false;
          }
        }

        function main() {
          const files = ${JSON.stringify(testFiles)};
          for (const file of files) {
            checkFile(file);
          }
        }

        main();
      `;

      const tempScriptPath = path.join(__dirname, "temp-eslint-parser-check.js");
      fs.writeFileSync(tempScriptPath, eslintParserScript);

      const startTime = performance.now();
      try {
        await execFileAsync("node", [tempScriptPath]);
      } catch (error) {
      } finally {
        fs.unlinkSync(tempScriptPath);
      }
      return performance.now() - startTime;
    },
  },
  {
    name: "eslint (plugin)",
    run: async (testFiles) => {
      try {
        fs.accessSync("./node_modules/eslint");
      } catch (error) {
        log.info("eslint is not installed. Installing temporarily...");
        await execFileAsync("npm", [
          "install",
          "--no-save",
          "eslint",
          "eslint-plugin-es5",
        ]);
      }

      const eslintConfig = {
        plugins: ["es5"],
        extends: "plugin:es5/no-es2015",
        parserOptions: {
          ecmaVersion: 5,
        },
        rules: {
          "es5/no-es2015-syntax": "error",
        },
      };

      const tempConfigPath = path.join(__dirname, ".eslintrc.json");
      fs.writeFileSync(tempConfigPath, JSON.stringify(eslintConfig, null, 2));

      const eslintCheckScript = `
        const { ESLint } = require('eslint');
        const fs = require('fs');
        const path = require('path');

        async function main() {
          const eslint = new ESLint({
            useEslintrc: true,
            overrideConfigFile: '${tempConfigPath.replace(/\\/g, "\\\\")}'
          });

          const files = ${JSON.stringify(testFiles)};


          await eslint.lintFiles(files);
        }

        main();
      `;

      const tempScriptPath = path.join(__dirname, "temp-eslint-check.js");
      fs.writeFileSync(tempScriptPath, eslintCheckScript);

      const startTime = performance.now();
      try {
        await execFileAsync("node", [tempScriptPath]);
      } catch (error) {
      } finally {
        fs.unlinkSync(tempScriptPath);
        fs.unlinkSync(tempConfigPath);
      }
      return performance.now() - startTime;
    },
  },
];

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
        ignore: IGNORE_PATTERNS,
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

  const results = {};

  for (const tool of tools) {
    log.info(`\nBenchmarking ${tool.name}...`);
    const times = [];

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
}

runBenchmarks().catch((error) => {
  log.error("Error running benchmarks:", error);
  process.exit(1);
});
