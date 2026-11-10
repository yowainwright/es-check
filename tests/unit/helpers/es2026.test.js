const { test } = require("node:test");
const assert = require("node:assert/strict");
const acorn = require("acorn");
const bcd = require("@mdn/browser-compat-data");
const detectFeatures = require("../../../lib/detectFeatures");
const { detectFeaturesFromAST } = require("../../../lib/helpers/astDetector");

function parse(code) {
  return acorn.parse(code, { ecmaVersion: 2026, sourceType: "module" });
}

const apiCases = [
  ["JSONParseSource", "JSON.parse(text, (k, v, context) => context.source);", ["json.parse"]],
  ["JSONRawJSON", "JSON.rawJSON(text);", ["json.raw-json"]],
  ["JSONIsRawJSON", "JSON.isRawJSON(value);", ["json.is-raw-json"]],
  ["ArrayFromAsync", "Array.fromAsync(values);", ["array.from-async"]],
  ["ErrorIsError", "Error.isError(value);", ["error.is-error"]],
  ["MathSumPrecise", "Math.sumPrecise(values);", ["math.sum-precise"]],
  ["IteratorConcat", "Iterator.concat(first, second);", ["iterator.concat"]],
  [
    "MapGetOrInsert",
    "new Map().getOrInsert(key, value);",
    ["map.get-or-insert", "weak-map.get-or-insert"],
  ],
  [
    "MapGetOrInsert",
    "new WeakMap().getOrInsert(key, value);",
    ["map.get-or-insert", "weak-map.get-or-insert"],
  ],
  [
    "MapGetOrInsertComputed",
    "new Map().getOrInsertComputed(key, fn);",
    ["map.get-or-insert-computed", "weak-map.get-or-insert-computed"],
  ],
  [
    "MapGetOrInsertComputed",
    "new WeakMap().getOrInsertComputed(key, fn);",
    ["map.get-or-insert-computed", "weak-map.get-or-insert-computed"],
  ],
  ["Uint8ArrayFromBase64", "Uint8Array.fromBase64(text);", ["uint8-array.from-base64"]],
  ["Uint8ArrayFromHex", "Uint8Array.fromHex(text);", ["uint8-array.from-hex"]],
  ["Uint8ArrayToBase64", "new Uint8Array(1).toBase64();", ["uint8-array.to-base64"]],
  ["Uint8ArrayToHex", "new Uint8Array(1).toHex();", ["uint8-array.to-hex"]],
  [
    "Uint8ArraySetFromBase64",
    "new Uint8Array(1).setFromBase64(text);",
    ["uint8-array.set-from-base64"],
  ],
  ["Uint8ArraySetFromHex", "new Uint8Array(1).setFromHex(text);", ["uint8-array.set-from-hex"]],
];

apiCases.forEach(([feature, code, modules]) => {
  test(`${feature}: ${code} is gated at ES2026`, () => {
    const ast = parse(code);
    assert.throws(
      () => detectFeatures(code, 16, "module", new Set(), { ast }),
      (error) => error.features.includes(feature),
    );
    assert.deepStrictEqual(
      detectFeatures(code, 17, "module", new Set(), { ast }).unsupportedFeatures,
      [],
    );
    const ignored = detectFeatures(code, 16, "module", new Set([feature]), { ast });
    assert.deepStrictEqual(ignored.unsupportedFeatures, []);
  });

  test(`${feature}: ${code} respects explicit core-js imports`, () => {
    const imports = modules.map((name) => `import 'core-js/modules/es.${name}.js';`).join("\n");
    const polyfilled = `${imports}\n${code}`;
    const result = detectFeatures(polyfilled, 16, "module", new Set(), {
      ast: parse(polyfilled),
      checkForPolyfills: true,
    });
    assert.deepStrictEqual(result.unsupportedFeatures, []);
  });
});

const sourceCases = [
  ["JSON.parse(text, (k, v, c, raw = c.source) => raw);", true],
  ["JSON.parse(text, function (k, v, c, raw = c['source']) { return raw; });", true],
  ["JSON.parse(text, (k, v, c, {source} = c) => source);", true],
  ["JSON.parse(text, (k, v, c, read = () => c.source) => read());", true],
  ["JSON.parse(text, (k, v, c, raw = c.source) => { c = custom; return raw; });", true],
  ["JSON.parse(text, (k, v, c, raw = (c ||= custom)) => c.source);", true],
  ["JSON.parse(text, (k, v, c, raw = (c = custom)) => c.source);", false],
  ["JSON.parse(text, (k, v, c, raw = (c = custom, c.source)) => raw);", false],
  ["JSON.parse(text, (k, v, c, raw = custom.source) => raw);", false],
  ["function f(JSON) { JSON.parse(text, (k, v, c, raw = c.source) => raw); }", false],
  ["JSON.parse(text, (k, v, c) => c.source);", true],
  ["JSON.parse(text, function (k, v, c) { return c['source']; });", true],
  ["JSON.parse(text, (k, v, {source}) => source);", true],
  ["JSON.parse(text, (k, v, {source: raw} = {}) => raw);", true],
  ["JSON.parse(text, (k, v, c) => { const alias = c; return alias.source; });", true],
  ["JSON.parse(text, (k, v, c) => { const {source} = c; return source; });", true],
  ["JSON.parse(text, (k, v, c) => () => c.source);", true],
  ["JSON.parse(text, (k, v, c) => { if (flag) c = custom; return c.source; });", false],
  ["JSON.parse(text, (k, v, c) => { c = custom; return c.source; });", false],
  ["JSON.parse(text, (k, v, c) => ((c) => c.source)(custom));", false],
  ["JSON.parse(text, (k, v, c) => v);", false],
  ["JSON.parse(text, (k, v) => v.source);", false],
  ["JSON.parse(text);", false],
  ["function f(JSON) { JSON.parse(text, (k, v, c) => c.source); }", false],
  ["custom.parse(text, (k, v, c) => c.source);", false],
  ["function f(k, v, c) { return c.source; }", false],
  ['"JSON.parse(text, (k,v,c) => c.source)";', false],
];

sourceCases.forEach(([code, expected]) => {
  test(`JSON source context: ${code}`, () => {
    assert.strictEqual(detectFeaturesFromAST(parse(code), code).JSONParseSource, expected);
  });
});

const byteCases = [
  ["const bytes = new Uint8Array(2); bytes.toHex();", true],
  ["const bytes = Uint8Array.fromHex(text); bytes.toHex();", true],
  ["const bytes = Uint8Array.fromBase64(text); bytes.toHex();", true],
  ["Uint8Array.from(values).toHex();", true],
  ["Uint8Array.of(1).map(fn).slice().subarray().toHex();", true],
  ["new Uint8Array(4).toReversed().toSorted().with(0, 1).toHex();", true],
  ["new Uint8Array(4).fill(1).reverse().sort().copyWithin(0, 0).toHex();", true],
  [
    "let bytes; if (flag) bytes = new Uint8Array(1); else bytes = new Uint8Array(2); bytes.toHex();",
    true,
  ],
  ["const holder = {}; holder.bytes = new Uint8Array(1); holder.bytes.toHex();", true],
  ["const custom = {toHex() {}}; custom.toHex();", false],
  ["new Uint16Array(2).toHex();", false],
  ["new Uint8ClampedArray(2).toHex();", false],
  ["function f(Uint8Array) { new Uint8Array(1).toHex(); }", false],
  ["function f(bytes) { bytes.toHex(); }", false],
  ["let bytes = new Uint8Array(1); bytes = custom; bytes.toHex();", false],
  ["let bytes = new Uint8Array(1); if (flag) bytes = custom; bytes.toHex();", false],
];

byteCases.forEach(([code, expected]) => {
  test(`Uint8Array receiver: ${code}`, () => {
    assert.strictEqual(detectFeaturesFromAST(parse(code), code).Uint8ArrayToHex, expected);
  });
});

test("JSON source support respects browser boundaries", () => {
  const code = "JSON.parse(text, (k, v, c) => c.source);";
  const ast = parse(code);
  const targetBrowsers = [{ name: "safari", version: "18.2" }];
  assert.throws(
    () => detectFeatures(code, 17, "module", new Set(), { ast, targetBrowsers }),
    (error) => error.browserDetails.JSONParseSource[0].requiredVersion === "18.4",
  );
  const supported = [{ name: "safari", version: "18.4" }];
  assert.deepStrictEqual(
    detectFeatures(code, 17, "module", new Set(), { ast, targetBrowsers: supported })
      .unsupportedFeatures,
    [],
  );
});

test("a Map-only shim cannot suppress WeakMap upsert requirements", () => {
  const code =
    "import 'core-js/modules/es.map.get-or-insert'; new WeakMap().getOrInsert(key, value);";
  assert.throws(
    () =>
      detectFeatures(code, 16, "module", new Set(), { ast: parse(code), checkForPolyfills: true }),
    (error) => error.features.includes("MapGetOrInsert"),
  );
});

test("the existing installed-method detector supports a JSON.parse shim", () => {
  const code =
    "JSON.parse = function (text, reviver) { return reviver('', '', {source: text}); }; JSON.parse(text, (k, v, c) => c.source);";
  const result = detectFeatures(code, 16, "module", new Set(), {
    ast: parse(code),
    checkForPolyfills: true,
  });
  assert.deepStrictEqual(result.unsupportedFeatures, []);
});

test("combined Map/WeakMap features require matching MDN support data", () => {
  ["getOrInsert", "getOrInsertComputed"].forEach((method) => {
    const map = bcd.javascript.builtins.Map[method].__compat.support;
    const weakMap = bcd.javascript.builtins.WeakMap[method].__compat.support;
    assert.deepStrictEqual(map, weakMap, `${method} support diverged: split the combined mapping`);
  });
});
