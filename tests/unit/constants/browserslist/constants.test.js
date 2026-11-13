const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { parse } = require("acorn");

const sourcePath = require.resolve("../../../../lib/constants/browserslist/constants");
const source = readFileSync(sourcePath, "utf8");
const ast = parse(source, { ecmaVersion: 2026 });
const names = ["BROWSER_SUPPORT_BROWSERS", "FEATURE_BCD_PATHS"];

test("browser generator inputs contain only const declarations and one export", () => {
  assert.equal(ast.body.length, 3);
  const declarations = ast.body.slice(0, 2);
  assert.deepEqual(
    declarations.map((statement) => statement.kind),
    ["const", "const"],
  );
  assert.deepEqual(
    declarations.map((statement) => statement.declarations.length),
    [1, 1],
  );
  const actualNames = declarations.map((statement) => statement.declarations[0].id.name);
  assert.deepEqual(actualNames, names);
});

test("browser generator inputs use literal strings in arrays and objects", () => {
  const browsers = ast.body[0].declarations[0].init;
  const paths = ast.body[1].declarations[0].init;
  assert.equal(browsers.type, "ArrayExpression");
  assert(browsers.elements.every((element) => element.type === "Literal"));
  assert(browsers.elements.every((element) => typeof element.value === "string"));
  assert.equal(paths.type, "ObjectExpression");
  assert(paths.properties.every((property) => property.value.type === "Literal"));
  assert(paths.properties.every((property) => typeof property.value.value === "string"));
  assert(paths.properties.every((property) => !property.computed));
});

test("browser generator inputs export only their declared constants", () => {
  const statement = ast.body[2];
  assert.equal(statement.type, "ExpressionStatement");
  const assignment = statement.expression;
  assert.equal(assignment.type, "AssignmentExpression");
  assert.equal(assignment.operator, "=");
  assert.equal(assignment.left.object.name, "module");
  assert.equal(assignment.left.property.name, "exports");
  assert.equal(assignment.right.type, "ObjectExpression");
  const exports = assignment.right.properties;
  assert(exports.every((property) => property.shorthand));
  assert.deepEqual(
    exports.map((property) => property.value.name),
    names,
  );
});
