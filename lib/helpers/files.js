const fileCache = new Map();
let cacheHits = 0;
let cacheMisses = 0;

function processBatchedFiles(files, processor, batchSize = 0) {
  if (batchSize <= 0) {
    return files.map(processor);
  }

  let results = [];
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = batch.map(processor);
    results = results.concat(batchResults);
  }

  return results;
}

function readFile(file, fs, useCache = false) {
  const shouldReadFromCache = useCache && fileCache.has(file);
  if (shouldReadFromCache) {
    cacheHits++;
    return fileCache.get(file);
  }

  if (useCache) {
    cacheMisses++;
  }

  try {
    const content = fs.readFileSync(file, "utf8");
    const result = { content, error: null };

    if (useCache) {
      fileCache.set(file, result);
    }

    return result;
  } catch (err) {
    const result = {
      content: null,
      error: {
        err,
        stack: err.stack,
        file,
      },
    };

    if (useCache) {
      fileCache.set(file, result);
    }

    return result;
  }
}

function clearFileCache() {
  fileCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

function getFileCacheStats() {
  const total = cacheHits + cacheMisses;
  const hasNoReads = total === 0;
  const hitPercent = ((cacheHits / total) * 100).toFixed(2);
  const hitRate = hasNoReads ? "0.00%" : hitPercent + "%";

  return {
    size: fileCache.size,
    keys: Array.from(fileCache.keys()),
    hits: cacheHits,
    misses: cacheMisses,
    hitRate,
  };
}

module.exports = {
  processBatchedFiles,
  readFile,
  clearFileCache,
  getFileCacheStats,
};
