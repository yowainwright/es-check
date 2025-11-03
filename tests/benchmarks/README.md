# ES-Check Benchmarks

## Running Benchmarks

```bash
docker build -t es-check-benchmark -f tests/benchmarks/Dockerfile .
docker run --rm es-check-benchmark
```

## Tools Tested

- **es-check** (and variants: bundled, light, batch-10, batch-50)
- **are-you-es5**
- **acorn** (direct parser)
- **babel-parser**
- **swc/core**
- **eslint** (with eslint-plugin-es5)

## Libraries Tested On

Real-world production libraries downloaded from unpkg:

- **lodash** (544 KB)
- **axios** (97 KB)
- **react** (11 KB)
- **moment** (175 KB)
- **express** (0.2 KB)
- **chalk** (6 KB)

## Results (11/02/2025)

| Tool                  | Average (ms) | Min (ms) | Max (ms) | Relative Performance |
| --------------------- | ------------ | -------- | -------- | -------------------- |
| **es-check-batch-50** | **7.20**     | **7.12** | **7.36** | **1x (fastest)**     |
| es-check-batch-10     | 7.67         | 7.27     | 7.98     | 1.06x slower         |
| es-check-bundled      | 8.04         | 7.68     | 8.31     | 1.12x slower         |
| es-check-light        | 8.21         | 7.88     | 8.68     | 1.14x slower         |
| es-check              | 9.17         | 8.17     | 10.36    | 1.27x slower         |
| are-you-es5           | 15.05        | 13.81    | 16.53    | 2.09x slower         |
| acorn (direct)        | 47.11        | 43.51    | 50.49    | 6.54x slower         |
| eslint                | 55.21        | 53.77    | 57.94    | 7.67x slower         |
| swc/core (rustpack)   | 55.69        | 52.93    | 58.42    | 7.73x slower         |
| babel-parser          | 65.00        | 63.04    | 67.09    | 9.03x slower         |

**Environment:** Node.js 24, Docker container, 3 iterations per tool
