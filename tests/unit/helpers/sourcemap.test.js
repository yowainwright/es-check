const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const {
  loadSourceMap,
  mapErrorPosition,
} = require("../../../lib/helpers/sourcemap.js");

const testDir = path.join(__dirname, "../test-files-sourcemap");

function cleanupTestDir() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

describe("helpers/sourcemap.js", () => {
  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(cleanupTestDir);

  describe("loadSourceMap()", () => {
    it("should return null when source map file does not exist", async () => {
      const testFile = path.join(testDir, "no-map.js");
      fs.writeFileSync(testFile, "var x = 5;");

      const result = await loadSourceMap(testFile);

      assert.strictEqual(result, null);
    });

    it("should load valid source map file", async () => {
      const testFile = path.join(testDir, "with-map.js");
      const mapFile = `${testFile}.map`;

      fs.writeFileSync(testFile, "var x=5;");
      fs.writeFileSync(
        mapFile,
        JSON.stringify({
          version: 3,
          sources: ["original.js"],
          names: [],
          mappings: "AAAA",
          file: "with-map.js",
        }),
      );

      const result = await loadSourceMap(testFile);

      assert(result !== null);
      assert(typeof result.destroy === "function");
      result.destroy();
    });

    it("should return null when source map has invalid JSON", async () => {
      const testFile = path.join(testDir, "invalid-map.js");
      const mapFile = `${testFile}.map`;

      fs.writeFileSync(testFile, "var x=5;");
      fs.writeFileSync(mapFile, "invalid json content");

      const result = await loadSourceMap(testFile);

      assert.strictEqual(result, null);
    });

    it("should return null when source map has invalid format", async () => {
      const testFile = path.join(testDir, "bad-format.js");
      const mapFile = `${testFile}.map`;

      fs.writeFileSync(testFile, "var x=5;");
      fs.writeFileSync(mapFile, JSON.stringify({ invalid: "format" }));

      const result = await loadSourceMap(testFile);

      assert.strictEqual(result, null);
    });
  });

  describe("mapErrorPosition()", () => {
    it("should return original position when no source map exists", async () => {
      const testFile = path.join(testDir, "no-map-pos.js");
      fs.writeFileSync(testFile, "var x = 5;");

      const result = await mapErrorPosition(testFile, 1, 4);

      assert.deepStrictEqual(result, {
        file: testFile,
        line: 1,
        column: 4,
      });
    });

    it("should map position using source map", async () => {
      const testFile = path.join(testDir, "mapped.js");
      const mapFile = `${testFile}.map`;

      fs.writeFileSync(testFile, "var x=5;");
      fs.writeFileSync(
        mapFile,
        JSON.stringify({
          version: 3,
          sources: ["src/original.js"],
          names: [],
          mappings: "AAAA",
          file: "mapped.js",
        }),
      );

      const result = await mapErrorPosition(testFile, 1, 0);

      assert(result.file);
      assert(result.line !== undefined);
      assert(result.column !== undefined);
    });

    it("should return original position when mapping fails", async () => {
      const testFile = path.join(testDir, "no-mapping.js");
      const mapFile = `${testFile}.map`;

      fs.writeFileSync(testFile, "var x=5;");
      fs.writeFileSync(
        mapFile,
        JSON.stringify({
          version: 3,
          sources: ["original.js"],
          names: [],
          mappings: "",
          file: "no-mapping.js",
        }),
      );

      const result = await mapErrorPosition(testFile, 99, 99);

      assert.strictEqual(result.file, testFile);
      assert.strictEqual(result.line, 99);
      assert.strictEqual(result.column, 99);
    });

    it("should handle complex source map with multiple sources", async () => {
      const testFile = path.join(testDir, "complex.js");
      const mapFile = `${testFile}.map`;

      fs.writeFileSync(testFile, "var x=5;var y=10;");
      fs.writeFileSync(
        mapFile,
        JSON.stringify({
          version: 3,
          sources: ["src/file1.js", "src/file2.js"],
          names: ["x", "y"],
          mappings: "AAAA,IAAI,CAAC,CAAC,CAAC,CAAC",
          file: "complex.js",
        }),
      );

      const result = await mapErrorPosition(testFile, 1, 0);

      assert(result.file || result.file === testFile);
      assert(typeof result.line === "number");
      assert(typeof result.column === "number");
    });
  });
});
