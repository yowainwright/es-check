function detectRuntime() {
  if (typeof Deno !== "undefined") {
    return "deno";
  }
  if (typeof Bun !== "undefined") {
    return "bun";
  }
  return "node";
}

function stripTypesInNode(code) {
  const moduleAPI = require("module");
  if (typeof moduleAPI.stripTypeScriptTypes === "function") {
    return moduleAPI.stripTypeScriptTypes(code, { mode: "strip" });
  }
  throw new Error(
    "es-check execution on TypeScript files requires Node.js v22.13.0+",
  );
}

function buildLineOffsets(original, stripped) {
  const originalLines = original.split("\n");
  const strippedLines = stripped.split("\n");
  const lineCount = Math.max(originalLines.length, strippedLines.length);

  const offsets = [];
  for (let i = 0; i < lineCount; i++) {
    const origLen = (originalLines[i] || "").length;
    const stripLen = (strippedLines[i] || "").length;
    offsets.push(origLen - stripLen);
  }
  return offsets;
}

function mapPosition(line, column, lineOffsets) {
  const hasNoOffsets = !lineOffsets || lineOffsets.length === 0;
  if (hasNoOffsets) return { line, column };

  const lineIndex = line - 1;
  const isBelowRange = lineIndex < 0;
  const isAboveRange = lineIndex >= lineOffsets.length;
  const isOutOfBounds = isBelowRange || isAboveRange;
  if (isOutOfBounds) return { line, column };

  const offset = lineOffsets[lineIndex];
  const adjustedColumn = column + offset;
  return { line, column: adjustedColumn };
}

function stripTypesInBun(code) {
  if (typeof Bun !== "undefined" && typeof Bun.Transpiler !== "undefined") {
    const transpiler = new Bun.Transpiler({ loader: "ts" });
    const stripped = transpiler.transformSync(code);
    const lineOffsets = buildLineOffsets(code, stripped);
    return { code: stripped, lineOffsets };
  }
  throw new Error(
    "es-check execution on TypeScript files requires Bun v1.0.0+",
  );
}

function stripTypesInDeno() {
  throw new Error(
    "es-check execution on TypeScript files is not supported in Deno (Deno has native TypeScript support)",
  );
}

function stripTypeScript(code) {
  const isInvalidCode = !code || typeof code !== "string";
  if (isInvalidCode) {
    return { code, lineOffsets: null };
  }

  const runtime = detectRuntime();
  const isNodeRuntime = runtime === "node";
  const isBunRuntime = runtime === "bun";
  const isDenoRuntime = runtime === "deno";

  if (isNodeRuntime) {
    return { code: stripTypesInNode(code), lineOffsets: null };
  }

  if (isBunRuntime) {
    return stripTypesInBun(code);
  }

  if (isDenoRuntime) {
    return stripTypesInDeno();
  }

  throw new Error(
    "es-check execution on TypeScript files is not supported in this runtime",
  );
}

function parseCode(code, acornOpts, acorn, file, options = {}) {
  let processedCode = code;
  let lineOffsets = null;

  const hasTypeScriptOption = options.typescript || options.ts;
  const hasTsExtension = file?.endsWith(".ts");
  const hasTsxExtension = file?.endsWith(".tsx");
  const isTypeScriptFile = hasTsExtension || hasTsxExtension;
  const shouldProcessTypeScript = hasTypeScriptOption && isTypeScriptFile;

  if (shouldProcessTypeScript) {
    const result = stripTypeScript(code);
    processedCode = result.code;
    lineOffsets = result.lineOffsets;
  }

  try {
    const ast = acorn.parse(processedCode, acornOpts);
    return { ast, error: null };
  } catch (err) {
    const errorLocation = err.loc;
    const hasValidLocation = errorLocation?.line && errorLocation?.column;
    const hasLineOffsets = lineOffsets !== null;
    const shouldMapPosition = hasValidLocation && hasLineOffsets;

    const mappedPosition = shouldMapPosition
      ? mapPosition(errorLocation.line, errorLocation.column, lineOffsets)
      : null;

    let line = null;
    let column = null;

    if (hasValidLocation) {
      line = mappedPosition?.line ?? errorLocation.line;
      column = mappedPosition?.column ?? errorLocation.column;
    }

    return {
      ast: null,
      error: {
        err,
        stack: err.stack,
        file,
        line,
        column,
      },
    };
  }
}

module.exports = {
  parseCode,
  stripTypeScript,
  detectRuntime,
  stripTypesInNode,
  stripTypesInBun,
  stripTypesInDeno,
  buildLineOffsets,
  mapPosition,
};
