const { describe, it } = require("node:test");
const assert = require("node:assert");
const SimpleCache = require("../../lib/cache");

describe("SimpleCache", () => {
  describe("Basic operations", () => {
    it("should store and retrieve values", () => {
      const cache = new SimpleCache();
      cache.set("key1", "value1");
      assert.strictEqual(cache.get("key1"), "value1");
    });

    it("should return undefined for missing keys", () => {
      const cache = new SimpleCache();
      assert.strictEqual(cache.get("nonexistent"), undefined);
    });

    it("should check if key exists with has()", () => {
      const cache = new SimpleCache();
      cache.set("key1", "value1");
      assert.strictEqual(cache.has("key1"), true);
      assert.strictEqual(cache.has("key2"), false);
    });

    it("should clear all entries", () => {
      const cache = new SimpleCache();
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.clear();
      assert.strictEqual(cache.get("key1"), undefined);
      assert.strictEqual(cache.get("key2"), undefined);
      assert.strictEqual(cache.cache.size, 0);
    });
  });

  describe("LRU behavior", () => {
    it("should maintain LRU order", () => {
      const cache = new SimpleCache(3);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      cache.get("a");

      cache.set("d", 4);

      assert.strictEqual(cache.get("b"), undefined);
      assert.strictEqual(cache.get("a"), 1);
      assert.strictEqual(cache.get("c"), 3);
      assert.strictEqual(cache.get("d"), 4);
    });

    it("should respect max size limit", () => {
      const cache = new SimpleCache(2);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      assert.strictEqual(cache.cache.size, 2);
      assert.strictEqual(cache.get("a"), undefined);
      assert.strictEqual(cache.get("b"), 2);
      assert.strictEqual(cache.get("c"), 3);
    });

    it("should update existing key without eviction", () => {
      const cache = new SimpleCache(2);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("a", 10);

      assert.strictEqual(cache.get("a"), 10);
      assert.strictEqual(cache.get("b"), 2);
      assert.strictEqual(cache.cache.size, 2);
    });
  });

  describe("TTL functionality", () => {
    it("should expire entries after TTL", async () => {
      const cache = new SimpleCache(10, 50);
      cache.set("key1", "value1");

      assert.strictEqual(cache.get("key1"), "value1");

      await new Promise((resolve) => setTimeout(resolve, 60));
      assert.strictEqual(cache.get("key1"), undefined);
    });

    it("should not expire entries before TTL", async () => {
      const cache = new SimpleCache(10, 100);
      cache.set("key1", "value1");

      await new Promise((resolve) => setTimeout(resolve, 50));
      assert.strictEqual(cache.get("key1"), "value1");
    });

    it("should handle has() with expired entries", async () => {
      const cache = new SimpleCache(10, 50);
      cache.set("key1", "value1");

      assert.strictEqual(cache.has("key1"), true);

      await new Promise((resolve) => setTimeout(resolve, 60));
      assert.strictEqual(cache.has("key1"), false);
    });
  });

  describe("Statistics", () => {
    it("should track hits and misses", () => {
      const cache = new SimpleCache();
      cache.set("key1", "value1");

      cache.get("key1");
      cache.get("key1");
      cache.get("key2");
      cache.get("key3");

      const stats = cache.getStats();
      assert.strictEqual(stats.hits, 2);
      assert.strictEqual(stats.misses, 2);
      assert.strictEqual(stats.total, 4);
      assert.strictEqual(stats.hitRate, "50.00%");
    });

    it("should reset stats on clear", () => {
      const cache = new SimpleCache();
      cache.set("key1", "value1");
      cache.get("key1");
      cache.get("key2");

      cache.clear();

      const stats = cache.getStats();
      assert.strictEqual(stats.hits, 0);
      assert.strictEqual(stats.misses, 0);
      assert.strictEqual(stats.total, 0);
      assert.strictEqual(stats.hitRate, "0.00%");
    });

    it("should handle zero total in stats", () => {
      const cache = new SimpleCache();
      const stats = cache.getStats();

      assert.strictEqual(stats.hits, 0);
      assert.strictEqual(stats.misses, 0);
      assert.strictEqual(stats.total, 0);
      assert.strictEqual(stats.hitRate, "0.00%");
      assert.strictEqual(stats.size, 0);
    });
  });

  describe("Edge cases", () => {
    it("should handle null values", () => {
      const cache = new SimpleCache();
      cache.set("key1", null);
      assert.strictEqual(cache.get("key1"), null);
    });

    it("should handle undefined values", () => {
      const cache = new SimpleCache();
      cache.set("key1", undefined);
      assert.strictEqual(cache.get("key1"), undefined);
      assert.strictEqual(cache.has("key1"), true);
    });

    it("should handle complex objects", () => {
      const cache = new SimpleCache();
      const obj = { a: 1, b: { c: 2 } };
      cache.set("key1", obj);

      const retrieved = cache.get("key1");
      assert.deepStrictEqual(retrieved, obj);
      assert.strictEqual(retrieved, obj);
    });

    it("should handle maxSize of 1", () => {
      const cache = new SimpleCache(1);
      cache.set("a", 1);
      cache.set("b", 2);

      assert.strictEqual(cache.get("a"), undefined);
      assert.strictEqual(cache.get("b"), 2);
      assert.strictEqual(cache.cache.size, 1);
    });
  });
});
