const fs = require("fs");

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const VLQ_BASE_SHIFT = 5;
const VLQ_BASE = 1 << VLQ_BASE_SHIFT;
const VLQ_BASE_MASK = VLQ_BASE - 1;
const VLQ_CONTINUATION_BIT = VLQ_BASE;

function base64Decode(char) {
  return BASE64_CHARS.indexOf(char);
}

function decodeVLQValue(str, startIndex) {
  let result = 0;
  let shift = 0;
  let continuation = false;
  let index = startIndex;

  do {
    const reachedEnd = index >= str.length;
    if (reachedEnd) break;

    const digit = base64Decode(str[index++]);
    const invalidDigit = digit === -1;
    if (invalidDigit) break;

    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    const digitValue = digit & VLQ_BASE_MASK;
    result += digitValue << shift;
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  const isNegative = result & 1;
  const signedResult = result >> 1;
  const finalValue = isNegative ? -signedResult : signedResult;

  return { value: finalValue, nextIndex: index };
}

function decodeVLQ(str) {
  const values = [];
  let index = 0;

  while (index < str.length) {
    const decoded = decodeVLQValue(str, index);
    values.push(decoded.value);
    index = decoded.nextIndex;
  }

  return values;
}

function parseSegment(segment, state) {
  const hasNoSegment = !segment;
  if (hasNoSegment) return null;

  const values = decodeVLQ(segment);
  const hasNoValues = values.length === 0;
  if (hasNoValues) return null;

  const generatedColumn = state.previousGeneratedColumn + values[0];

  const hasSourceIndex = values.length > 1;
  const sourceIndex = hasSourceIndex
    ? state.previousSourceIndex + values[1]
    : null;
  const source = hasSourceIndex ? state.sources[sourceIndex] : null;

  const hasOriginalLine = values.length > 2;
  const originalLine = hasOriginalLine
    ? state.previousSourceLine + values[2] + 1
    : null;

  const hasOriginalColumn = values.length > 3;
  const originalColumn = hasOriginalColumn
    ? state.previousSourceColumn + values[3]
    : null;

  const hasNameIndex = values.length > 4;
  const nameIndex = hasNameIndex ? state.previousNameIndex + values[4] : null;
  const name = hasNameIndex ? state.names[nameIndex] : null;

  const mapping = {
    generatedLine: state.generatedLine,
    generatedColumn,
    sourceIndex,
    source,
    originalLine,
    originalColumn,
    nameIndex,
    name,
  };

  const nextState = {
    ...state,
    previousGeneratedColumn: generatedColumn,
    previousSourceIndex: sourceIndex ?? state.previousSourceIndex,
    previousSourceLine: hasOriginalLine
      ? state.previousSourceLine + values[2]
      : state.previousSourceLine,
    previousSourceColumn: originalColumn ?? state.previousSourceColumn,
    previousNameIndex: nameIndex ?? state.previousNameIndex,
  };

  return { mapping, nextState };
}

function parseLine(line, state) {
  const hasNoLine = !line;
  if (hasNoLine) {
    return {
      mappings: [],
      nextState: {
        ...state,
        generatedLine: state.generatedLine + 1,
        previousGeneratedColumn: 0,
      },
    };
  }

  const segments = line.split(",");
  const initialState = { ...state, previousGeneratedColumn: 0 };

  const result = segments.reduce(
    (acc, segment) => {
      const parsed = parseSegment(segment, acc.state);
      const hasMapping = parsed !== null;

      return hasMapping
        ? {
            mappings: [...acc.mappings, parsed.mapping],
            state: parsed.nextState,
          }
        : acc;
    },
    { mappings: [], state: initialState },
  );

  return {
    mappings: result.mappings,
    nextState: {
      ...result.state,
      generatedLine: state.generatedLine + 1,
    },
  };
}

function parseMappings(mappingsString, sources, names) {
  const lines = mappingsString.split(";");

  const initialState = {
    generatedLine: 1,
    previousGeneratedColumn: 0,
    previousSourceIndex: 0,
    previousSourceLine: 0,
    previousSourceColumn: 0,
    previousNameIndex: 0,
    sources,
    names,
  };

  const result = lines.reduce(
    (acc, line) => {
      const parsed = parseLine(line, acc.state);
      return {
        mappings: [...acc.mappings, ...parsed.mappings],
        state: parsed.nextState,
      };
    },
    { mappings: [], state: initialState },
  );

  return result.mappings;
}

function findClosestMapping(mappings, targetLine, targetColumn) {
  const sameLine = mappings.filter((m) => m.generatedLine === targetLine);
  const hasSameLine = sameLine.length > 0;

  if (!hasSameLine) return null;

  const withDistance = sameLine.map((mapping) => ({
    mapping,
    distance: Math.abs(mapping.generatedColumn - targetColumn),
  }));

  const sorted = withDistance.sort((a, b) => a.distance - b.distance);
  return sorted[0].mapping;
}

function buildSourcePath(sourceRoot, source) {
  const hasSourceRoot = sourceRoot && sourceRoot.length > 0;
  const combined = hasSourceRoot ? `${sourceRoot}/${source}` : source;
  return combined.replace(/\/+/g, "/");
}

class SourceMapConsumer {
  constructor(sourceMapData) {
    this.version = sourceMapData.version;
    this.sources = sourceMapData.sources || [];
    this.names = sourceMapData.names || [];
    this.mappings = sourceMapData.mappings || "";
    this.file = sourceMapData.file;
    this.sourceRoot = sourceMapData.sourceRoot || "";
    this._parsedMappings = parseMappings(
      this.mappings,
      this.sources,
      this.names,
    );
  }

  originalPositionFor({ line, column }) {
    const closest = findClosestMapping(this._parsedMappings, line, column);
    const hasNoClosest = !closest;
    const hasNoSource = hasNoClosest || !closest.source;

    if (hasNoSource) {
      return {
        source: null,
        line: null,
        column: null,
        name: null,
      };
    }

    const source = buildSourcePath(this.sourceRoot, closest.source);

    return {
      source,
      line: closest.originalLine,
      column: closest.originalColumn,
      name: closest.name || null,
    };
  }

  destroy() {
    this._parsedMappings = null;
  }
}

function loadSourceMap(file) {
  const mapFile = `${file}.map`;

  try {
    const mapExists = fs.existsSync(mapFile);
    if (!mapExists) return null;

    const mapContent = fs.readFileSync(mapFile, "utf8");
    const sourceMapData = JSON.parse(mapContent);

    const isValidVersion = sourceMapData.version === 3;
    if (!isValidVersion) return null;

    return new SourceMapConsumer(sourceMapData);
  } catch {
    return null;
  }
}

function mapErrorPosition(file, line, column) {
  const consumer = loadSourceMap(file);
  const hasNoConsumer = !consumer;

  if (hasNoConsumer) {
    return { file, line, column };
  }

  const original = consumer.originalPositionFor({ line, column });
  consumer.destroy();

  const hasOriginalSource = original.source !== null;

  return hasOriginalSource
    ? { file: original.source, line: original.line, column: original.column }
    : { file, line, column };
}

module.exports = {
  loadSourceMap,
  mapErrorPosition,
  SourceMapConsumer,
};
