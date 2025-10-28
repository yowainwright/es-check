const fileCache = new Map();

async function processBatchedFiles(files, processor, batchSize = 0) {
  if (batchSize <= 0) {
    return await Promise.all(files.map(processor));
  }

  const results = [];
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}

async function readFileAsync(file, fs, useCache = false) {
  if (useCache && fileCache.has(file)) {
    const content = fileCache.get(file);
    return { content, error: null };
  }

  try {
    const content = await fs.promises.readFile(file, 'utf8');

    if (useCache) {
      fileCache.set(file, content);
    }

    return { content, error: null };
  } catch (err) {
    return {
      content: null,
      error: {
        err,
        stack: err.stack,
        file
      }
    };
  }
}

function clearFileCache() {
  fileCache.clear();
}

function getFileCacheStats() {
  return {
    size: fileCache.size,
    keys: Array.from(fileCache.keys())
  };
}

module.exports = {
  processBatchedFiles,
  readFileAsync,
  clearFileCache,
  getFileCacheStats
};
