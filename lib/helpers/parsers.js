const { Linter } = require("eslint");

function parseCode(code, parserOptions, parser, file) {
  const linter = new Linter({ configType: "eslintrc" });
  const config = { parserOptions: parserOptions || {}, rules: {} };

  if (parser) {
    const parserName = "es-check-parser";
    linter.defineParser(parserName, parser);
    config.parser = parserName;
  }

  try {
    const messages = linter.verify(code, config, file);
    const fatal = messages.find((message) => message.fatal);

    if (fatal) {
      const err = new Error(fatal.message);
      return {
        ast: null,
        error: {
          err,
          stack: err.stack,
          file,
          line: fatal.line || null,
          column: fatal.column || null,
        },
      };
    }

    const sourceCode = linter.getSourceCode();
    return { ast: sourceCode.ast, error: null };
  } catch (err) {
    const line = err.lineNumber ?? err.line ?? err.loc?.line ?? null;
    const column = err.column ?? err.colNumber ?? err.loc?.column ?? null;

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
