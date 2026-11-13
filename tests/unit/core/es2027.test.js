const { test } = require("node:test");
const assert = require("node:assert/strict");
const acorn = require("acorn");
const detectFeatures = require("../../../lib/core/detectFeatures");
const { detectFeaturesFromAST, detectResourceManagementFromAST } = require("../../../lib/core/ast");
const { FEATURE_CORE_JS_MODULES } = require("../../../lib/constants/polyfills");
const { FEATURE_BROWSER_SUPPORT } = require("../../../lib/constants/browserslist");

const apiCases = [
  ["UsingDeclarations", "{ using resource = acquire(); }"],
  ["AwaitUsingDeclarations", "await using resource = acquire();"],
  ["SymbolDispose", "Symbol.dispose;"],
  ["SymbolAsyncDispose", "Symbol['asyncDispose'];"],
  ["AtomicsPause", "Atomics.pause();"],
  ["IteratorZip", "Iterator.zip([[1], [2]]);"],
  ["IteratorZipKeyed", "Iterator.zipKeyed({a: [1], b: [2]});"],
  ["IteratorChunks", "Iterator.from([1, 2]).chunks(2);"],
  ["IteratorWindows", "Iterator.from([1, 2]).windows(2);"],
  ["IteratorIncludes", "Iterator.from([1, 2]).includes(2);"],
  ["IteratorJoin", "Iterator.from([1, 2]).join(',');"],
  ["DateToTemporalInstant", "new Date().toTemporalInstant();"],
  ["Temporal", "Temporal.Now.instant();"],
  ["DisposableStack", "new DisposableStack();"],
  ["AsyncDisposableStack", "new AsyncDisposableStack();"],
  ["SuppressedError", "new SuppressedError(error, suppressed);"],
];

function parse(code) {
  return acorn.parse(code, { ecmaVersion: 2027, sourceType: "module" });
}

apiCases.forEach(([feature, code]) => {
  test(`${feature} requires ES2027`, () => {
    const ast = parse(code);
    assert.throws(
      () => detectFeatures(code, 17, "module", new Set(), { ast }),
      (error) => error.features.includes(feature),
    );
    const result = detectFeatures(code, 18, "module", new Set(), { ast });
    assert.deepEqual(result.unsupportedFeatures, []);
    const ignored = detectFeatures(code, 17, "module", new Set([feature]), { ast });
    assert.deepEqual(ignored.unsupportedFeatures, []);
  });

  test(`${feature} respects generated browser support`, () => {
    const ast = parse(code);
    const unsupported = [{ name: "ie", version: "11" }];
    assert.throws(
      () => detectFeatures(code, 18, "module", new Set(), { ast, targetBrowsers: unsupported }),
      (error) => error.browserDetails[feature]?.[0].requiredVersion === false,
    );
    const support = FEATURE_BROWSER_SUPPORT[feature];
    const supported = Object.entries(support).find(([, version]) => typeof version === "string");
    assert(supported, `No versioned browser support for ${feature}`);
    const [name, version] = supported;
    const result = detectFeatures(code, 18, "module", new Set(), {
      ast,
      targetBrowsers: [{ name, version }],
    });
    assert.deepEqual(result.unsupportedFeatures, []);
  });

  const module = FEATURE_CORE_JS_MODULES[feature];
  if (!module) return;
  test(`${feature} accepts its explicit core-js module`, () => {
    const polyfilled = `import "core-js/modules/${module}.js";\n${code}`;
    const ast = parse(polyfilled);
    assert.throws(
      () => detectFeatures(polyfilled, 17, "module", new Set(), { ast }),
      (error) => error.features.includes(feature),
    );
    const result = detectFeatures(polyfilled, 17, "module", new Set(), {
      ast,
      checkForPolyfills: true,
    });
    assert.deepEqual(result.unsupportedFeatures, []);
  });
});

const falsePositiveCases = [
  ["IteratorIncludes", "[1, 2].includes(1);"],
  ["IteratorJoin", "[1, 2].join(',');"],
  ["IteratorChunks", "custom.chunks(2);"],
  ["IteratorWindows", "custom.windows(2);"],
  ["IteratorIncludes", "'text'.includes('t');"],
  ["IteratorJoin", "function f(it) { it.join(','); }"],
  ["IteratorZip", "function f(Iterator) { Iterator.zip(values); }"],
  ["IteratorZipKeyed", "function f(Iterator) { Iterator.zipKeyed(values); }"],
  ["IteratorChunks", "function f(Iterator) { Iterator.from(values).chunks(2); }"],
  ["IteratorJoin", "let it = [1].values(); it = custom; it.join(',');"],
  ["SymbolDispose", "function f(Symbol) { return Symbol.dispose; }"],
  ["SymbolAsyncDispose", "const Symbol = custom; Symbol.asyncDispose;"],
  ["SymbolDispose", "custom.dispose;"],
  ["SymbolDispose", "Symbol[key];"],
  ["AtomicsPause", "function f(Atomics) { Atomics.pause(); }"],
  ["Temporal", "function f(Temporal) { Temporal.Now.instant(); }"],
  ["Temporal", "typeof Temporal;"],
  ["Temporal", "if (typeof Temporal !== 'undefined') Temporal.Now.instant();"],
  ["DisposableStack", "function f(DisposableStack) { new DisposableStack(); }"],
  ["DateToTemporalInstant", "custom.toTemporalInstant();"],
  ["DateToTemporalInstant", "function f(Date) { new Date().toTemporalInstant(); }"],
  ["UsingDeclarations", "const text = 'using resource = acquire();';"],
  ["AwaitUsingDeclarations", "const text = 'await using resource = acquire();';"],
];

falsePositiveCases.forEach(([feature, code]) => {
  test(`${feature} excludes ${code}`, () => {
    assert.equal(detectFeaturesFromAST(parse(code), code)[feature], false);
  });
});

const iteratorChains = [
  "Iterator.zip([[1], [2]]).map(fn).includes(1);",
  "Iterator.zipKeyed({a: [1]}).filter(fn).includes(1);",
  "Iterator.from([1]).chunks(1).map(fn).includes(1);",
  "Iterator.from([1]).windows(1).take(1).includes(1);",
  "function* values() { yield 1; } values().includes(1);",
];

iteratorChains.forEach((code) => {
  test(`ES2027 iterator results remain known receivers: ${code}`, () => {
    assert.equal(detectFeaturesFromAST(parse(code), code).IteratorIncludes, true);
  });
});

[
  ["{ using resource = acquire(); }", "UsingDeclarations"],
  ["for (using resource of resources) {}", "UsingDeclarations"],
  ["await using resource = acquire();", "AwaitUsingDeclarations"],
  ["async function f() { await using resource = acquire(); }", "AwaitUsingDeclarations"],
  ["for (await using resource of resources) {}", "AwaitUsingDeclarations"],
].forEach(([code, feature]) => {
  test(`resource declarations are recognized: ${code}`, () => {
    assert.equal(detectFeaturesFromAST(parse(code), code)[feature], true);
    assert.throws(
      () =>
        detectFeatures(code, 17, "module", new Set(), {
          ast: parse(code),
          ignorePolyfillable: "core-js",
          checkForPolyfills: true,
        }),
      (error) => error.features.includes(feature),
    );
  });
});

test("Temporal, Atomics.pause and Date conversion remain outside the core-js allowlist", () => {
  const ignored = detectFeatures.getPolyfillableFeatures("core-js");
  ["Temporal", "AtomicsPause", "DateToTemporalInstant"].forEach((feature) => {
    assert.equal(ignored.has(feature), false);
  });
});

test("browser feature data takes precedence over a conservative edition baseline", () => {
  const code = "Atomics.pause();";
  const ast = parse(code);
  const targetBrowsers = [{ name: "safari", version: "18.4" }];
  const result = detectFeatures(code, 16, "module", new Set(), { ast, targetBrowsers });
  assert.deepEqual(result.unsupportedFeatures, []);
  const mixed = targetBrowsers.concat({ name: "ie", version: "11" });
  assert.throws(
    () => detectFeatures(code, 16, "module", new Set(), { ast, targetBrowsers: mixed }),
    (error) => error.browserDetails.AtomicsPause[0].name === "ie",
  );
});

test("unknown browser support retains the edition fallback", () => {
  const code = "Atomics.pause();";
  const ast = parse(code);
  const targetBrowsers = [{ name: "unknown", version: "1" }];
  assert.throws(
    () => detectFeatures(code, 17, "module", new Set(), { ast, targetBrowsers }),
    (error) => error.features.includes("AtomicsPause"),
  );
});

test("syntax-only traversal finds nested declarations without classifying APIs", () => {
  const code =
    "async function f() { using a = acquire(); await using b = acquire(); Temporal.Now.instant(); }";
  const found = detectResourceManagementFromAST(parse(code));
  assert.deepEqual(found, new Set(["UsingDeclarations", "AwaitUsingDeclarations"]));
  assert.deepEqual(
    detectResourceManagementFromAST(parse("const text = 'using a = acquire();';")),
    new Set(),
  );
});

test("resource bindings shadow ES2027 globals", () => {
  const code = "{ using Temporal = acquire(); Temporal.Now.instant(); }";
  assert.equal(detectFeaturesFromAST(parse(code), code).Temporal, false);
});
