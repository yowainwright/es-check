#!/usr/bin/env node

import { runChecks, loadConfig } from '../../lib/esm-wrapper.mjs';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing ESM import functionality...\n');

// Test 1: Verify imports work
console.log('Test 1: ESM imports successful');
assert.strictEqual(typeof runChecks, 'function', 'runChecks should be a function');
assert.strictEqual(typeof loadConfig, 'function', 'loadConfig should be a function');
console.log('✅ Test 1 passed\n');

// Test 2: Test runChecks with ES5 file
console.log('Test 2: runChecks with ES5 file');
const es5Config = [{
  ecmaVersion: 'es5',
  files: ['./tests/fixtures/es5.js'],
  checkFeatures: true
}];

const es5Result = await runChecks(es5Config);
assert.strictEqual(es5Result.success, true, 'ES5 file should pass ES5 check');
assert.strictEqual(es5Result.errors.length, 0, 'Should have no errors');
console.log('✅ Test 2 passed\n');

// Test 3: Test runChecks with ES6 file against ES5
console.log('Test 3: runChecks with ES6 file against ES5 (should fail)');
const es6Config = [{
  ecmaVersion: 'es5',
  files: ['./tests/fixtures/es6.js'],
  checkFeatures: true
}];

const es6Result = await runChecks(es6Config);
assert.strictEqual(es6Result.success, false, 'ES6 file should fail ES5 check');
assert.ok(es6Result.errors.length > 0, 'Should have errors');
console.log('✅ Test 3 passed (expected failure)\n');

// Test 4: Test with multiple files
console.log('Test 4: runChecks with multiple files');
const multiConfig = [{
  ecmaVersion: 'es5',
  files: ['./tests/fixtures/es5.js', './tests/fixtures/es5-2.js'],
  checkFeatures: true
}];

const multiResult = await runChecks(multiConfig);
assert.strictEqual(multiResult.success, true, 'Multiple ES5 files should pass');
console.log('✅ Test 4 passed\n');

// Test 5: Test loadConfig function
console.log('Test 5: loadConfig function');
import { writeFileSync, unlinkSync } from 'fs';

const configPath = join(__dirname, 'test.escheckrc');
const testConfig = {
  ecmaVersion: 'es6',
  files: './tests/fixtures/es6.js',
  module: true
};

writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

try {
  const loadedConfig = await loadConfig(configPath);
  assert.ok(Array.isArray(loadedConfig), 'loadConfig should return an array');
  assert.strictEqual(loadedConfig[0].ecmaVersion, 'es6', 'Should load correct ecmaVersion');
  console.log('✅ Test 5 passed\n');
} finally {
  unlinkSync(configPath);
}

// Test 6: Test with custom logger
console.log('Test 6: runChecks with custom logger');
const logs = [];
const customLogger = {
  info: (msg) => logs.push({ level: 'info', msg }),
  error: (msg) => logs.push({ level: 'error', msg }),
  warn: (msg) => logs.push({ level: 'warn', msg }),
  debug: (msg) => logs.push({ level: 'debug', msg }),
  isLevelEnabled: () => true
};

const loggerConfig = [{
  ecmaVersion: 'es5',
  files: ['./tests/fixtures/es5.js']
}];

await runChecks(loggerConfig, { logger: customLogger });
assert.ok(logs.length > 0, 'Should have logged messages');
console.log('✅ Test 6 passed\n');

console.log('✅ All ESM import tests passed!');