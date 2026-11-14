const { test } = require("node:test");
const assert = require("node:assert/strict");
const acorn = require("acorn");
const { detectFeaturesFromAST } = require("../../../lib/core/ast");
const detectFeatures = require("../../../lib/core/detectFeatures");

function parse(code) {
  return acorn.parse(code, { ecmaVersion: 2026, sourceType: "module" });
}

function inspect(code) {
  return detectFeaturesFromAST(parse(code), code);
}

const methods = [
  ["map", "fn", "IteratorMap"],
  ["filter", "fn", "IteratorFilter"],
  ["take", "2", "IteratorTake"],
  ["drop", "2", "IteratorDrop"],
  ["flatMap", "fn", "IteratorFlatMap"],
  ["reduce", "fn, 0", "IteratorReduce"],
  ["toArray", "", "IteratorToArray"],
  ["forEach", "fn", "IteratorForEach"],
  ["some", "fn", "IteratorSome"],
  ["every", "fn", "IteratorEvery"],
  ["find", "fn", "IteratorFind"],
];

methods.forEach(([method, args, feature]) => {
  test(`${feature} requires ES2025 for a proven iterator`, () => {
    const code = `const it = [1, 2].values(); it.${method}(${args});`;
    const ast = parse(code);
    assert.strictEqual(inspect(code)[feature], true);
    assert.throws(
      () => detectFeatures(code, 15, "module", new Set(), { ast }),
      (error) => error.features.includes(feature),
    );
    assert.deepStrictEqual(
      detectFeatures(code, 16, "module", new Set(), { ast }).unsupportedFeatures,
      [],
    );
  });

  test(`${feature} has browser and core-js compatibility data`, () => {
    const code = `[1, 2].values().${method}(${args});`;
    const ast = parse(code);
    const targetBrowsers = [{ name: "chrome", version: "120" }];
    assert.throws(
      () => detectFeatures(code, 16, "module", new Set(), { ast, targetBrowsers }),
      (error) => error.browserDetails[feature]?.[0].requiredVersion === "122",
    );
    const result = detectFeatures(code, 15, "module", new Set(), {
      ast,
      ignorePolyfillable: "core-js",
    });
    assert.deepStrictEqual(result.unsupportedFeatures, []);
  });

  test(`${feature} respects explicit core-js module imports`, () => {
    const moduleName = method.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    const code = `import 'core-js/modules/es.iterator.${moduleName}.js'; [1].values().${method}(${args});`;
    const result = detectFeatures(code, 15, "module", new Set(), {
      ast: parse(code),
      checkForPolyfills: true,
    });
    assert.deepStrictEqual(result.unsupportedFeatures, []);
  });
});

const positive = [
  "[1, 2].sort().values().map(fn);",
  "[1, 2].reverse().values().map(fn);",
  "[1, 2].fill(0).values().map(fn);",
  "[1, 2].copyWithin(0, 1).values().map(fn);",
  "[1, 2].splice(0, 1).values().map(fn);",
  "const arr = [1, 2]; const alias = arr.sort(); alias.values().map(fn);",
  "Array(3).values().map(fn);",
  "Array().entries().map(fn);",
  "String(value).matchAll(pattern).map(fn);",
  "const text = String(value); text[Symbol.iterator]().map(fn);",
  "let it = ''; it ||= [].values(); it.map(fn);",
  "const empty = ''; let it = empty; it ||= [].values(); it.map(fn);",
  "const holder = {}; holder.it = ''; holder.it ||= [].values(); holder.it.map(fn);",
  "let it = ''; it &&= [].values(); it.matchAll(pattern).map(fn);",
  "let it = 'text'; it &&= [].values(); it.map(fn);",
  "let it = 'text'; it ||= [].values(); it.matchAll(pattern).map(fn);",
  "let it = new String(''); it &&= [].values(); it.map(fn);",
  "let it = new String(''); it ||= [].values(); it.matchAll(pattern).map(fn);",
  "let it = String(); it ||= [].values(); it.map(fn);",
  "let it = String(''); it ||= [].values(); it.map(fn);",
  "let it = String('text'); it &&= [].values(); it.map(fn);",
  "[1].values().map(fn);",
  "new Array(1).entries().map(fn);",
  "const arr = [1]; const it = arr.values(); it.map(fn);",
  "const it = Array.from([1]).keys(); it.map(fn);",
  "const it = new Uint8Array(2).values(); it.map(fn);",
  "let values; if (flag) values = new Int16Array(2); else values = new Uint16Array(2); values.slice().values().map(fn);",
  "let values; if (flag) values = new Int16Array(2); else values = new Uint16Array(2); values[Symbol.iterator]().map(fn);",
  "const it = new Set().values(); it.map(fn);",
  "const it = new Map().entries(); it.map(fn);",
  "const map = new Map(); map.values().map(fn);",
  "const it = 'abc'[Symbol.iterator](); it.map(fn);",
  "const it = 'abc'.matchAll(/a/g); it.map(fn);",
  "const it = Iterator.from([]); const alias = it; alias.map(fn);",
  "Iterator.from([]).filter(fn).take(2).drop(1).flatMap(fn).map(fn);",
  "const gen = function* () { yield 1; }; gen().map(fn);",
  "function* gen() { yield 1; } gen().map(fn);",
  "gen().map(fn); function* gen() { yield 1; }",
  "(function* () { yield 1; })().map(fn);",
  "let it; if (flag) it = [].values(); else it = new Set().values(); it.map(fn);",
  "let arr; if (flag) arr = []; else arr = [1]; arr.values().map(fn);",
  "const holder = {}; holder.it = [].values(); holder.it.map(fn);",
  "class C { constructor() { this.it = [].values(); } run() { this.it.map(fn); } }",
  "let it; do { it = [].values(); } while (flag); it.map(fn);",
  "let it; try { it = [].values(); } catch { it = new Set().values(); } it.map(fn);",
  "const it = [].values(); try { work(); } finally { it.map(fn); }",
];

positive.forEach((code) => {
  test(`recognizes an iterator receiver: ${code}`, () => {
    assert.strictEqual(inspect(code).IteratorMap, true);
  });
});

const negative = [
  "const arr = {sort() { return []; }}; arr.sort().values().map(fn);",
  "unknown.reverse().values().map(fn);",
  "function run(Array) { Array(3).values().map(fn); }",
  "function run(String) { String(value).matchAll(pattern).map(fn); }",
  "function run(String) { new String(value).matchAll(pattern).map(fn); }",
  "let it = ''; it &&= [].values(); it.map(fn);",
  "let it = ''; it ??= [].values(); it.map(fn);",
  "let it = 'text'; it ||= [].values(); it.map(fn);",
  "let it = new String(''); it ||= [].values(); it.map(fn);",
  "let it = String(value); it ||= [].values(); it.map(fn);",
  "let it = String(value); it &&= [].values(); it.map(fn);",
  "let arr = Array(3); arr = custom; arr.values().map(fn);",
  "let text = String(value); text = custom; text.matchAll(pattern).map(fn);",
  "[1].map(fn);",
  "const arr = [1]; arr.map(fn);",
  "const it = {map: fn}; it.map(fn);",
  "unknown.values().map(fn);",
  "function run(it) { it.map(fn); }",
  "function run(Iterator) { Iterator.from([]).map(fn); }",
  "function run(Map) { new Map().values().map(fn); }",
  "function run(Set) { new Set().values().map(fn); }",
  "function run(Uint8Array) { new Uint8Array(2).values().map(fn); }",
  "function run(Symbol) { 'abc'[Symbol.iterator]().map(fn); }",
  "let it = [].values(); it = custom; it.map(fn);",
  "let it = [].values(); if (flag) it = custom; it.map(fn);",
  "let it; if (flag) it = [].values(); it.map(fn);",
  "let it = [].values(); { const it = custom; it.map(fn); }",
  "let arr = []; arr = custom; arr.values().map(fn);",
  "let arr; if (flag) arr = []; else arr = custom; arr.values().map(fn);",
  "const holder = {}; holder.it = [].values(); holder[key] = custom; holder.it.map(fn);",
  "const holder = {}; holder.it = [].values(); delete holder.it; holder.it.map(fn);",
  "const it = Iterator.from([]).toArray(); it.map(fn);",
  "const it = [].values().reduce(fn, 0); it.map(fn);",
  "async function* gen() { yield 1; } gen().map(fn);",
  "function* gen() {} gen = custom; gen().map(fn);",
  "new WeakMap().values().map(fn);",
  "new WeakSet().values().map(fn);",
];

negative.forEach((code) => {
  test(`does not infer an iterator receiver: ${code}`, () => {
    assert.strictEqual(inspect(code).IteratorMap, false);
  });
});

test("array mutation chains retain iterator browser requirements", () => {
  const code = "[1, 2].sort().reverse().fill(0).copyWithin(0, 1).splice(0, 1).values().map(fn);";
  const ast = parse(code);
  const targetBrowsers = [{ name: "chrome", version: "120" }];
  assert.throws(
    () => detectFeatures(code, 16, "module", new Set(), { ast, targetBrowsers }),
    (error) => error.browserDetails.IteratorMap?.[0].requiredVersion === "122",
  );
  const supported = [{ name: "chrome", version: "122" }];
  const result = detectFeatures(code, 16, "module", new Set(), { ast, targetBrowsers: supported });
  assert.deepStrictEqual(result.unsupportedFeatures, []);
});

test("Iterator.from has its own static feature and respects shadowing", () => {
  assert.strictEqual(inspect("Iterator.from([]);").IteratorFrom, true);
  assert.strictEqual(inspect("function run(Iterator) { Iterator.from([]); }").IteratorFrom, false);
});

test("Iterator.from can be explicitly polyfilled with its constructor", () => {
  const code =
    "import 'core-js/modules/es.iterator.constructor'; import 'core-js/modules/es.iterator.from'; Iterator.from([]);";
  const result = detectFeatures(code, 15, "module", new Set(), {
    ast: parse(code),
    checkForPolyfills: true,
  });
  assert.deepStrictEqual(result.unsupportedFeatures, []);
});

test("an unrelated iterator polyfill does not suppress map detection", () => {
  const code = "import 'core-js/modules/es.iterator.filter'; [].values().map(fn);";
  assert.throws(
    () =>
      detectFeatures(code, 15, "module", new Set(), { ast: parse(code), checkForPolyfills: true }),
    (error) => error.features.includes("IteratorMap"),
  );
});

test("installed Iterator.prototype methods use the existing polyfill detector", () => {
  const code = "Iterator.prototype.map = function (fn) { return this; }; [].values().map(fn);";
  const result = detectFeatures(code, 15, "module", new Set(["Iterator"]), {
    ast: parse(code),
    checkForPolyfills: true,
  });
  assert.deepStrictEqual(result.unsupportedFeatures, []);
});

test("iterator support preserves Chrome's removal and reintroduction", () => {
  const code = "[].values().map(fn);";
  const ast = parse(code);
  ["117", "118", "122"].forEach((version) => {
    const targetBrowsers = [{ name: "chrome", version }];
    const result = detectFeatures(code, 16, "module", new Set(), { ast, targetBrowsers });
    assert.deepStrictEqual(result.unsupportedFeatures, []);
  });
  ["116", "119", "120", "121"].forEach((version) => {
    const targetBrowsers = [{ name: "chrome", version }];
    assert.throws(
      () => detectFeatures(code, 16, "module", new Set(), { ast, targetBrowsers }),
      (error) => error.features.includes("IteratorMap"),
    );
  });
});

test("returning an array from a helper chain does not turn array.map into an iterator helper", () => {
  const found = inspect("Iterator.from([]).take(1).toArray().map(fn);");
  assert.strictEqual(found.IteratorTake, true);
  assert.strictEqual(found.IteratorToArray, true);
  assert.strictEqual(found.IteratorMap, false);
});

test("array and iterator flatMap remain distinct features", () => {
  const array = inspect("[1].flatMap(fn);");
  const iterator = inspect("[1].values().flatMap(fn);");
  assert.strictEqual(array.ArrayFlatMap, true);
  assert.strictEqual(array.IteratorFlatMap, false);
  assert.strictEqual(iterator.ArrayFlatMap, false);
  assert.strictEqual(iterator.IteratorFlatMap, true);
});

test("an iterator flatMap polyfill does not require an array flatMap polyfill", () => {
  const code = "import 'core-js/modules/es.iterator.flat-map'; [].values().flatMap(fn);";
  const result = detectFeatures(code, 9, "module", new Set(), {
    ast: parse(code),
    checkForPolyfills: true,
  });
  assert.deepStrictEqual(result.unsupportedFeatures, []);
});

test("Map and WeakMap branch merges retain upsert detection without iterator inference", () => {
  const code =
    "let map; if (flag) map = new Map(); else map = new WeakMap(); map.getOrInsert(key, value); map.values().map(fn);";
  const found = inspect(code);
  assert.strictEqual(found.MapGetOrInsert, true);
  assert.strictEqual(found.IteratorMap, false);
});
