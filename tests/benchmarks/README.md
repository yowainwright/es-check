# ES-Check Benchmarks

## Running Benchmarks

```bash
docker build -t es-check-benchmark -f tests/benchmarks/Dockerfile .
docker run --rm es-check-benchmark
```

## Versions Tested

- **es-check** current
- **es-check** previous published version (`9.6.3`)

## Libraries Tested On

Real-world production libraries downloaded from unpkg:

- **lodash** (544 KB)
- **axios** (97 KB)
- **react** (11 KB)
- **moment** (175 KB)
- **express** (0.2 KB)
- **chalk** (6 KB)

## Syntax Results (May 2, 2026)

| Tool               | Average (ms) | Min (ms)  | Max (ms)  | Relative Performance |
| ------------------ | ------------ | --------- | --------- | -------------------- |
| **es-check@9.6.3** | **59.02**    | **55.55** | **64.01** | **1x (fastest)**     |
| es-check           | 61.27        | 55.52     | 68.13     | 1.04x slower         |

## Feature Results (May 2, 2026)

Target: `es2020` with `--checkFeatures`

| Tool                           | Average (ms) | Min (ms)   | Max (ms)   | Relative Performance |
| ------------------------------ | ------------ | ---------- | ---------- | -------------------- |
| **es-check --checkFeatures**   | **109.29**   | **105.11** | **116.99** | **1x (fastest)**     |
| es-check@9.6.3 --checkFeatures | 134.15       | 124.22     | 146.91     | 1.23x slower         |

## Node API Feature Results (May 2, 2026)

Target: `es2020` with `checkFeatures: true`, warmed before measurement, 100 package files

| Tool                                        | Average (ms) | Min (ms) | Max (ms) | Relative Performance |
| ------------------------------------------- | ------------ | -------- | -------- | -------------------- |
| **es-check@9.6.3 Node API --checkFeatures** | **8.66**     | **8.05** | **9.53** | **1x (fastest)**     |
| es-check Node API --checkFeatures           | 9.06         | 7.25     | 11.93    | 1.05x slower         |

**Environment:** Node.js 24.15.0, Docker container, 10 iterations per tool

### Takeaways

- The current ES Check run is compared against `es-check@9.6.3` to catch performance regressions. In this run, syntax-only ES5 CLI checks were 3.81% slower, ES2020 feature CLI checks were 18.53% faster, and warmed Node API ES2020 feature checks were 4.53% slower.
