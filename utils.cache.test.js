const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { readFileAsync, clearFileCache, getFileCacheStats } = require('./utils');

describe('File Cache Utils', () => {
  const testFile = path.join(__dirname, 'test-cache-file.js');
  const testContent = 'const test = "cache test content";';
  
  before(() => {
    fs.writeFileSync(testFile, testContent);
  });
  
  after(() => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });
  
  beforeEach(() => {
    clearFileCache();
  });
  
  describe('readFileAsync with cache', () => {
    it('should read file without cache when useCache is false', async () => {
      const result1 = await readFileAsync(testFile, fs, false);
      const result2 = await readFileAsync(testFile, fs, false);
      
      assert.strictEqual(result1.content, testContent);
      assert.strictEqual(result2.content, testContent);
      assert.strictEqual(result1.error, null);
      
      const stats = getFileCacheStats();
      assert.strictEqual(stats.hits, 0);
      assert.strictEqual(stats.misses, 0);
    });
    
    it('should cache file content when useCache is true', async () => {
      const result1 = await readFileAsync(testFile, fs, true);
      const result2 = await readFileAsync(testFile, fs, true);
      
      assert.strictEqual(result1.content, testContent);
      assert.strictEqual(result2.content, testContent);
      assert.strictEqual(result1, result2);
      
      const stats = getFileCacheStats();
      assert.strictEqual(stats.hits, 1);
      assert.strictEqual(stats.misses, 1);
      assert.strictEqual(stats.hitRate, '50.00%');
    });
    
    it('should cache file read errors', async () => {
      const nonExistentFile = path.join(__dirname, 'non-existent-file.js');
      
      const result1 = await readFileAsync(nonExistentFile, fs, true);
      const result2 = await readFileAsync(nonExistentFile, fs, true);
      
      assert.strictEqual(result1.content, null);
      assert.notStrictEqual(result1.error, null);
      assert.strictEqual(result1, result2);
      
      const stats = getFileCacheStats();
      assert.strictEqual(stats.hits, 1);
      assert.strictEqual(stats.misses, 1);
    });
    
    it('should clear cache when clearFileCache is called', async () => {
      await readFileAsync(testFile, fs, true);
      
      let stats = getFileCacheStats();
      assert.strictEqual(stats.size, 1);
      
      clearFileCache();
      
      stats = getFileCacheStats();
      assert.strictEqual(stats.size, 0);
      assert.strictEqual(stats.hits, 0);
      assert.strictEqual(stats.misses, 0);
    });
    
    it('should handle multiple different files with cache', async () => {
      const testFile2 = path.join(__dirname, 'test-cache-file-2.js');
      const testContent2 = 'const test2 = "second file";';
      fs.writeFileSync(testFile2, testContent2);
      
      try {
        const result1 = await readFileAsync(testFile, fs, true);
        const result2 = await readFileAsync(testFile2, fs, true);
        const result3 = await readFileAsync(testFile, fs, true);
        const result4 = await readFileAsync(testFile2, fs, true);
        
        assert.strictEqual(result1.content, testContent);
        assert.strictEqual(result2.content, testContent2);
        assert.strictEqual(result3, result1);
        assert.strictEqual(result4, result2);
        
        const stats = getFileCacheStats();
        assert.strictEqual(stats.hits, 2);
        assert.strictEqual(stats.misses, 2);
        assert.strictEqual(stats.size, 2);
      } finally {
        if (fs.existsSync(testFile2)) {
          fs.unlinkSync(testFile2);
        }
      }
    });
  });
});