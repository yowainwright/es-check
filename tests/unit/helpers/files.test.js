const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const {
  processBatchedFiles,
  readFile,
  clearFileCache,
  getFileCacheStats,
} = require("../../../lib/helpers/files.js");

const testDir = path.join(__dirname, "../test-files-helpers");

function cleanupTestDir() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

describe("helpers/files.js", () => {
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

  describe("readFile()", () => {
    it("should read file successfully", () => {
      const testFile = path.join(testDir, "test.js");
      fs.writeFileSync(testFile, "var x = 5;");

      const result = readFile(testFile, fs, false);

      assert.strictEqual(result.error, null);
      assert.strictEqual(result.content, "var x = 5;");
    });

    it("should return error for non-existent file", () => {
      const testFile = path.join(testDir, "nonexistent.js");

      const result = readFile(testFile, fs, false);

      assert.strictEqual(result.content, null);
      assert(result.error);
      assert(result.error.err);
      assert.strictEqual(result.error.file, testFile);
      assert(result.error.stack);
    });

    it("should use cache when useCache is true", () => {
      const testFile = path.join(testDir, "cached.js");
      fs.writeFileSync(testFile, "var cached = true;");

      const result1 = readFile(testFile, fs, true);
      assert.strictEqual(result1.content, "var cached = true;");

      fs.writeFileSync(testFile, "var cached = false;");

      const result2 = readFile(testFile, fs, true);
      assert.strictEqual(result2.content, "var cached = true;");
    });

    it("should not use cache when useCache is false", () => {
      const testFile = path.join(testDir, "not-cached.js");
      fs.writeFileSync(testFile, "var cached = true;");

      const result1 = readFile(testFile, fs, false);
      assert.strictEqual(result1.content, "var cached = true;");

      fs.writeFileSync(testFile, "var cached = false;");

      const result2 = readFile(testFile, fs, false);
      assert.strictEqual(result2.content, "var cached = false;");
    });

    it("should update cache when reading with useCache true", () => {
      const testFile = path.join(testDir, "update-cache.js");
      fs.writeFileSync(testFile, "var x = 1;");

      readFile(testFile, fs, true);

      const stats = getFileCacheStats();
      assert.strictEqual(stats.size, 1);
      assert(stats.keys.includes(testFile));
    });
  });

  describe("processBatchedFiles()", () => {
    it("should process all files when batchSize is 0", () => {
      const files = ["file1.js", "file2.js", "file3.js"];
      const processedFiles = [];

      const processor = (file) => {
        processedFiles.push(file);
        return file;
      };

      const results = processBatchedFiles(files, processor, 0);

      assert.strictEqual(results.length, 3);
      assert.deepStrictEqual(results, files);
      assert.deepStrictEqual(processedFiles.sort(), files.sort());
    });

    it("should process all files when batchSize is negative", () => {
      const files = ["file1.js", "file2.js"];
      const processor = (file) => file.toUpperCase();

      const results = processBatchedFiles(files, processor, -1);

      assert.strictEqual(results.length, 2);
      assert.deepStrictEqual(results, ["FILE1.JS", "FILE2.JS"]);
    });

    it("should process files in batches when batchSize is specified", () => {
      const files = [
        "file1.js",
        "file2.js",
        "file3.js",
        "file4.js",
        "file5.js",
      ];

      const processor = (file) => {
        return file;
      };

      const results = processBatchedFiles(files, processor, 2);

      assert.strictEqual(results.length, 5);
      assert.deepStrictEqual(results, files);
    });

    it("should handle empty file array", () => {
      const files = [];
      const processor = (file) => file;

      const results = processBatchedFiles(files, processor, 10);

      assert.strictEqual(results.length, 0);
      assert.deepStrictEqual(results, []);
    });

    it("should handle batchSize larger than file count", () => {
      const files = ["file1.js", "file2.js"];
      const processor = (file) => file;

      const results = processBatchedFiles(files, processor, 10);

      assert.strictEqual(results.length, 2);
      assert.deepStrictEqual(results, files);
    });

    it("should process with actual file reading", () => {
      const file1 = path.join(testDir, "batch1.js");
      const file2 = path.join(testDir, "batch2.js");

      fs.writeFileSync(file1, "var a = 1;");
      fs.writeFileSync(file2, "var b = 2;");

      const processor = (file) => {
        const result = readFile(file, fs, false);
        return result.content;
      };

      const results = processBatchedFiles([file1, file2], processor, 1);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0], "var a = 1;");
      assert.strictEqual(results[1], "var b = 2;");
    });
  });

  describe("clearFileCache()", () => {
    it("should clear the cache", () => {
      const testFile = path.join(testDir, "to-clear.js");
      fs.writeFileSync(testFile, "var x = 1;");

      readFile(testFile, fs, true);

      let stats = getFileCacheStats();
      assert.strictEqual(stats.size, 1);

      clearFileCache();

      stats = getFileCacheStats();
      assert.strictEqual(stats.size, 0);
      assert.deepStrictEqual(stats.keys, []);
    });
  });

  describe("getFileCacheStats()", () => {
    it("should return empty stats when cache is empty", () => {
      const stats = getFileCacheStats();

      assert.strictEqual(stats.size, 0);
      assert.deepStrictEqual(stats.keys, []);
    });

    it("should return correct stats after caching files", () => {
      const file1 = path.join(testDir, "stats1.js");
      const file2 = path.join(testDir, "stats2.js");

      fs.writeFileSync(file1, "var x = 1;");
      fs.writeFileSync(file2, "var y = 2;");

      readFile(file1, fs, true);
      readFile(file2, fs, true);

      const stats = getFileCacheStats();

      assert.strictEqual(stats.size, 2);
      assert.strictEqual(stats.keys.length, 2);
      assert(stats.keys.includes(file1));
      assert(stats.keys.includes(file2));
    });

    it("should not count files read without cache", () => {
      const file1 = path.join(testDir, "no-cache.js");
      fs.writeFileSync(file1, "var x = 1;");

      readFile(file1, fs, false);

      const stats = getFileCacheStats();
      assert.strictEqual(stats.size, 0);
    });
  });
});
