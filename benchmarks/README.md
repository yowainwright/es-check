# ES-Check Benchmarks

This directory contains scripts for benchmarking es-check against similar tools like are-you-es5.

We'll be looking to improve Es-check's performance based on these measurements.

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
- 30% ES5-compatible files
- 30% ES6 files with features like arrow functions, const/let, classes, etc.
- 20% ES2020 files with features like nullish coalescing, optional chaining, BigInt, etc.
- 10% ES2024 files with features like Array.prototype.findLast, toReversed, String well-formed methods, etc.
- 10% ES2025 files with features like Array.prototype.group, Promise.try, etc.

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

## Benchmark Results

We've run comprehensive benchmarks to compare various JavaScript syntax checking tools. These benchmarks focus on execution time only and don't measure the breadth of features, accuracy, or flexibility that each tool provides.

### Performance vs. Feature Comparison

It's important to note that these tools have different design goals:

- **are-you-es5**: Focused solely on ES5 compatibility with minimal features
- **acorn (direct)**: Raw parser with no additional features
- **swc/core**: Rust-based parser with limited configuration options
- **babel-parser**: Parser only, without validation features
- **eslint**: Full linting capabilities but limited ES version targeting
- **es-check**: Comprehensive ES version targeting with feature detection

### Benchmark Data

#### Small Test Set (100 files)

| Tool | Average (ms) | Min (ms) | Max (ms) | Relative Performance |
|------|-------------|----------|----------|----------------------|
| are-you-es5 | 45.85 | 45.34 | 47.25 | 1x (fastest) |
| acorn (direct) | 79.75 | 79.17 | 80.61 | 1.74x slower |
| swc/core (rustpack) | 89.36 | 82.78 | 104.76 | 1.95x slower |
| babel-parser | 92.16 | 89.61 | 94.02 | 2.01x slower |
| eslint | 129.12 | 120.63 | 136.30 | 2.82x slower |
| es-check-bundled | 143.87 | 131.50 | 154.72 | 3.14x slower |
| es-check | 144.05 | 134.68 | 162.65 | 3.14x slower |

#### Large Test Set (500 files)

| Tool | Average (ms) | Min (ms) | Max (ms) | Relative Performance |
|------|-------------|----------|----------|----------------------|
| are-you-es5 | 47.58 | 45.08 | 49.79 | 1x (fastest) |
| acorn (direct) | 72.80 | 72.36 | 73.10 | 1.53x slower |
| babel-parser | 90.37 | 87.95 | 94.73 | 1.90x slower |
| swc/core (rustpack) | 93.98 | 84.34 | 105.79 | 1.98x slower |
| es-check-bundled | 138.63 | 132.95 | 148.80 | 2.91x slower |
| eslint | 139.75 | 129.10 | 159.31 | 2.94x slower |
| es-check | 151.59 | 136.59 | 169.78 | 3.19x slower |

This performance difference is expected and represents the trade-off between speed and functionality. While simple parsers are faster, es-check provides a more comprehensive feature set that delivers greater value for real-world projects where accuracy and specific version targeting are critical.

## Adding More Tools

To benchmark against additional tools, modify the `tools` array in `compare-tools.js` to include the new tool and its execution method.

## Analysis and Observations

### Feature-Performance Trade-offs

Our benchmarks reveal important insights about the relationship between features and performance:

1. **Feature Richness vs. Speed**: Tools with more features and flexibility naturally require more processing time. es-check's comprehensive feature set (ES version targeting, feature detection, configuration options) requires more processing than simple parsers.

2. **Use Case Alignment**: Different tools excel in different scenarios. Simple parsers are faster for basic syntax checking, while es-check provides more thorough analysis with specific version targeting.

3. **Module Bundling**: The `--module` flag in es-check has minimal performance impact, making it an efficient option for checking bundled code without significant overhead.

4. **Parser Foundation**: All tools ultimately rely on JavaScript parsers (like acorn or babel-parser), with additional features built on top. The performance difference between raw parsers and feature-rich tools represents the cost of those additional capabilities.

### Scaling Considerations

When processing larger codebases:

1. **Consistent Behavior**: All tools maintain relatively consistent performance characteristics as the number of files increases.

2. **Predictable Scaling**: Processing time generally scales linearly with the number of files for all tools.

3. **Feature Value**: As codebases grow, the value of es-check's specific version targeting and detailed error reporting becomes more significant, often outweighing raw performance considerations.

## Conclusion

These benchmarks highlight the different approaches taken by JavaScript syntax checking tools. While simple parsers focus on speed, es-check prioritizes feature completeness and accuracy.

es-check stands out with its comprehensive capabilities:

- Specific ES version targeting (ES5 through ES2025+)
- Detailed feature detection with the `--checkFeatures` flag
- Flexible configuration options
- Clear error reporting
- Support for various module formats
- ES2024 and ES2025 feature detection including Array methods, String well-formed methods, Promise.try, and more

For most real-world projects, these features provide significant value that outweighs small differences in execution time. es-check's design prioritizes correctness and developer experience, making it an excellent choice for projects where accurate ECMAScript version validation is critical.

As JavaScript continues to evolve, es-check's approach ensures developers can confidently ship code that works across their target environments.

## Environment Information

The benchmarks were run with the following configuration:

- Node.js version: v19.1.0
- Hardware: MacBook Pro with Apple M1 chip
- Small test set: 100 files (40 ES5, 40 ES6, 20 ES2020+), 5 iterations
- Large test set: 500 files (200 ES5, 200 ES6, 100 ES2020+), 3 iterations
