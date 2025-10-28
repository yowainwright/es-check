const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { processBatchedFiles, readFileAsync, clearFileCache, getFileCacheStats } = require('../../../lib/helpers/files.js');

const testDir = path.join(__dirname, '../test-files-helpers');

function cleanupTestDir() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

describe('helpers/files.js', () => {
  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    clearFileCache();
  });

  afterEach(() => {
    clearFileCache();
    cleanupTestDir();
  });

  describe('readFileAsync()', () => {
    it('should read file successfully', async () => {
      const testFile = path.join(testDir, 'test.js');
      fs.writeFileSync(testFile, 'var x = 5;');

      const result = await readFileAsync(testFile, fs, false);

      assert.strictEqual(result.error, null);
      assert.strictEqual(result.content, 'var x = 5;');
    });

    it('should return error for non-existent file', async () => {
      const testFile = path.join(testDir, 'nonexistent.js');

      const result = await readFileAsync(testFile, fs, false);

      assert.strictEqual(result.content, null);
      assert(result.error);
      assert(result.error.err);
      assert.strictEqual(result.error.file, testFile);
      assert(result.error.stack);
    });

    it('should use cache when useCache is true', async () => {
      const testFile = path.join(testDir, 'cached.js');
      fs.writeFileSync(testFile, 'var cached = true;');

      const result1 = await readFileAsync(testFile, fs, true);
      assert.strictEqual(result1.content, 'var cached = true;');

      fs.writeFileSync(testFile, 'var cached = false;');

      const result2 = await readFileAsync(testFile, fs, true);
      assert.strictEqual(result2.content, 'var cached = true;');
    });

    it('should not use cache when useCache is false', async () => {
      const testFile = path.join(testDir, 'not-cached.js');
      fs.writeFileSync(testFile, 'var cached = true;');

      const result1 = await readFileAsync(testFile, fs, false);
      assert.strictEqual(result1.content, 'var cached = true;');

      fs.writeFileSync(testFile, 'var cached = false;');

      const result2 = await readFileAsync(testFile, fs, false);
      assert.strictEqual(result2.content, 'var cached = false;');
    });

    it('should update cache when reading with useCache true', async () => {
      const testFile = path.join(testDir, 'update-cache.js');
      fs.writeFileSync(testFile, 'var x = 1;');

      await readFileAsync(testFile, fs, true);

      const stats = getFileCacheStats();
      assert.strictEqual(stats.size, 1);
      assert(stats.keys.includes(testFile));
    });
  });

  describe('processBatchedFiles()', () => {
    it('should process all files in parallel when batchSize is 0', async () => {
      const files = ['file1.js', 'file2.js', 'file3.js'];
      const processedFiles = [];

      const processor = async (file) => {
        processedFiles.push(file);
        return file;
      };

      const results = await processBatchedFiles(files, processor, 0);

      assert.strictEqual(results.length, 3);
      assert.deepStrictEqual(results, files);
      assert.deepStrictEqual(processedFiles.sort(), files.sort());
    });

    it('should process all files in parallel when batchSize is negative', async () => {
      const files = ['file1.js', 'file2.js'];
      const processor = async (file) => file.toUpperCase();

      const results = await processBatchedFiles(files, processor, -1);

      assert.strictEqual(results.length, 2);
      assert.deepStrictEqual(results, ['FILE1.JS', 'FILE2.JS']);
    });

    it('should process files in batches when batchSize is specified', async () => {
      const files = ['file1.js', 'file2.js', 'file3.js', 'file4.js', 'file5.js'];
      const batchSizes = [];

      const processor = async (file) => {
        return file;
      };

      const results = await processBatchedFiles(files, processor, 2);

      assert.strictEqual(results.length, 5);
      assert.deepStrictEqual(results, files);
    });

    it('should handle empty file array', async () => {
      const files = [];
      const processor = async (file) => file;

      const results = await processBatchedFiles(files, processor, 10);

      assert.strictEqual(results.length, 0);
      assert.deepStrictEqual(results, []);
    });

    it('should handle batchSize larger than file count', async () => {
      const files = ['file1.js', 'file2.js'];
      const processor = async (file) => file;

      const results = await processBatchedFiles(files, processor, 10);

      assert.strictEqual(results.length, 2);
      assert.deepStrictEqual(results, files);
    });

    it('should process with actual file reading', async () => {
      const file1 = path.join(testDir, 'batch1.js');
      const file2 = path.join(testDir, 'batch2.js');

      fs.writeFileSync(file1, 'var a = 1;');
      fs.writeFileSync(file2, 'var b = 2;');

      const processor = async (file) => {
        const result = await readFileAsync(file, fs, false);
        return result.content;
      };

      const results = await processBatchedFiles([file1, file2], processor, 1);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0], 'var a = 1;');
      assert.strictEqual(results[1], 'var b = 2;');
    });
  });

  describe('clearFileCache()', () => {
    it('should clear the cache', async () => {
      const testFile = path.join(testDir, 'to-clear.js');
      fs.writeFileSync(testFile, 'var x = 1;');

      await readFileAsync(testFile, fs, true);

      let stats = getFileCacheStats();
      assert.strictEqual(stats.size, 1);

      clearFileCache();

      stats = getFileCacheStats();
      assert.strictEqual(stats.size, 0);
      assert.deepStrictEqual(stats.keys, []);
    });
  });

  describe('getFileCacheStats()', () => {
    it('should return empty stats when cache is empty', () => {
      const stats = getFileCacheStats();

      assert.strictEqual(stats.size, 0);
      assert.deepStrictEqual(stats.keys, []);
    });

    it('should return correct stats after caching files', async () => {
      const file1 = path.join(testDir, 'stats1.js');
      const file2 = path.join(testDir, 'stats2.js');

      fs.writeFileSync(file1, 'var x = 1;');
      fs.writeFileSync(file2, 'var y = 2;');

      await readFileAsync(file1, fs, true);
      await readFileAsync(file2, fs, true);

      const stats = getFileCacheStats();

      assert.strictEqual(stats.size, 2);
      assert.strictEqual(stats.keys.length, 2);
      assert(stats.keys.includes(file1));
      assert(stats.keys.includes(file2));
    });

    it('should not count files read without cache', async () => {
      const file1 = path.join(testDir, 'no-cache.js');
      fs.writeFileSync(file1, 'var x = 1;');

      await readFileAsync(file1, fs, false);

      const stats = getFileCacheStats();
      assert.strictEqual(stats.size, 0);
    });
  });
});
