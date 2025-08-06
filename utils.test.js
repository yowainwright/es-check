const assert = require('assert');
const fs = require('fs');
const winston = require('winston');
const supportsColor = require('supports-color');

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
  processBatchedFiles
} = require('./utils');

describe('Utils Module Tests', () => {

  let originalConsoleError;
  let originalWinstonFormatColorize;
  let originalSupportsColorDescriptor;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = () => {};

    originalWinstonFormatColorize = winston.format.colorize;
    originalSupportsColorDescriptor = Object.getOwnPropertyDescriptor(supportsColor, 'stdout');
  });

  afterEach(() => {
    console.error = originalConsoleError;
    winston.format.colorize = originalWinstonFormatColorize;
    if (originalSupportsColorDescriptor) {
      Object.defineProperty(supportsColor, 'stdout', originalSupportsColorDescriptor);
    }
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

    it('should disable colorize format when supportsColor.stdout is true but noColor is true', () => {
      Object.defineProperty(supportsColor, 'stdout', { value: true, configurable: true });
      createLogger({ noColor: true });
      assert.ok(!combineArgs.includes(colorizeSentinel), 'colorizeSentinel should NOT be included when noColor is true');
    });

    it('should disable colorize format when supportsColor.stdout is false', () => {
      Object.defineProperty(supportsColor, 'stdout', { value: false, configurable: true });
      createLogger();
      assert.ok(!combineArgs.includes(colorizeSentinel), 'colorizeSentinel should NOT be included when supportsColor.stdout is false');
    });

    it('should respect kebab-case no-color option', () => {
      Object.defineProperty(supportsColor, 'stdout', { value: true, configurable: true });
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
});
