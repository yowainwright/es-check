#!/usr/bin/env node

const { execFileSync } = require('child_process');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('Testing CLI functionality...\n');

const esCheckPath = path.join(__dirname, '..', '..', 'lib', 'index.js');

// Test 1: Check ES5 file passes
console.log('Test 1: ES5 file should pass ES5 check');
try {
  execFileSync('node', [esCheckPath, 'es5', './tests/fixtures/es5.js'], { encoding: 'utf8' });
  console.log('✅ Test 1 passed\n');
} catch (error) {
  console.error('❌ Test 1 failed');
  process.exit(1);
}

// Test 2: Check ES6 file fails ES5 check
console.log('Test 2: ES6 file should fail ES5 check');
try {
  execFileSync('node', [esCheckPath, 'es5', './tests/fixtures/es6.js'], { encoding: 'utf8' });
  console.error('❌ Test 2 failed - should have thrown an error');
  process.exit(1);
} catch (error) {
  console.log('✅ Test 2 passed (expected failure)\n');
}

// Test 3: Check with --module flag
console.log('Test 3: Module syntax with --module flag');
try {
  execFileSync('node', [esCheckPath, 'es6', './tests/fixtures/modules/es6-module.js', '--module'], { encoding: 'utf8' });
  console.log('✅ Test 3 passed\n');
} catch (error) {
  console.error('❌ Test 3 failed');
  process.exit(1);
}

// Test 4: Check with --allowHashBang flag (ES6 since file uses const)
console.log('Test 4: Hash bang file with --allowHashBang flag');
try {
  execFileSync('node', [esCheckPath, 'es6', './tests/fixtures/scripts/hash-bang.js', '--allowHashBang'], { encoding: 'utf8' });
  console.log('✅ Test 4 passed\n');
} catch (error) {
  console.error('❌ Test 4 failed');
  process.exit(1);
}

// Test 5: Check with --checkFeatures flag
console.log('Test 5: Feature detection with --checkFeatures flag');
try {
  execFileSync('node', [esCheckPath, 'es5', './tests/fixtures/es6.js', '--checkFeatures'], { encoding: 'utf8' });
  console.error('❌ Test 5 failed - should have thrown an error');
  process.exit(1);
} catch (error) {
  console.log('✅ Test 5 passed (expected failure)\n');
}

// Test 6: Check multiple files with glob pattern
console.log('Test 6: Multiple files with glob pattern');
try {
  execFileSync('node', [esCheckPath, 'es5', './tests/fixtures/es5*.js'], { encoding: 'utf8' });
  console.log('✅ Test 6 passed\n');
} catch (error) {
  console.error('❌ Test 6 failed');
  process.exit(1);
}

// Test 7: Check with config file
console.log('Test 7: Using config file');
const configPath = path.join(__dirname, 'test.escheckrc');
const config = {
  ecmaVersion: 'es5',
  files: './tests/fixtures/es5.js',
  checkFeatures: true
};
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

try {
  execFileSync('node', [esCheckPath, '--config', configPath], { encoding: 'utf8' });
  console.log('✅ Test 7 passed\n');
} catch (error) {
  console.error('❌ Test 7 failed');
  process.exit(1);
} finally {
  // Clean up
  fs.unlinkSync(configPath);
}

console.log('Test 8: Lightweight mode with --light flag');
try {
  execFileSync('node', [esCheckPath, 'es5', './tests/fixtures/es5.js', '--light'], { encoding: 'utf8' });
  console.log('✅ Test 8 passed\n');
} catch (error) {
  console.error('❌ Test 8 failed');
  process.exit(1);
}

console.log('Test 9: Lightweight mode should catch ES6 code');
try {
  execFileSync('node', [esCheckPath, 'es5', './tests/fixtures/es6.js', '--light'], { encoding: 'utf8' });
  console.error('❌ Test 9 failed - should have thrown an error');
  process.exit(1);
} catch (error) {
  console.log('✅ Test 9 passed (expected failure)\n');
}

console.log('Test 10: Default mode without --light flag uses Acorn parser');
try {
  execFileSync('node', [esCheckPath, 'es5', './tests/fixtures/es5.js'], { encoding: 'utf8' });
  console.log('✅ Test 10 passed\n');
} catch (error) {
  console.error('❌ Test 10 failed');
  console.error(error.message);
  process.exit(1);
}

console.log('✅ All CLI tests passed!');