# ES-Check Benchmarks

This directory contains scripts for benchmarking es-check against similar tools like are-you-es5.

## Scripts

### 1. Generate Test Files

The `generate-test-files.js` script creates a set of JavaScript files with different ES versions for controlled benchmarking.

```bash
# Generate 100 test files in ./benchmarks/test-files
node benchmarks/generate-test-files.js 100 ./benchmarks/test-files
```

Parameters:
- `numFiles` (optional): Number of files to generate (default: 100)
- `outputDir` (optional): Directory to output files (default: ./benchmarks/test-files)

The script generates:
- 40% ES5-compatible files
- 40% ES6 files with features like arrow functions, const/let, etc.
- 20% ES2020+ files with features like nullish coalescing, optional chaining, etc.

### 2. Compare Tools

The `compare-tools.js` script benchmarks es-check against other similar tools.

```bash
# Run benchmark with 5 iterations using the generated test files
node benchmarks/compare-tools.js 5 ./benchmarks/test-files
```

Parameters:
- `iterations` (optional): Number of benchmark iterations (default: 5)
- `testDir` (optional): Directory containing test files (default: ./node_modules)

The script:
1. Finds JavaScript files in the specified directory
2. Runs each tool multiple times and measures execution time
3. Calculates average, min, and max execution times
4. Compares the performance of different tools

## Tools Included in Benchmark

The benchmark compares the following tools:

1. **es-check**: The main es-check tool
2. **are-you-es5**: A popular alternative for checking ES5 compatibility
3. **es-check-bundled**: es-check with the `--module` flag to simulate checking bundled code
4. **swc/core (rustpack)**: The Rust-based JavaScript/TypeScript compiler with parsing capabilities
5. **babel-parser**: The parser used by Babel
6. **acorn (direct)**: Direct usage of the Acorn parser (which es-check uses under the hood)
7. **eslint**: Using ESLint with eslint-plugin-es5 to check for ES5 compatibility

## Example Results

Here's an example of what the benchmark results might look like:

```text
=== COMPARISON ===
Tools ranked by average execution time (fastest first):
1. acorn (direct): 145.32ms (fastest)
2. es-check: 245.32ms (68.81% slower)
3. swc/core (rustpack): 289.45ms (99.18% slower)
4. babel-parser: 312.56ms (115.08% slower)
5. es-check-bundled: 356.78ms (145.51% slower)
6. eslint: 378.21ms (160.26% slower)
7. are-you-es5: 389.67ms (168.14% slower)

=== MARKDOWN TABLE ===
| Tool | Average (ms) | Min (ms) | Max (ms) | Relative Performance |
|------|-------------|----------|----------|----------------------|
| acorn (direct) | 145.32 | 138.45 | 156.78 | 1x (fastest) |
| es-check | 245.32 | 238.45 | 256.78 | 1.69x slower |
| swc/core (rustpack) | 289.45 | 275.21 | 312.34 | 1.99x slower |
| babel-parser | 312.56 | 298.67 | 325.43 | 2.15x slower |
| es-check-bundled | 356.78 | 342.12 | 378.91 | 2.46x slower |
| eslint | 378.21 | 365.89 | 392.45 | 2.60x slower |
| are-you-es5 | 389.67 | 375.21 | 412.34 | 2.68x slower |
```

## Adding More Tools

To benchmark against additional tools, modify the `tools` array in `compare-tools.js` to include the new tool and its execution method.

## Notes

- The benchmarks measure execution time only, not accuracy or feature completeness
- Performance may vary depending on the number and complexity of files being checked
- For the most accurate results, run benchmarks multiple times and on different sets of files
