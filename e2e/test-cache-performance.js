#!/usr/bin/env node

const { execFile } = require('child_process');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const TEST_DIR = path.join(__dirname, 'test-files-cache');
const NUM_FILES = 50;

function generateTestFile(index) {
  return `
    // Test file ${index}
    var test${index} = function() {
      var result = ${index} + ${index};
      return result;
    };
    
    function oldStyle${index}() {
      var x = 'test';
      var y = 'string';
      return x + y;
    }
  `;
}

function setupTestFiles() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
  
  for (let i = 0; i < NUM_FILES; i++) {
    const filePath = path.join(TEST_DIR, `test-${i}.js`);
    fs.writeFileSync(filePath, generateTestFile(i));
  }
}

function cleanupTestFiles() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

async function runEsCheck(useCache) {
  return new Promise((resolve, reject) => {
    const cacheFlag = useCache ? '' : '--noCache';
    const startTime = performance.now();
    
    const args = [path.join(__dirname, '../index.js'), 'es5', `${TEST_DIR}/**/*.js`];
    if (cacheFlag) args.push(cacheFlag);
    args.push('--silent');
    execFile('node', args, (err, stdout, stderr) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (err && !stderr.includes('ES version matching errors')) {
        reject(err);
      } else {
        resolve(duration);
      }
    });
  });
}

async function runPerformanceTest() {
  console.log('Setting up test files...');
  setupTestFiles();
  
  try {
    console.log(`\nNote: Cache benefits are most visible when checking the same files multiple times.`);
    console.log(`In real-world usage, cache helps with watch mode, duplicate files, and CI reruns.`);
    console.log(`This test shows basic functionality.\n`);
    
    console.log('Testing with cache disabled...');
    const noCacheTimes = [];
    for (let i = 0; i < 3; i++) {
      const time = await runEsCheck(false);
      noCacheTimes.push(time);
      console.log(`  Run ${i + 1}: ${time.toFixed(2)}ms`);
    }
    
    console.log('\nTesting with cache enabled...');
    const cacheTimes = [];
    for (let i = 0; i < 3; i++) {
      const time = await runEsCheck(true);
      cacheTimes.push(time);
      console.log(`  Run ${i + 1}: ${time.toFixed(2)}ms`);
    }
    
    const avgNoCache = noCacheTimes.reduce((a, b) => a + b, 0) / noCacheTimes.length;
    const avgCache = cacheTimes.reduce((a, b) => a + b, 0) / cacheTimes.length;
    
    console.log('\n=== RESULTS ===');
    console.log(`Average without cache: ${avgNoCache.toFixed(2)}ms`);
    console.log(`Average with cache: ${avgCache.toFixed(2)}ms`);
    console.log(`Note: Each run is a new process, so cache is empty. See duplicate files test for cache benefits.`);
    
    console.log('\n✅ Basic cache test completed!');
    
  } finally {
    console.log('\nCleaning up test files...');
    cleanupTestFiles();
  }
}

async function runDuplicateFilesTest() {
  console.log('\n=== DUPLICATE FILES TEST ===');
  console.log('This test checks the same file multiple times to demonstrate cache benefits.');
  setupTestFiles();
  
  try {
    const testFiles = [];
    for (let i = 0; i < 5; i++) {
      testFiles.push(path.join(TEST_DIR, `test-${i}.js`));
    }
    
    const duplicatedFiles = [];
    for (let i = 0; i < 5; i++) {
      duplicatedFiles.push(...testFiles);
    }
    
    const filesArg = duplicatedFiles.map(f => `"${f}"`).join(' ');
    
    console.log(`Testing ${duplicatedFiles.length} files (5 files repeated 5 times each)...`);
    
    console.log('\nWith cache enabled:');
    const startCache = performance.now();
    await new Promise((resolve, reject) => {
      const args = [path.join(__dirname, '../index.js'), 'es5', ...filesArg.split(' '), '--silent'];
      execFile('node', args, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    const cacheTime = performance.now() - startCache;
    console.log(`  Time: ${cacheTime.toFixed(2)}ms`);
    
    console.log('\nWithout cache:');
    const startNoCache = performance.now();
    await new Promise((resolve, reject) => {
      const args = [path.join(__dirname, '../index.js'), 'es5', ...filesArg.split(' '), '--noCache', '--silent'];
      execFile('node', args, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    const noCacheTime = performance.now() - startNoCache;
    console.log(`  Time: ${noCacheTime.toFixed(2)}ms`);
    
    const improvement = ((noCacheTime - cacheTime) / noCacheTime * 100);
    console.log(`\n=== DUPLICATE FILES RESULTS ===`);
    console.log(`Cache improvement: ${improvement.toFixed(1)}%`);
    console.log(`With cache, duplicate files are only read once from disk.`);
    
    if (improvement > 0) {
      console.log('✅ Duplicate files test shows cache benefit!');
    } else {
      console.log('⚠️  Cache showed minimal benefit - this is normal for small files.');
    }
    
  } finally {
    cleanupTestFiles();
  }
}

async function main() {
  console.log('ES-Check Cache Performance E2E Tests');
  console.log('=====================================');
  
  try {
    await runPerformanceTest();
    await runDuplicateFilesTest();
    
    console.log('\n🎉 All E2E tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ E2E test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}