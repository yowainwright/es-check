const assert = require('assert');
const fs = require('fs');
const winston = require('winston');
const path = require('path');

const {
  parseIgnoreList,
  checkVarKindMatch,
  checkCalleeMatch,
  checkOperatorMatch,
  checkDefault,
  checkMap,
  createLogger,
  generateBashCompletion,
  generateZshCompletion,
  readFileAsync,
  parseCode,
  processBatchedFiles,
  determineInvocationType,
  determineLogLevel,
  handleESVersionError,
  mapErrorPosition
} = require('../../lib/utils');

describe('Utils Module Tests', () => {

  let originalConsoleError;
  let originalWinstonFormatColorize;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = () => {};

    originalWinstonFormatColorize = winston.format.colorize;
  });

  afterEach(() => {
    console.error = originalConsoleError;
    winston.format.colorize = originalWinstonFormatColorize;
  });

  describe('parseIgnoreList', () => {
    let originalFsExistsSync;
    let originalFsReadFileSync;
    let mockFsState;

    const manualMockFsExistsSync = (path) => {
      return mockFsState.existsSyncMocks[path] !== undefined
        ? mockFsState.existsSyncMocks[path]
        : false;
    };

    const manualMockFsReadFileSync = (path, encoding) => {
      if (mockFsState.readFileSyncMocks[path] !== undefined) {
        return mockFsState.readFileSyncMocks[path];
      }
      throw new Error(`Manual mock for readFileSync: No content defined for path: ${path}`);
    };

    beforeEach(() => {
      originalFsExistsSync = fs.existsSync;
      originalFsReadFileSync = fs.readFileSync;

      mockFsState = {
        existsSyncMocks: {},
        readFileSyncMocks: {},
      };

      fs.existsSync = manualMockFsExistsSync;
      fs.readFileSync = manualMockFsReadFileSync;
    });

    afterEach(() => {
      fs.existsSync = originalFsExistsSync;
      fs.readFileSync = originalFsReadFileSync;
    });

    it('should return an empty Set if no options are provided', () => {
      const result = parseIgnoreList();
      assert.deepStrictEqual(result, new Set());
    });

    it('should parse comma-separated features from options.ignore', () => {
      const result = parseIgnoreList({ ignore: 'featureA,featureB' });
      assert.deepStrictEqual(result, new Set(['featureA', 'featureB']));
    });

    it('should combine features from options.ignore and options.allowList', () => {
      const result = parseIgnoreList({ ignore: 'featureA', allowList: 'featureB' });
      assert.deepStrictEqual(result, new Set(['featureA', 'featureB']));
    });

    it('should throw an error if ignoreFile does not exist', () => {
      const filePath = 'nonexistent.json';
      mockFsState.existsSyncMocks[filePath] = false;
      assert.throws(() => parseIgnoreList({ ignoreFile: filePath }), /Ignore file not found:/);
    });

    it('should parse features from a valid ignoreFile', () => {
      const filePath = 'valid.json';
      mockFsState.existsSyncMocks[filePath] = true;
      mockFsState.readFileSyncMocks[filePath] = JSON.stringify({ features: ['fileFeature1', 'fileFeature2'] });
      const result = parseIgnoreList({ ignoreFile: filePath });
      assert.deepStrictEqual(result, new Set(['fileFeature1', 'fileFeature2']));
    });
  });

  describe('checkVarKindMatch', () => {
    it('should return true if node.kind equals astInfo.kind', () => {
      const node = { kind: 'const' };
      const astInfo = { kind: 'const' };
      assert.strictEqual(checkVarKindMatch(node, astInfo), true);
    });

    it('should return false if node.kind does not match astInfo.kind', () => {
      const node = { kind: 'let' };
      const astInfo = { kind: 'const' };
      assert.strictEqual(checkVarKindMatch(node, astInfo), false);
    });
  });

  describe('checkCalleeMatch', () => {
    it('should return true if callee name matches astInfo.callee', () => {
      const node = {
        callee: { type: 'Identifier', name: 'Promise' },
      };
      const astInfo = { callee: 'Promise' };
      assert.strictEqual(checkCalleeMatch(node, astInfo), true);
    });

    it('should return false if the callee name does not match astInfo.callee', () => {
      const node = {
        callee: { type: 'Identifier', name: 'WeakRef' },
      };
      const astInfo = { callee: 'Promise' };
      assert.strictEqual(checkCalleeMatch(node, astInfo), false);
    });
  });

  describe('checkOperatorMatch', () => {
    it('should return true if node.operator matches astInfo.operator', () => {
      const node = { operator: '??' };
      const astInfo = { operator: '??' };
      assert.strictEqual(checkOperatorMatch(node, astInfo), true);
    });

    it('should return false if node.operator does not match astInfo.operator', () => {
      const node = { operator: '**' };
      const astInfo = { operator: '??' };
      assert.strictEqual(checkOperatorMatch(node, astInfo), false);
    });
  });

  describe('checkDefault', () => {
    it('should always return true', () => {
      assert.strictEqual(checkDefault(), true);
    });
  });

  describe('checkMap.CallExpression', () => {
    it('should return true for global calls when callee matches', () => {
      const symbolNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'Symbol' }
      };
      assert.strictEqual(checkMap.CallExpression(symbolNode, { callee: 'Symbol' }), true);
    });

    it('should return true for member expressions when object and property match', () => {
      const getElementNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'window' },
          property: { type: 'Identifier', name: 'getElementById' }
        }
      };
      assert.strictEqual(checkMap.CallExpression(getElementNode, {
        object: 'window',
        property: 'getElementById'
      }), true);
    });

    it('should exclude specific objects when excludeObjects is provided', () => {
      const consoleGroupNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'console' },
          property: { type: 'Identifier', name: 'group' }
        }
      };

      const arrGroupNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'arr' },
          property: { type: 'Identifier', name: 'group' }
        }
      };

      const astInfoWithExclude = {
        property: 'group',
        excludeObjects: ['console']
      };

      assert.strictEqual(
        checkMap.CallExpression(consoleGroupNode, astInfoWithExclude),
        false,
        'console.group should be excluded'
      );

      assert.strictEqual(
        checkMap.CallExpression(arrGroupNode, astInfoWithExclude),
        true,
        'arr.group should not be excluded'
      );
    });

    it('should match property without excludeObjects when not specified', () => {
      const consoleGroupNode = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'console' },
          property: { type: 'Identifier', name: 'group' }
        }
      };

      const astInfoWithoutExclude = {
        property: 'group'
      };

      assert.strictEqual(
        checkMap.CallExpression(consoleGroupNode, astInfoWithoutExclude),
        true,
        'should match any .group() when no exclusions'
      );
    });
  });

  describe('checkMap.NewExpression', () => {
    it('should return true for Error with cause option', () => {
      const node = {
        type: 'NewExpression',
        callee: { type: 'Identifier', name: 'Error' },
        arguments: [
          { type: 'Literal', value: 'Something went wrong' },
          {
            type: 'ObjectExpression',
            properties: [{
              type: 'Property',
              key: { type: 'Identifier', name: 'cause' },
              value: { type: 'Identifier', name: 'e' }
            }]
          }
        ]
      };
      const astInfo = { callee: 'Error', hasOptionsCause: true };
      assert.strictEqual(checkMap.NewExpression(node, astInfo), true);
    });

    it('should return true for other NewExpressions without hasOptionsCause', () => {
      const node = {
        type: 'NewExpression',
        callee: { type: 'Identifier', name: 'Promise' },
        arguments: []
      };
      const astInfo = { callee: 'Promise' };
      assert.strictEqual(checkMap.NewExpression(node, astInfo), true);
    });
  });

  describe('createLogger', () => {
    const colorizeSentinel = {
      name: 'colorize',
      transform: (info, opts) => info
    };
    let originalWinstonCombine;
    let combineArgs;

    beforeEach(() => {
      winston.format.colorize = () => colorizeSentinel;
      originalWinstonCombine = winston.format.combine;
      combineArgs = [];
      winston.format.combine = (...args) => {
        combineArgs = args;
        return originalWinstonCombine(...args);
      };
    });

    afterEach(() => {
      winston.format.combine = originalWinstonCombine;
    });

    it('should create a logger with verbose level when verbose option is true', () => {
      const logger = createLogger({ verbose: true });
      assert.strictEqual(logger.transports[0].level, 'debug');
    });

    it('should create a silent logger when silent option is true', () => {
      const logger = createLogger({ silent: true });
      assert.strictEqual(logger.transports[0].silent, true);
    });

    it('should disable colorize format when noColor is true', () => {
      createLogger({ noColor: true });
      assert.ok(!combineArgs.includes(colorizeSentinel), 'colorizeSentinel should NOT be included when noColor is true');
    });

    it('should respect kebab-case no-color option', () => {
      createLogger({ 'no-color': true });
      assert.ok(!combineArgs.includes(colorizeSentinel), 'colorizeSentinel should NOT be included when no-color is true');
    });
  });

  describe('generateBashCompletion', () => {
    it('should generate a bash completion script', () => {
      const cmdName = 'es-check';
      const commands = ['check', 'version', 'completion'];
      const options = ['ignore', 'allowList', 'ignore-file', 'noColor'];
      const script = generateBashCompletion(cmdName, commands, options);
      assert.ok(script.includes(`_es_check_completion()`));
      assert.ok(script.includes(`cmds="check version completion"`));
      assert.ok(script.includes(`opts="--ignore --allowList --ignore-file --noColor"`));
    });
  });

  describe('generateZshCompletion', () => {
    it('should generate a zsh completion script', () => {
      const cmdName = 'es-check';
      const commands = ['check', 'version', 'completion'];
      const options = ['ignore', 'allowList', 'ignore-file', 'noColor'];
      const script = generateZshCompletion(cmdName, commands, options);
      assert.ok(script.includes(`#compdef es-check`));
      assert.ok(script.includes(`_es_check()`));
    });
  });

  describe('readFileAsync', () => {
    const tempFile = './test-temp-file.js';
    const tempContent = 'const test = "hello world";';

    beforeEach(() => {
      fs.writeFileSync(tempFile, tempContent);
    });

    afterEach(() => {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    });

    it('should read file content successfully', async () => {
      const result = await readFileAsync(tempFile, fs);
      assert.strictEqual(result.content, tempContent);
      assert.strictEqual(result.error, null);
    });

    it('should return error for non-existent file', async () => {
      const result = await readFileAsync('./non-existent-file.js', fs);
      assert.strictEqual(result.content, null);
      assert.ok(result.error);
      assert.ok(result.error.err);
      assert.strictEqual(result.error.file, './non-existent-file.js');
      assert.ok(result.error.stack);
    });
  });

  describe('parseCode', () => {
    const acorn = require('acorn');

    it('should parse valid ES5 code successfully', () => {
      const code = 'var x = 5;';
      const result = parseCode(code, { ecmaVersion: 5 }, acorn, 'test.js');
      assert.ok(result.ast);
      assert.strictEqual(result.error, null);
      assert.strictEqual(result.ast.type, 'Program');
    });

    it('should return error for invalid syntax', () => {
      const code = 'const x = 5;'; // ES6 syntax with ES5 parser
      const result = parseCode(code, { ecmaVersion: 5 }, acorn, 'test.js');
      assert.strictEqual(result.ast, null);
      assert.ok(result.error);
      assert.ok(result.error.err);
      assert.strictEqual(result.error.file, 'test.js');
      assert.ok(result.error.stack);
    });

    it('should parse ES6 code with ES6 settings', () => {
      const code = 'const x = () => 5;';
      const result = parseCode(code, { ecmaVersion: 6 }, acorn, 'test.js');
      assert.ok(result.ast);
      assert.strictEqual(result.error, null);
    });

    it('should parse module syntax with ES6 sourceType module', () => {
      const code = 'export var foo = "bar";';
      const result = parseCode(code, { ecmaVersion: 6, sourceType: 'module' }, acorn, 'test.js');
      assert.ok(result.ast);
      assert.strictEqual(result.error, null);
      assert.strictEqual(result.ast.type, 'Program');
    });

    it('should fail when parsing ES6+ features with ES5 ecmaVersion', () => {
      const code = 'const foo = () => "bar";';
      const result = parseCode(code, { ecmaVersion: 5 }, acorn, 'test.js');
      assert.strictEqual(result.ast, null);
      assert.ok(result.error);
      assert.ok(result.error.err);
    });

    it('should allow import/export in ES6 modules', () => {
      const code = 'import foo from "bar"; export default foo;';
      const result = parseCode(code, { ecmaVersion: 6, sourceType: 'module' }, acorn, 'test.js');
      assert.ok(result.ast);
      assert.strictEqual(result.error, null);
    });

    it('should fail ES6 syntax with ES5 ecmaVersion even in module mode', () => {
      const code = 'const x = () => 5;';
      const result = parseCode(code, { ecmaVersion: 5, sourceType: 'module' }, acorn, 'test.js');
      assert.strictEqual(result.ast, null);
      assert.ok(result.error);
    });
  });


  describe('processBatchedFiles', () => {
    it('should process all files with unlimited batch size', async () => {
      const files = ['file1.js', 'file2.js', 'file3.js'];
      const results = [];
      const processor = async (file) => {
        results.push(file);
        return `processed-${file}`;
      };

      const output = await processBatchedFiles(files, processor, 0);
      assert.deepStrictEqual(output, ['processed-file1.js', 'processed-file2.js', 'processed-file3.js']);
      assert.deepStrictEqual(results, files);
    });

    it('should process files in batches when batch size is specified', async () => {
      const files = ['file1.js', 'file2.js', 'file3.js', 'file4.js', 'file5.js'];
      const processingOrder = [];
      const processor = async (file) => {
        processingOrder.push(file);
        // Simulate async processing
        await new Promise(resolve => setTimeout(resolve, 10));
        return `processed-${file}`;
      };

      const output = await processBatchedFiles(files, processor, 2);
      assert.strictEqual(output.length, 5);
      assert.deepStrictEqual(processingOrder, files);
      // Check all files were processed
      output.forEach((result, index) => {
        assert.strictEqual(result, `processed-${files[index]}`);
      });
    });

    it('should handle empty file list', async () => {
      const processor = async (file) => `processed-${file}`;
      const output = await processBatchedFiles([], processor, 10);
      assert.deepStrictEqual(output, []);
    });

    it('should handle processor errors', async () => {
      const files = ['file1.js', 'file2.js'];
      const processor = async (file) => {
        if (file === 'file2.js') {
          throw new Error('Processing failed');
        }
        return `processed-${file}`;
      };

      try {
        await processBatchedFiles(files, processor, 0);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message.includes('Processing failed'));
      }
    });

    it('should process single file with batch size of 1', async () => {
      const files = ['single.js'];
      const processor = async (file) => `processed-${file}`;
      const output = await processBatchedFiles(files, processor, 1);
      assert.deepStrictEqual(output, ['processed-single.js']);
    });
  });

  describe('determineInvocationType', () => {
    it('should detect Node API usage when no argument is passed', () => {
      const result = determineInvocationType(null);
      assert.strictEqual(result.isNodeAPI, true);
      assert.strictEqual(result.logger, null);
    });

    it('should detect Node API usage when undefined is passed', () => {
      const result = determineInvocationType(undefined);
      assert.strictEqual(result.isNodeAPI, true);
      assert.strictEqual(result.logger, null);
    });

    it('should detect Node API usage when options object with logger is passed', () => {
      const mockLogger = { info: () => {}, error: () => {} };
      const result = determineInvocationType({ logger: mockLogger });
      assert.strictEqual(result.isNodeAPI, true);
      assert.strictEqual(result.logger, mockLogger);
    });

    it('should detect Node API usage when empty options object is passed', () => {
      const result = determineInvocationType({});
      assert.strictEqual(result.isNodeAPI, true);
      assert.strictEqual(result.logger, null);
    });

    it('should detect CLI usage when logger object is passed directly', () => {
      const mockLogger = { 
        info: () => {}, 
        error: () => {}, 
        warn: () => {},
        debug: () => {}
      };
      const result = determineInvocationType(mockLogger);
      assert.strictEqual(result.isNodeAPI, false);
      assert.strictEqual(result.logger, mockLogger);
    });

    it('should detect Node API usage when options object without logger methods is passed', () => {
      const result = determineInvocationType({ someOption: true });
      assert.strictEqual(result.isNodeAPI, true);
      assert.strictEqual(result.logger, null);
    });
  });

  describe('determineLogLevel', () => {
    it('should return null when logger is null', () => {
      const result = determineLogLevel(null);
      assert.strictEqual(result, null);
    });

    it('should return null when logger is undefined', () => {
      const result = determineLogLevel(undefined);
      assert.strictEqual(result, null);
    });

    it('should return null when logger has no isLevelEnabled method', () => {
      const mockLogger = { info: () => {}, error: () => {} };
      const result = determineLogLevel(mockLogger);
      assert.strictEqual(result, null);
    });

    it('should return log level flags when logger has isLevelEnabled', () => {
      const mockLogger = {
        isLevelEnabled: (level) => {
          const enabledLevels = { debug: true, warn: false, info: true, error: true };
          return enabledLevels[level];
        }
      };
      const result = determineLogLevel(mockLogger);
      assert.deepStrictEqual(result, {
        isDebug: true,
        isWarn: false,
        isInfo: true,
        isError: true
      });
    });

    it('should handle all levels disabled', () => {
      const mockLogger = {
        isLevelEnabled: () => false
      };
      const result = determineLogLevel(mockLogger);
      assert.deepStrictEqual(result, {
        isDebug: false,
        isWarn: false,
        isInfo: false,
        isError: false
      });
    });

    it('should handle all levels enabled', () => {
      const mockLogger = {
        isLevelEnabled: () => true
      };
      const result = determineLogLevel(mockLogger);
      assert.deepStrictEqual(result, {
        isDebug: true,
        isWarn: true,
        isInfo: true,
        isError: true
      });
    });
  });

  describe('handleESVersionError', () => {
    let originalProcessExit;
    let exitCalled;
    let exitCode;

    beforeEach(() => {
      originalProcessExit = process.exit;
      exitCalled = false;
      exitCode = null;
      process.exit = (code) => {
        exitCalled = true;
        exitCode = code;
      };
    });

    afterEach(() => {
      process.exit = originalProcessExit;
    });

    it('should log error when logger is provided', () => {
      let loggedMessage = null;
      const mockLogger = {
        error: (msg) => { loggedMessage = msg; }
      };
      const allErrors = [];
      
      handleESVersionError({
        errorType: 'browserslist',
        errorMessage: 'Test error message',
        logger: mockLogger,
        isNodeAPI: true,
        allErrors
      });

      assert.strictEqual(loggedMessage, 'Test error message');
    });

    it('should call process.exit when not in Node API mode', () => {
      const allErrors = [];
      
      const result = handleESVersionError({
        errorType: 'es3',
        errorMessage: 'ES3 error',
        logger: null,
        isNodeAPI: false,
        allErrors
      });

      assert.strictEqual(exitCalled, true);
      assert.strictEqual(exitCode, 1);
      assert.strictEqual(result.shouldContinue, false);
      assert.strictEqual(result.hasErrors, true);
      assert.strictEqual(allErrors.length, 0);
    });

    it('should add error to allErrors array in Node API mode', () => {
      const allErrors = [];
      
      const result = handleESVersionError({
        errorType: 'default',
        errorMessage: 'Invalid ES version',
        logger: null,
        isNodeAPI: true,
        allErrors
      });

      assert.strictEqual(exitCalled, false);
      assert.strictEqual(result.shouldContinue, true);
      assert.strictEqual(result.hasErrors, true);
      assert.strictEqual(allErrors.length, 1);
      assert.strictEqual(allErrors[0].err.message, 'Invalid ES version');
      assert.strictEqual(allErrors[0].file, 'config');
    });

    it('should use custom file parameter', () => {
      const allErrors = [];
      
      handleESVersionError({
        errorType: 'browserslist',
        errorMessage: 'Browserslist error',
        logger: null,
        isNodeAPI: true,
        allErrors,
        file: 'browserslist'
      });

      assert.strictEqual(allErrors[0].file, 'browserslist');
    });

    it('should handle all error types correctly', () => {
      const allErrors = [];
      
      // Test browserslist error
      handleESVersionError({
        errorType: 'browserslist',
        errorMessage: 'Browserslist config error',
        logger: null,
        isNodeAPI: true,
        allErrors
      });

      // Test es3 error
      handleESVersionError({
        errorType: 'es3',
        errorMessage: 'ES3 not supported',
        logger: null,
        isNodeAPI: true,
        allErrors
      });

      // Test default error
      handleESVersionError({
        errorType: 'default',
        errorMessage: 'Unknown ES version',
        logger: null,
        isNodeAPI: true,
        allErrors
      });

      assert.strictEqual(allErrors.length, 3);
      assert.strictEqual(allErrors[0].err.message, 'Browserslist config error');
      assert.strictEqual(allErrors[1].err.message, 'ES3 not supported');
      assert.strictEqual(allErrors[2].err.message, 'Unknown ES version');
    });
  });

  describe('mapErrorPosition', () => {
    const testDir = path.join(__dirname, '../fixtures/sourcemap-test');
    const testFile = path.join(testDir, 'bundle.js');
    const testMapFile = path.join(testDir, 'bundle.js.map');

    function cleanupSourceMapTest() {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    }

    beforeEach(() => {
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }

      fs.writeFileSync(testFile, 'var test = "bundled";');

      const sourceMap = {
        version: 3,
        sources: ['original.js'],
        names: [],
        mappings: 'AAAA',
        file: 'bundle.js',
        sourcesContent: ['const test = "original";']
      };
      fs.writeFileSync(testMapFile, JSON.stringify(sourceMap));
    });

    afterEach(cleanupSourceMapTest);
    after(cleanupSourceMapTest);

    it('should return original position when no source map exists', async () => {
      const result = await mapErrorPosition('nonexistent.js', 5, 10);
      assert.strictEqual(result.file, 'nonexistent.js');
      assert.strictEqual(result.line, 5);
      assert.strictEqual(result.column, 10);
    });

    it('should map position when source map exists', async () => {
      const result = await mapErrorPosition(testFile, 1, 0);
      assert.ok(result.file);
      assert.ok(result.line !== undefined);
      assert.ok(result.column !== undefined);
    });

    it('should handle invalid source map gracefully', async () => {
      const invalidMapFile = path.join(testDir, 'invalid.js');
      const invalidMap = path.join(testDir, 'invalid.js.map');
      fs.writeFileSync(invalidMapFile, 'code');
      fs.writeFileSync(invalidMap, 'invalid json');

      const result = await mapErrorPosition(invalidMapFile, 1, 0);
      assert.strictEqual(result.file, invalidMapFile);
      assert.strictEqual(result.line, 1);
      assert.strictEqual(result.column, 0);

      fs.unlinkSync(invalidMapFile);
      fs.unlinkSync(invalidMap);
    });
  });
});
