function detectRuntime() {
  if (typeof Deno !== 'undefined') {
    return 'deno';
  }
  if (typeof Bun !== 'undefined') {
    return 'bun';
  }
  return 'node';
}

function stripTypesInNode(code) {
  const moduleAPI = require('module');
  if (typeof moduleAPI.stripTypeScriptTypes === 'function') {
    return moduleAPI.stripTypeScriptTypes(code, { mode: 'strip' });
  }
  throw new Error('es-check execution on TypeScript files requires Node.js v22.13.0+');
}

function stripTypesInBun(code) {
  if (typeof Bun !== 'undefined' && typeof Bun.Transpiler !== 'undefined') {
    const transpiler = new Bun.Transpiler({ loader: 'ts' });
    return transpiler.transformSync(code);
  }
  throw new Error('es-check execution on TypeScript files requires Bun v1.0.0+');
}

function stripTypesInDeno() {
  throw new Error('es-check execution on TypeScript files is not supported in Deno (Deno has native TypeScript support)');
}

function stripTypeScript(code) {
  if (!code || typeof code !== 'string') {
    return code;
  }

  const runtime = detectRuntime();

  if (runtime === 'node') {
    return stripTypesInNode(code);
  }

  if (runtime === 'bun') {
    return stripTypesInBun(code);
  }

  if (runtime === 'deno') {
    return stripTypesInDeno();
  }

  throw new Error('es-check execution on TypeScript files is not supported in this runtime');
}

function parseCode(code, acornOpts, acorn, file, options = {}) {
  let processedCode = code;

  const isTypeScriptEnabled = options.typescript || options.ts;
  const isTypeScriptFile = file && (file.endsWith('.ts') || file.endsWith('.tsx'));

  if (isTypeScriptEnabled && isTypeScriptFile) {
    processedCode = stripTypeScript(code);
  }

  try {
    const ast = acorn.parse(processedCode, acornOpts);
    return { ast, error: null };
  } catch (err) {
    const hasLocation = err.loc && err.loc.line && err.loc.column;
    const line = hasLocation ? err.loc.line : null;
    const column = hasLocation ? err.loc.column : null;

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
};
