class SimpleCache {
  constructor(maxSize = 1000, ttl = null) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const hasKey = this.cache.has(key);

    if (!hasKey) {
      this.misses++;
      return undefined;
    }

    const entry = this.cache.get(key);

    const hasTTL = this.ttl !== null;
    const isExpired = hasTTL && Date.now() - entry.timestamp > this.ttl;

    if (isExpired) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key, value) {
    const isFull = this.cache.size >= this.maxSize;
    const hasKey = this.cache.has(key);

    if (isFull && !hasKey) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const entry = {
      value,
      timestamp: Date.now(),
    };

    this.cache.set(key, entry);
  }

  has(key) {
    const hasKey = this.cache.has(key);

    if (!hasKey) {
      return false;
    }

    const hasTTL = this.ttl !== null;

    if (hasTTL) {
      const entry = this.cache.get(key);
      const isExpired = Date.now() - entry.timestamp > this.ttl;

      if (isExpired) {
        this.cache.delete(key);
        return false;
      }
    }

    return true;
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: hitRate.toFixed(2) + "%",
      size: this.cache.size,
    };
  }
}

module.exports = SimpleCache;
