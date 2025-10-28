const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runChecks, loadConfig } = require('../../lib/index.js');
const { createLogger } = require('../../lib/utils.js');
const { createTempDir, cleanupTempDir, createTempFile, createMockLogger } = require('../helpers');
const { CODE_SAMPLES, ES_VERSIONS } = require('../constants');

const testDir = path.join(__dirname, 'test-files-node-api');

describe('Node API Tests', () => {
  beforeEach(() => {
    createTempDir(testDir);
  });

  afterEach(() => {
    cleanupTempDir(testDir);
  });

  describe('runChecks with no logger', () => {
    it('should work without a logger', async () => {
      const es5File = path.join(testDir, 'es5.js');
      createTempFile(es5File, CODE_SAMPLES.ES5);

      const config = [{
        ecmaVersion: ES_VERSIONS.ES5,
        files: [es5File]
      }];

      const result = await runChecks(config);
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.errors, []);
    });

    it('should return errors without throwing', async () => {
      const es6File = path.join(testDir, 'es6.js');
      createTempFile(es6File, `${CODE_SAMPLES.ES6_CONST} ${CODE_SAMPLES.ES6_LET}`);

      const config = [{
        ecmaVersion: ES_VERSIONS.ES5,
        files: [es6File]
      }];

      const result = await runChecks(config);
      assert.strictEqual(result.success, false);
      assert(result.errors.length > 0);
      assert(result.errors[0].file === es6File);
    });

    it('should handle missing files gracefully', async () => {
      const config = [{
        ecmaVersion: 'es5',
        files: [path.join(testDir, 'nonexistent.js')]
      }];

      const result = await runChecks(config);
      assert.strictEqual(result.success, false);
      assert(result.errors.length > 0);
    });
  });

  describe('runChecks with options object', () => {
    it('should accept an options object with a logger', async () => {
      const es5File = path.join(testDir, 'es5.js');
      createTempFile(es5File, CODE_SAMPLES.ES5);

      const customLogger = createMockLogger();

      const config = [{
        ecmaVersion: ES_VERSIONS.ES5,
        files: [es5File]
      }];

      const result = await runChecks(config, { logger: customLogger });
      assert.strictEqual(result.success, true);
      assert(customLogger.getLogs().some(log => log.level === 'info'));
    });

    it('should work with options object but no logger', async () => {
      const es5File = path.join(testDir, 'es5.js');
      createTempFile(es5File, CODE_SAMPLES.ES5);

      const config = [{
        ecmaVersion: ES_VERSIONS.ES5,
        files: [es5File]
      }];

      const result = await runChecks(config, {});
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.errors, []);
    });

    it('should distinguish between logger and options object', async () => {
      const es5File = path.join(testDir, 'es5.js');
      fs.writeFileSync(es5File, 'var x = 5;');

      const config = [{
        ecmaVersion: 'es5',
        files: [es5File]
      }];

      const logger = createLogger();
      const resultWithLogger = await runChecks(config, logger);
      
      assert.strictEqual(resultWithLogger, undefined);
    });
  });

  describe('Error handling in Node API mode', () => {
    it('should handle invalid ecmaVersion without exiting', async () => {
      const config = [{
        ecmaVersion: 'es4',
        files: ['*.js']
      }];

      const result = await runChecks(config);
      assert.strictEqual(result.success, false);
      assert(result.errors.length > 0);
      assert(result.errors[0].err.message.includes('ES4'));
    });

    it('should handle missing ecmaVersion without exiting', async () => {
      const config = [{
        files: ['*.js']
      }];

      const result = await runChecks(config);
      assert.strictEqual(result.success, false);
      assert(result.errors.length > 0);
      assert(result.errors[0].err.message.includes('ecmaScript version'));
    });

    it('should handle no files specified without exiting', async () => {
      const config = [{
        ecmaVersion: 'es5',
        files: []
      }];

      const result = await runChecks(config);
      assert.strictEqual(result.success, false);
      assert(result.errors.length > 0);
      assert(result.errors[0].err.message.includes('file patterns'));
    });

    it('should handle glob patterns with no matches', async () => {
      const config = [{
        ecmaVersion: 'es5',
        files: [path.join(testDir, '*.xyz')]
      }];

      const result = await runChecks(config);
      assert.strictEqual(result.success, false);
      assert(result.errors.length > 0);
      assert(result.errors[0].err.message.includes('Did not find any files'));
    });
  });

  describe('Features checking', () => {
    it('should detect ES6 features in ES5 mode', async () => {
      const es6File = path.join(testDir, 'features.js');
      fs.writeFileSync(es6File, `
        const arrow = () => {};
        class MyClass {}
        let template = \`hello\`;
      `);

      const config = [{
        ecmaVersion: 'es5',
        files: [es6File],
        checkFeatures: true
      }];

      const result = await runChecks(config);
      assert.strictEqual(result.success, false);
      assert(result.errors.length > 0);
    });

    it('should pass when features match version', async () => {
      const es6File = path.join(testDir, 'valid-es6.js');
      fs.writeFileSync(es6File, `
        const arrow = () => {};
        class MyClass {}
        let template = \`hello\`;
      `);

      const config = [{
        ecmaVersion: 'es6',
        files: [es6File],
        checkFeatures: true
      }];

      const result = await runChecks(config);
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.errors, []);
    });
  });

  describe('Module support', () => {
    it('should handle ES modules when module option is set', async () => {
      const moduleFile = path.join(testDir, 'module.js');
      fs.writeFileSync(moduleFile, `
        import fs from 'fs';
        export const myFunc = () => {};
      `);

      const config = [{
        ecmaVersion: 'es6',
        files: [moduleFile],
        module: true
      }];

      const result = await runChecks(config);
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.errors, []);
    });

    it('should fail ES modules when module option is not set', async () => {
      const moduleFile = path.join(testDir, 'module-fail.js');
      fs.writeFileSync(moduleFile, `
        import fs from 'fs';
        export const myFunc = () => {};
      `);

      const config = [{
        ecmaVersion: 'es6',
        files: [moduleFile],
        module: false
      }];

      const result = await runChecks(config);
      assert.strictEqual(result.success, false);
      assert(result.errors.length > 0);
    });
  });

  describe('Multiple configs', () => {
    it('should process multiple configs and aggregate errors', async () => {
      const es5File = path.join(testDir, 'multi-es5.js');
      const es6File = path.join(testDir, 'multi-es6.js');
      
      fs.writeFileSync(es5File, 'var x = 5;');
      fs.writeFileSync(es6File, 'const y = 10;');

      const configs = [
        {
          ecmaVersion: 'es5',
          files: [es5File]
        },
        {
          ecmaVersion: 'es5',
          files: [es6File]
        }
      ];

      const result = await runChecks(configs);
      assert.strictEqual(result.success, false);
      assert(result.errors.length > 0);
      assert(result.errors.some(e => e.file === es6File));
    });

    it('should handle all configs passing', async () => {
      const es5File = path.join(testDir, 'valid-es5.js');
      const es6File = path.join(testDir, 'valid-es6.js');
      
      fs.writeFileSync(es5File, 'var x = 5;');
      fs.writeFileSync(es6File, 'const y = 10;');

      const configs = [
        {
          ecmaVersion: 'es5',
          files: [es5File]
        },
        {
          ecmaVersion: 'es6',
          files: [es6File]
        }
      ];

      const result = await runChecks(configs);
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.errors, []);
    });
  });

  describe('loadConfig function', () => {
    it('should load default config', async () => {
      const configs = await loadConfig();
      assert(Array.isArray(configs));
      assert(configs.length >= 1);
    });

    it('should load custom config file', async () => {
      const configFile = path.join(testDir, '.escheckrc');
      const configContent = {
        ecmaVersion: 'es6',
        files: ['src/**/*.js']
      };
      fs.writeFileSync(configFile, JSON.stringify(configContent));

      const configs = await loadConfig(configFile);
      assert(Array.isArray(configs));
      assert.strictEqual(configs[0].ecmaVersion, 'es6');
      assert.deepStrictEqual(configs[0].files, ['src/**/*.js']);
    });

    it('should handle array configs', async () => {
      const configFile = path.join(testDir, '.escheckrc');
      const configContent = [
        { ecmaVersion: 'es5', files: ['lib/**/*.js'] },
        { ecmaVersion: 'es6', files: ['src/**/*.js'] }
      ];
      fs.writeFileSync(configFile, JSON.stringify(configContent));

      const configs = await loadConfig(configFile);
      assert(Array.isArray(configs));
      assert.strictEqual(configs.length, 2);
      assert.strictEqual(configs[0].ecmaVersion, 'es5');
      assert.strictEqual(configs[1].ecmaVersion, 'es6');
    });
  });

  describe('Backwards compatibility', () => {
    it('should still work with CLI-style logger argument', async () => {
      const es5File = path.join(testDir, 'compat.js');
      fs.writeFileSync(es5File, 'var x = 5;');

      const config = [{
        ecmaVersion: 'es5',
        files: [es5File]
      }];

      const logger = createLogger({ silent: true });
      const result = await runChecks(config, logger);
      
      assert.strictEqual(result, undefined);
    });

    it('should detect CLI usage by logger methods', async () => {
      const es5File = path.join(testDir, 'cli-detect.js');
      fs.writeFileSync(es5File, 'var x = 5;');

      const config = [{
        ecmaVersion: 'es5',
        files: [es5File]
      }];

      const cliLogger = {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
        isLevelEnabled: () => false
      };

      const result = await runChecks(config, cliLogger);
      assert.strictEqual(result, undefined);
    });
  });

  describe('Edge cases', () => {
    it('should handle null as second argument', async () => {
      const es5File = path.join(testDir, 'null-logger.js');
      fs.writeFileSync(es5File, 'var x = 5;');

      const config = [{
        ecmaVersion: 'es5',
        files: [es5File]
      }];

      const result = await runChecks(config, null);
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.errors, []);
    });

    it('should handle undefined as second argument', async () => {
      const es5File = path.join(testDir, 'undefined-logger.js');
      fs.writeFileSync(es5File, 'var x = 5;');

      const config = [{
        ecmaVersion: 'es5',
        files: [es5File]
      }];

      const result = await runChecks(config, undefined);
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.errors, []);
    });

    it('should handle allowHashBang option', async () => {
      const hashbangFile = path.join(testDir, 'hashbang.js');
      fs.writeFileSync(hashbangFile, '#!/usr/bin/env node\nvar x = 5;');

      const config = [{
        ecmaVersion: 'es5',
        files: [hashbangFile],
        allowHashBang: true
      }];

      const result = await runChecks(config);
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.errors, []);
    });

    it('should handle looseGlobMatching option', async () => {
      const config = [{
        ecmaVersion: 'es5',
        files: [path.join(testDir, '*.nonexistent')],
        looseGlobMatching: true
      }];

      const result = await runChecks(config);
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.errors, []);
    });
  });
});