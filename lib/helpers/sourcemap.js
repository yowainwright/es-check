const fs = require("fs");
const { SourceMapConsumer } = require("source-map");

async function loadSourceMap(file) {
  const mapFile = `${file}.map`;
  try {
    if (!fs.existsSync(mapFile)) {
      return null;
    }
    const mapContent = await fs.promises.readFile(mapFile, "utf8");
    const consumer = await new SourceMapConsumer(JSON.parse(mapContent));
    return consumer;
  } catch {
    return null;
  }
}

async function mapErrorPosition(file, line, column) {
  const consumer = await loadSourceMap(file);
  if (!consumer) {
    return { file, line, column };
  }

  const original = consumer.originalPositionFor({ line, column });
  consumer.destroy();

  if (original.source) {
    return {
      file: original.source,
      line: original.line,
      column: original.column,
    };
  }

  return { file, line, column };
}

module.exports = {
  loadSourceMap,
  mapErrorPosition,
};
