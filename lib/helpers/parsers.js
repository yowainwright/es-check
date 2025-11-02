const { fastBrakeSync } = require("fast-brake/sync");
const esversionPlugin = require("fast-brake/plugins/esversion");
const { ECMA_VERSION_MAP } = require("../constants/versions");

const fastbrake = fastBrakeSync({ plugins: [esversionPlugin.default] });

function getTargetVersion(ecmaVersion) {
  return ECMA_VERSION_MAP[ecmaVersion] || "es5";
}

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

function parseLightMode(code, ecmaVersion, isModule, allowHashBang, file) {
  const targetVersion = getTargetVersion(ecmaVersion);

  const codeToCheck =
    allowHashBang && code.startsWith("#!")
      ? code.slice(code.indexOf("\n") + 1)
      : code;

  try {
    const isCompatible = fastbrake.check(codeToCheck, {
      target: targetVersion,
      sourceType: isModule ? "module" : "script",
    });

    if (!isCompatible) {
      return {
        error: {
          err: new Error(
            `Code contains features incompatible with ${targetVersion}`,
          ),
          stack: "",
          file,
        },
      };
    }

    return { error: null };
  } catch (err) {
    return {
      error: {
        err: new Error(`Failed to check code in light mode: ${err.message}`),
        stack: err.stack || "",
        file,
      },
    };
  }
}

module.exports = {
  getTargetVersion,
  parseCode,
  parseLightMode,
};
