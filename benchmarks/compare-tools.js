#!/usr/bin/env node

/**
 * Benchmark script to compare es-check with similar tools
 *
 * This script measures the performance of es-check and other similar tools
 * like are-you-es5 when checking JavaScript files for ES compatibility.
 *
 * Usage:
 *   node benchmarks/compare-tools.js [iterations] [testDir]
 *
 * Example:
 *   node benchmarks/compare-tools.js 5 ./test-files
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const execFileAsync = promisify(execFile);

// Configuration
const iterations = parseInt(process.argv[2], 10) || 5;
const testDir = process.argv[3] || './node_modules';
const esVersion = 'es5';

// Tools to benchmark
const tools = [
  {
    name: 'es-check',
    // Run es-check on all JS files in the test directory
    run: async (testFiles) => {
      const startTime = performance.now();
      try {
        await execFileAsync('node', [
          './index.js',
          esVersion,
          ...testFiles,
          '--silent'
        ]);
      } catch (error) {
        // Ignore errors - we're just measuring performance
      }
      return performance.now() - startTime;
    }
  },
  {
    name: 'are-you-es5',
    // Run are-you-es5 on the test directory
    run: async (testFiles) => {
      // Check if are-you-es5 is installed
      try {
        fs.accessSync('./node_modules/.bin/are-you-es5');
      } catch (error) {
        console.log('are-you-es5 is not installed. Installing temporarily...');
        await execFileAsync('npm', ['install', '--no-save', 'are-you-es5']);
      }

      const startTime = performance.now();
      try {
        await execFileAsync('./node_modules/.bin/are-you-es5', [
          '--files',
          testFiles.join(',')
        ]);
      } catch (error) {
        // Ignore errors - we're just measuring performance
      }
      return performance.now() - startTime;
    }
  },
  {
    name: 'es-check-bundled',
    // Run es-check with the --module flag to simulate checking bundled code
    run: async (testFiles) => {
      const startTime = performance.now();
      try {
        await execFileAsync('node', [
          './index.js',
          esVersion,
          ...testFiles,
          '--module',
          '--silent'
        ]);
      } catch (error) {
        // Ignore errors - we're just measuring performance
      }
      return performance.now() - startTime;
    }
  },
  {
    name: 'swc/core (rustpack)',
    // Run SWC to check ES compatibility
    run: async (testFiles) => {
      // Check if @swc/core is installed
      try {
        fs.accessSync('./node_modules/@swc/core');
      } catch (error) {
        console.log('@swc/core is not installed. Installing temporarily...');
        await execFileAsync('npm', ['install', '--no-save', '@swc/core']);
      }

      // Create a simple script to check files with SWC
      const swcCheckScript = `
        const swc = require('@swc/core');
        const fs = require('fs');
        const path = require('path');

        async function checkFile(filePath) {
          try {
            const code = fs.readFileSync(filePath, 'utf8');
            await swc.parse(code, {
              syntax: 'ecmascript',
              target: '${esVersion === 'es5' ? 'es5' : 'es6'}',
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

      const tempScriptPath = path.join(__dirname, 'temp-swc-check.js');
      fs.writeFileSync(tempScriptPath, swcCheckScript);

      const startTime = performance.now();
      try {
        await execFileAsync('node', [tempScriptPath]);
      } catch (error) {
        // Ignore errors - we're just measuring performance
      } finally {
        // Clean up temp script
        fs.unlinkSync(tempScriptPath);
      }
      return performance.now() - startTime;
    }
  },
  {
    name: 'babel-parser',
    // Run Babel parser to check ES compatibility
    run: async (testFiles) => {
      // Check if @babel/parser is installed
      try {
        fs.accessSync('./node_modules/@babel/parser');
      } catch (error) {
        console.log('@babel/parser is not installed. Installing temporarily...');
        await execFileAsync('npm', ['install', '--no-save', '@babel/parser']);
      }

      // Create a simple script to check files with Babel parser
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

      const tempScriptPath = path.join(__dirname, 'temp-babel-check.js');
      fs.writeFileSync(tempScriptPath, babelCheckScript);

      const startTime = performance.now();
      try {
        await execFileAsync('node', [tempScriptPath]);
      } catch (error) {
        // Ignore errors - we're just measuring performance
      } finally {
        // Clean up temp script
        fs.unlinkSync(tempScriptPath);
      }
      return performance.now() - startTime;
    }
  },
  {
    name: 'acorn (direct)',
    // Run Acorn parser directly (what es-check uses under the hood)
    run: async (testFiles) => {
      // Create a simple script to check files with Acorn directly
      const acornCheckScript = `
        const acorn = require('acorn');
        const fs = require('fs');
        const path = require('path');

        function checkFile(filePath) {
          try {
            const code = fs.readFileSync(filePath, 'utf8');
            acorn.parse(code, {
              ecmaVersion: ${esVersion === 'es5' ? 5 : 6},
              sourceType: 'script',
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

      const tempScriptPath = path.join(__dirname, 'temp-acorn-check.js');
      fs.writeFileSync(tempScriptPath, acornCheckScript);

      const startTime = performance.now();
      try {
        await execFileAsync('node', [tempScriptPath]);
      } catch (error) {
        // Ignore errors - we're just measuring performance
      } finally {
        // Clean up temp script
        fs.unlinkSync(tempScriptPath);
      }
      return performance.now() - startTime;
    }
  },
  {
    name: 'eslint',
    // Run ESLint to check ES compatibility
    run: async (testFiles) => {
      // Check if eslint is installed
      try {
        fs.accessSync('./node_modules/eslint');
      } catch (error) {
        console.log('eslint is not installed. Installing temporarily...');
        await execFileAsync('npm', ['install', '--no-save', 'eslint', 'eslint-plugin-es5']);
      }

      // Create a temporary ESLint config
      const eslintConfig = {
        "plugins": ["es5"],
        "extends": "plugin:es5/no-es2015",
        "parserOptions": {
          "ecmaVersion": 5
        },
        "rules": {
          "es5/no-es2015-syntax": "error"
        }
      };

      const tempConfigPath = path.join(__dirname, '.eslintrc.json');
      fs.writeFileSync(tempConfigPath, JSON.stringify(eslintConfig, null, 2));

      // Create a simple script to check files with ESLint
      const eslintCheckScript = `
        const { ESLint } = require('eslint');
        const fs = require('fs');
        const path = require('path');

        async function main() {
          const eslint = new ESLint({
            useEslintrc: true,
            overrideConfigFile: '${tempConfigPath.replace(/\\/g, '\\\\')}'
          });

          const files = ${JSON.stringify(testFiles)};

          // Only lint files, don't care about results for benchmark
          await eslint.lintFiles(files);
        }

        main();
      `;

      const tempScriptPath = path.join(__dirname, 'temp-eslint-check.js');
      fs.writeFileSync(tempScriptPath, eslintCheckScript);

      const startTime = performance.now();
      try {
        await execFileAsync('node', [tempScriptPath]);
      } catch (error) {
        // Ignore errors - we're just measuring performance
      } finally {
        // Clean up temp files
        fs.unlinkSync(tempScriptPath);
        fs.unlinkSync(tempConfigPath);
      }
      return performance.now() - startTime;
    }
  }
];

/**
 * Find JavaScript files in a directory
 * @param {string} dir - Directory to search
 * @returns {Promise<string[]>} - Array of file paths
 */
async function findJsFiles(dir) {
  const files = [];

  // Use glob pattern to find JS files
  try {
    const { default: glob } = await import('fast-glob');
    return await glob(`${dir}/**/*.js`, {
      ignore: ['**/node_modules/**', '**/dist/**'],
      absolute: true
    });
  } catch (error) {
    console.error('Error finding JS files:', error);
    return [];
  }
}

/**
 * Run benchmarks for all tools
 */
async function runBenchmarks() {
  console.log(`Running benchmarks (${iterations} iterations each)...`);

  // Find test files
  console.log(`Finding JavaScript files in ${testDir}...`);
  const testFiles = await findJsFiles(testDir);
  console.log(`Found ${testFiles.length} JavaScript files to test`);

  if (testFiles.length === 0) {
    console.error('No JavaScript files found to test. Please specify a directory with JS files.');
    process.exit(1);
  }

  // Sample a subset of files if there are too many
  const maxFiles = 100;
  const filesToTest = testFiles.length > maxFiles
    ? testFiles.slice(0, maxFiles)
    : testFiles;

  console.log(`Testing with ${filesToTest.length} files`);

  // Run benchmarks for each tool
  const results = {};

  for (const tool of tools) {
    console.log(`\nBenchmarking ${tool.name}...`);
    const times = [];

    for (let i = 0; i < iterations; i++) {
      process.stdout.write(`  Iteration ${i + 1}/${iterations}... `);
      const time = await tool.run(filesToTest);
      times.push(time);
      process.stdout.write(`${time.toFixed(2)}ms\n`);
    }

    // Calculate statistics
    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    results[tool.name] = { times, avg, min, max };

    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
  }

  // Compare results
  console.log('\n=== COMPARISON ===');
  const sortedTools = Object.keys(results).sort((a, b) => results[a].avg - results[b].avg);

  console.log('Tools ranked by average execution time (fastest first):');
  sortedTools.forEach((toolName, index) => {
    const { avg } = results[toolName];
    const fastestAvg = results[sortedTools[0]].avg;
    const percentSlower = index === 0 ? 0 : ((avg - fastestAvg) / fastestAvg * 100);

    console.log(`${index + 1}. ${toolName}: ${avg.toFixed(2)}ms ${index === 0 ? '(fastest)' : `(${percentSlower.toFixed(2)}% slower)`}`);
  });

  // Generate markdown table
  console.log('\n=== MARKDOWN TABLE ===');
  console.log('| Tool | Average (ms) | Min (ms) | Max (ms) | Relative Performance |');
  console.log('|------|-------------|----------|----------|----------------------|');

  sortedTools.forEach((toolName) => {
    const { avg, min, max } = results[toolName];
    const fastestAvg = results[sortedTools[0]].avg;
    const relativePerf = toolName === sortedTools[0]
      ? '1x (fastest)'
      : `${(avg / fastestAvg).toFixed(2)}x slower`;

    console.log(`| ${toolName} | ${avg.toFixed(2)} | ${min.toFixed(2)} | ${max.toFixed(2)} | ${relativePerf} |`);
  });
}

// Run the benchmarks
runBenchmarks().catch(error => {
  console.error('Error running benchmarks:', error);
  process.exit(1);
});
