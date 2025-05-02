#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

mkdir -p benchmarks/results

echo -e "${BLUE}=== ES-CHECK BENCHMARK RUNNER ===${NC}"
echo "Running benchmarks and saving results..."

echo -e "\n${GREEN}Generating 100 test files...${NC}"
node benchmarks/generate-test-files.js 100 ./benchmarks/test-files

echo -e "\n${GREEN}Running benchmark with 100 files (5 iterations)...${NC}"
node benchmarks/compare-tools.js 5 ./benchmarks/test-files | tee benchmarks/results/small-benchmark.txt

echo -e "\n${GREEN}Generating 500 test files...${NC}"
node benchmarks/generate-test-files.js 500 ./benchmarks/test-files-large

echo -e "\n${GREEN}Running benchmark with 500 files (3 iterations)...${NC}"
node benchmarks/compare-tools.js 3 ./benchmarks/test-files-large | tee benchmarks/results/large-benchmark.txt

echo -e "\n${GREEN}Cleaning up test files...${NC}"
rm -rf ./benchmarks/test-files ./benchmarks/test-files-large

echo -e "\n${BLUE}Benchmarks complete!${NC}"
echo "Results saved to benchmarks/results/"
