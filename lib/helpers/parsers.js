function parseCode(code, acornOpts, acorn, file) {
  try {
    const ast = acorn.parse(code, acornOpts);
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
};
