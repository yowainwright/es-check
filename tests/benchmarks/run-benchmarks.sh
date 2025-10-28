#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

mkdir -p tests/benchmarks/results

echo -e "${BLUE}=== ES-CHECK BENCHMARK RUNNER ===${NC}"
echo "Running benchmarks and saving results..."

echo -e "\n${GREEN}Generating 100 test files...${NC}"
node tests/benchmarks/generate-test-files.js 100 ./tests/benchmarks/test-files

echo -e "\n${GREEN}Running benchmark with 100 files (5 iterations)...${NC}"
node tests/benchmarks/compare-tools.js 5 ./tests/benchmarks/test-files | tee tests/benchmarks/results/small-benchmark.txt

echo -e "\n${GREEN}Generating 500 test files...${NC}"
node tests/benchmarks/generate-test-files.js 500 ./tests/benchmarks/test-files-large

echo -e "\n${GREEN}Running benchmark with 500 files (3 iterations)...${NC}"
node tests/benchmarks/compare-tools.js 3 ./tests/benchmarks/test-files-large | tee tests/benchmarks/results/large-benchmark.txt

echo -e "\n${GREEN}Cleaning up test files...${NC}"
rm -rf ./tests/benchmarks/test-files ./tests/benchmarks/test-files-large

echo -e "\n${BLUE}Benchmarks complete!${NC}"
echo "Results saved to tests/benchmarks/results/"
