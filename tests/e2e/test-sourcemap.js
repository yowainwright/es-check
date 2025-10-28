const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

describe('Source Map E2E Tests', () => {
  const fixtureDir = path.join(__dirname, '../fixtures/sourcemap-e2e');
  const transpiledFile = path.join(fixtureDir, 'transpiled.js');
  const originalFile = path.join(fixtureDir, 'original.js');
  const tempFiles = [];

  after(() => {
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });

  it('should report errors with source map references when .map file exists', () => {
    let output;
    let exitCode;

    try {
      output = execSync(
        `node lib/index.js es5 "${transpiledFile}"`,
        { encoding: 'utf8', cwd: path.join(__dirname, '../..') }
      );
      exitCode = 0;
    } catch (error) {
      output = error.stdout + error.stderr;
      exitCode = error.status;
    }

    assert.strictEqual(exitCode, 1, 'Should exit with error code 1');
    assert.ok(output.includes('transpiled.js'), 'Should reference the transpiled file');
    assert.ok(output.includes('ES-Check Error'), 'Should show ES-Check error message');
  });

  it('should check transpiled file passes when checking for correct version', () => {
    let output;
    let exitCode;

    try {
      output = execSync(
        `node lib/index.js es6 "${transpiledFile}"`,
        { encoding: 'utf8', cwd: path.join(__dirname, '../..') }
      );
      exitCode = 0;
    } catch (error) {
      output = error.stdout + error.stderr;
      exitCode = error.status;
    }

    assert.strictEqual(exitCode, 0, 'Should exit successfully with es6');
    assert.ok(!output.includes('ES-Check Error'), 'Should not show errors');
  });

  it('should handle missing source map gracefully', () => {
    const tempFile = path.join(fixtureDir, 'no-map.js');
    tempFiles.push(tempFile);
    fs.writeFileSync(tempFile, 'const x = 5;');

    let output;
    let exitCode;

    try {
      output = execSync(
        `node lib/index.js es5 "${tempFile}"`,
        { encoding: 'utf8', cwd: path.join(__dirname, '../..') }
      );
      exitCode = 0;
    } catch (error) {
      output = error.stdout + error.stderr;
      exitCode = error.status;
    }

    assert.strictEqual(exitCode, 1, 'Should exit with error code 1');
    assert.ok(output.includes('no-map.js'), 'Should reference the file without map');
    assert.ok(output.includes('ES-Check Error'), 'Should show ES-Check error message');
  });

  it('should verify original source is ES6+', () => {
    let output;
    let exitCode;

    try {
      output = execSync(
        `node lib/index.js es5 "${originalFile}"`,
        { encoding: 'utf8', cwd: path.join(__dirname, '../..') }
      );
      exitCode = 0;
    } catch (error) {
      output = error.stdout + error.stderr;
      exitCode = error.status;
    }

    assert.strictEqual(exitCode, 1, 'Should exit with error code 1 for ES5 check');
    assert.ok(output.includes('original.js'), 'Should reference original file');
  });
});
