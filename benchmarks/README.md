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

#### May 2025 - Initial Performance Baseline

In May 2025, we established initial benchmarks after adding extensive new features to es-check including ES2024/ES2025 support, polyfill detection, browserslist integration, and comprehensive feature detection. While these features provided significant value, they came at a performance cost, with es-check being 3.14x slower than the fastest tool due to double parsing overhead and synchronous file operations.

##### Small Test Set (100 files) - May 2025
| Tool | Average (ms) | Min (ms) | Max (ms) | Relative Performance |
|------|-------------|----------|----------|----------------------|
| are-you-es5 | 45.85 | 45.34 | 47.25 | 1x (fastest) |
| acorn (direct) | 79.75 | 79.17 | 80.61 | 1.74x slower |
| swc/core (rustpack) | 89.36 | 82.78 | 104.76 | 1.95x slower |
| babel-parser | 92.16 | 89.61 | 94.02 | 2.01x slower |
| eslint | 129.12 | 120.63 | 136.30 | 2.82x slower |
| es-check-bundled | 143.87 | 131.50 | 154.72 | 3.14x slower |
| es-check | 144.05 | 134.68 | 162.65 | 3.14x slower |

##### Large Test Set (500 files) - May 2025

| Tool | Average (ms) | Min (ms) | Max (ms) | Relative Performance |
|------|-------------|----------|----------|----------------------|
| are-you-es5 | 47.58 | 45.08 | 49.79 | 1x (fastest) |
| acorn (direct) | 72.80 | 72.36 | 73.10 | 1.53x slower |
| babel-parser | 90.37 | 87.95 | 94.73 | 1.90x slower |
| swc/core (rustpack) | 93.98 | 84.34 | 105.79 | 1.98x slower |
| es-check-bundled | 138.63 | 132.95 | 148.80 | 2.91x slower |
| eslint | 139.75 | 129.10 | 159.31 | 2.94x slower |
| es-check | 151.59 | 136.59 | 169.78 | 3.19x slower |

#### August 2025 - Performance Optimization Update

On August 6, 2025, we implemented major performance optimizations based on the May benchmarks. The key improvements included eliminating double parsing by reusing the AST between syntax checking and feature detection, adding async file processing with configurable batch sizes, and optimizing glob operations. These changes resulted in es-check improving from 3.14x slower to 1.81x slower - a 42% performance gain while maintaining all features.

#### January 2025 - Light Mode with fast-brake

We integrated `fast-brake` for pattern-based checking and added a `--light` mode that provides 2-3x faster performance:

| Tool | Average (ms) | Min (ms) | Max (ms) | Relative Performance |
|------|-------------|----------|----------|----------------------|
| are-you-es5 | 36.35 | 34.21 | 41.35 | 1x (fastest) |
| acorn (direct) | 49.72 | 46.73 | 52.65 | 1.37x slower |
| babel-parser | 76.18 | 59.52 | 120.70 | 2.10x slower |
| **es-check-light** | **87.90** | **77.62** | **105.30** | **2.42x slower** |
| es-check | 131.10 | 120.78 | 155.64 | 3.61x slower |

The `--light` mode uses fast-brake's optimized pattern matching instead of full AST parsing, achieving near-parser speeds while still supporting ES3-ES2025, with more performance improvements to come.

##### Small Test Set (100 files) - August 2025
| Tool | Average (ms) | Min (ms) | Max (ms) | Relative Performance |
|------|-------------|----------|----------|----------------------|
| babel-parser | 48.23 | 45.97 | 50.35 | 1x (fastest) |
| acorn (direct) | 52.99 | 32.81 | 81.63 | 1.10x slower |
| es-check-bundled | 78.20 | 74.36 | 81.65 | 1.62x slower |
| es-check-batch-50 | 81.19 | 78.86 | 83.28 | 1.68x slower |
| es-check | 87.45 | 80.57 | 101.00 | 1.81x slower |
| are-you-es5 | 98.90 | 35.88 | 224.87 | 2.05x slower |
| eslint | 111.04 | 85.91 | 160.38 | 2.30x slower |
| swc/core (rustpack) | 123.41 | 39.91 | 290.15 | 2.56x slower |

**Key Performance Improvements:**
- **es-check**: Improved from 3.14x to 1.81x slower (42% performance gain)
- **es-check-bundled**: Improved from 3.14x to 1.62x slower (48% performance gain)
- **New `--batchSize` option**: Allows users to control parallelism for memory management

##### Large Test Set (500 files) - August 2025
| Tool | Average (ms) | Min (ms) | Max (ms) | Relative Performance |
|------|-------------|----------|----------|----------------------|
| are-you-es5 | 41.27 | 39.56 | 42.99 | 1x (fastest) |
| acorn (direct) | 52.06 | 50.37 | 53.74 | 1.26x slower |
| babel-parser | 73.06 | 72.38 | 73.73 | 1.77x slower |
| swc/core (rustpack) | 82.96 | 74.96 | 90.96 | 2.01x slower |
| eslint | 108.63 | 87.72 | 129.54 | 2.63x slower |
| es-check-bundled | 109.87 | 108.26 | 111.47 | 2.66x slower |
| es-check-batch-10 | 110.83 | 109.29 | 112.37 | 2.69x slower |
| es-check-batch-50 | 117.03 | 97.40 | 136.65 | 2.84x slower |
| es-check | 117.17 | 111.67 | 122.67 | 2.84x slower |

#### Performance Optimizations

##### File Caching (v9.3.0+)
File caching is enabled by default and caches file contents in memory for faster re-checking:

```bash
# Cache is enabled by default
es-check es5 './dist/**/*.js'

# Disable cache if needed
es-check es5 './dist/**/*.js' --noCache
```

**Cache Performance Impact:**
We observed **~28% faster** execution with cache enabled in our benchmark tests. Your results may vary based on:
- File sizes and complexity
- System specifications (CPU, disk speed, memory)
- Number of files being checked

**Our benchmark results** (100 test files, 3 iterations):
- Without cache: 79.67ms average
- With cache: 57.63ms average  
- Improvement: 28% reduction in execution time

**Try it yourself:**
```bash
# Generate test files and run benchmarks
node benchmarks/generate-test-files.js 100 ./benchmarks/test-files
node benchmarks/compare-tools.js 3 ./benchmarks/test-files
```

The cache is most beneficial when:
- Checking the same files multiple times
- Running in watch mode
- CI environments with file deduplication

##### Batch Processing
The `--batchSize` option allows fine-tuning performance based on your system and codebase:

- **`--batchSize 0` (default)**: Process all files in parallel. Best for small to medium codebases with sufficient memory.
- **`--batchSize 10`**: Process 10 files at a time. Ideal for memory-constrained environments or very large files.
- **`--batchSize 50`**: Balance between parallelism and memory usage. Good for large codebases.

**Performance Observations:**
1. **Small file sets (< 100 files)**: Unlimited parallelism (`--batchSize 0`) provides best performance
2. **Large file sets (> 500 files)**: Batch processing can prevent memory spikes but may slightly increase total time
3. **Memory vs Speed Trade-off**: Smaller batch sizes use less memory but may take longer
4. **System-dependent**: Optimal batch size varies based on available CPU cores and memory

**Optimization Tips:**
- For CI/CD pipelines with limited memory: Use `--batchSize 10-20`
- For local development with modern hardware: Use default (`--batchSize 0`)
- For very large codebases (1000+ files): Consider `--batchSize 50-100`
- Monitor memory usage and adjust batch size accordingly

#### ES Check Configuration Performance Impact

Different es-check configurations have varying performance impacts. Here's a breakdown of relative performance:

| Configuration | Relative Speed | Example Command | Use Case |
|--------------|----------------|-----------------|----------|
| Syntax only + silent + specific files | **1x** (fastest) | `es-check es5 './dist/bundle.js' --silent` | CI/CD quick validation |
| Syntax only + normal output | **~1.1x** | `es-check es5 './dist/**/*.js'` | Standard usage |
| Syntax only + verbose | **~1.2x** | `es-check es5 './dist/**/*.js' --verbose` | Debugging |
| With --checkFeatures | **~1.5-2x** | `es-check es5 './dist/**/*.js' --checkFeatures` | Comprehensive feature checks |
| With --checkForPolyfills | **~2-2.5x** | `es-check es5 './dist/**/*.js' --checkFeatures --checkForPolyfills` | Full compatibility analysis |
| With --checkBrowser | **~1.3-1.5x** | `es-check --checkBrowser './dist/**/*.js'` | Browserslist-based checking |

#### Performance Optimization Strategies

##### Fastest Possible Configuration
```bash
# Maximum speed - syntax only, silent, specific files, unlimited parallelism
es-check es5 './dist/bundle.min.js' --silent --batchSize 0
```

##### Why ES Check Might Take More Time
1. **`--checkFeatures`** - Requires full AST traversal with acorn-walk
2. **`--checkForPolyfills`** - Adds regex pattern matching overhead
3. **`--verbose`** - Logging and debug output overhead
4. **`--checkBrowser`** - Browserslist resolution and mapping
5. **Small batch sizes** - Reduced parallelism
6. **Broad glob patterns** - More file system operations
7. **`--not` exclusions** - Additional filtering logic

##### Speed Optimization Tips

| Strategy | Impact | Example |
|----------|--------|---------|
| Use specific file paths | High | `'./dist/bundle.js'` instead of `'./**/*.js'` |
| Skip feature detection | High | Omit `--checkFeatures` unless necessary |
| Use silent mode in CI | Medium | Add `--silent` for CI/CD pipelines |
| Check bundled files | High | One large file vs many small files |
| Pre-filter files | Medium | Use shell commands to filter before es-check |
| Use config files | Low | Avoid command line parsing overhead |

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
