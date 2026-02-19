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

  return Array.from({ length: lineCount }).reduce((offsets, _, i) => {
    const origLen = (originalLines[i] || "").length;
    const stripLen = (strippedLines[i] || "").length;
    offsets.push(origLen - stripLen);
    return offsets;
  }, []);
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
  if (!code || typeof code !== "string") {
    return { code, lineOffsets: null };
  }

  const runtime = detectRuntime();

  if (runtime === "node") {
    return { code: stripTypesInNode(code), lineOffsets: null };
  }

  if (runtime === "bun") {
    return stripTypesInBun(code);
  }

  if (runtime === "deno") {
    return stripTypesInDeno();
  }

  throw new Error(
    "es-check execution on TypeScript files is not supported in this runtime",
  );
}

function parseCode(code, acornOpts, acorn, file, options = {}) {
  let processedCode = code;
  let lineOffsets = null;

  const isTypeScriptEnabled = options.typescript || options.ts;
  const isTypeScriptFile =
    file && (file.endsWith(".ts") || file.endsWith(".tsx"));

  if (isTypeScriptEnabled && isTypeScriptFile) {
    const result = stripTypeScript(code);
    processedCode = result.code;
    lineOffsets = result.lineOffsets;
  }

  try {
    const ast = acorn.parse(processedCode, acornOpts);
    return { ast, error: null };
  } catch (err) {
    const hasLocation = err.loc && err.loc.line && err.loc.column;
    const hasOffsets = hasLocation && lineOffsets !== null;
    const mapped = hasOffsets
      ? mapPosition(err.loc.line, err.loc.column, lineOffsets)
      : null;

    const line = hasLocation ? (mapped ? mapped.line : err.loc.line) : null;
    const column = hasLocation
      ? mapped
        ? mapped.column
        : err.loc.column
      : null;

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
