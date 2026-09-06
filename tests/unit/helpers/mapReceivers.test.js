const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const acorn = require("acorn");
const { detectFeaturesFromAST } = require("../../../lib/helpers/astDetector");
const detectFeatures = require("../../../lib/detectFeatures");

const cases = [
  [
    "assignment RHS runs before the write",
    true,
    (Map, call) => `
    let cache = new ${Map}(); cache = cache.${call}(key, value);
  `,
  ],
  [
    "uncalled functions cannot invalidate outer receivers",
    true,
    (Map, call) => `
    let cache = new ${Map}(); function reset() { cache = custom; }
    cache.${call}(key, value);
  `,
  ],
  [
    "uncalled functions cannot establish outer receivers",
    false,
    (Map, call) => `
    let cache = custom; function reset() { cache = new ${Map}(); }
    cache.${call}(key, value);
  `,
  ],
  [
    "constructor parameters shadow built-ins",
    false,
    (Map, call) => `
    class Cache {
      constructor(${Map}) { this.items = new ${Map}(); }
      get() { return this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "constructor local bindings shadow built-ins",
    false,
    (Map, call) => `
    class Cache {
      constructor() { const ${Map} = Custom; this.items = new ${Map}(); }
      get() { return this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "named class expressions shadow built-ins",
    false,
    (Map, call) => `
    const Cache = class ${Map} {
      get() { const cache = new ${Map}(); return cache.${call}(key, value); }
      ${call}() {}
    };
  `,
  ],
  [
    "constructor facts reach methods before the constructor",
    true,
    (Map, call) => `
    class Cache {
      get() { return this.items.${call}(key, value); }
      constructor() { this.items = new ${Map}(); }
    }
  `,
  ],
  [
    "static fields reach static methods regardless of order",
    true,
    (Map, call) => `
    class Cache {
      static get() { return this.items.${call}(key, value); }
      static items = new ${Map}();
    }
  `,
  ],
  [
    "instance facts do not reach static methods",
    false,
    (Map, call) => `
    class Cache {
      items = new ${Map}(); static items = custom;
      static get() { return this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "static facts do not reach instance methods",
    false,
    (Map, call) => `
    class Cache {
      static items = new ${Map}();
      get() { return this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "static blocks update static receiver facts",
    false,
    (Map, call) => `
    class Cache {
      static items = new ${Map}(); static { this.items = custom; }
      static get() { return this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "conditional constructor writes invalidate method receivers",
    false,
    (Map, call) => `
    class Cache {
      constructor(enabled) {
        this.items = new ${Map}(); if (enabled) { this.items = custom; }
      }
      get() { return this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "conditional constructor initialization is not definite",
    false,
    (Map, call) => `
    class Cache {
      constructor(enabled) { if (enabled) { this.items = new ${Map}(); } }
      get() { return this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "constructor writes after return cannot establish facts",
    false,
    (Map, call) => `
    class Cache {
      constructor() { this.items = custom; return; this.items = new ${Map}(); }
      get() { return this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "constructor early return paths contribute receiver state",
    false,
    (Map, call) => `
    class Cache {
      constructor(enabled) {
        this.items = custom; if (enabled) return; this.items = new ${Map}();
      }
      get() { return this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "field initializers run before constructor writes",
    true,
    (Map, call) => `
    class Cache {
      items = new ${Map}(); value = this.items.${call}(key, value);
      constructor() { this.items = custom; }
    }
  `,
  ],
  [
    "fields run before constructors regardless of source order",
    true,
    (Map, call) => `
    class Cache {
      constructor() { this.items.${call}(key, value); }
      items = new ${Map}();
    }
  `,
  ],
  [
    "uninitialized duplicate fields clear earlier facts",
    false,
    (Map, call) => `
    class Cache {
      items = new ${Map}(); items;
      get() { return this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "nested classes do not inherit outer this facts",
    false,
    (Map, call) => `
    class Outer {
      items = new ${Map}();
      make() { return class Inner { get() { return this.items.${call}(key, value); } }; }
    }
  `,
  ],
  [
    "ordinary functions do not inherit outer this facts",
    false,
    (Map, call) => `
    class Cache {
      items = new ${Map}();
      make() { return function get() { return this.items.${call}(key, value); }; }
    }
  `,
  ],
  [
    "arrow functions retain lexical this facts",
    true,
    (Map, call) => `
    class Cache {
      items = new ${Map}();
      make() { return () => this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "method writes do not run while visiting sibling methods",
    true,
    (Map, call) => `
    class Cache {
      items = new ${Map}(); reset() { this.items = custom; }
      get() { return this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "nested conditional writes reach the declaring scope",
    false,
    (Map, call) => `
    let cache = new ${Map}(); if (a) { if (b) { cache = custom; } }
    cache.${call}(key, value);
  `,
  ],
  [
    "block boundaries preserve conditional invalidations",
    false,
    (Map, call) => `
    let cache = new ${Map}(); { if (a) { cache = custom; } }
    cache.${call}(key, value);
  `,
  ],
  [
    "nested blocks update branch-local receivers",
    false,
    (Map, call) => `
    if (a) { let cache = new ${Map}(); { cache = custom; } cache.${call}(key, value); }
  `,
  ],
  [
    "nested shadowed writes preserve the outer receiver",
    true,
    (Map, call) => `
    const cache = new ${Map}();
    if (a) { let cache = new ${Map}(); if (b) { cache = custom; } }
    cache.${call}(key, value);
  `,
  ],
  [
    "replacing roots invalidates member receivers",
    false,
    (Map, call) => `
    let holder = {}; holder.items = new ${Map}(); holder = { items: custom };
    holder.items.${call}(key, value);
  `,
  ],
  [
    "replacing intermediate members invalidates descendants",
    false,
    (Map, call) => `
    const holder = { state: {} }; holder.state.items = new ${Map}();
    holder.state = { items: custom }; holder.state.items.${call}(key, value);
  `,
  ],
  [
    "member receivers can be established after replacing roots",
    true,
    (Map, call) => `
    let holder = {}; holder.items = new ${Map}(); holder = {};
    holder.items = new ${Map}(); holder.items.${call}(key, value);
  `,
  ],
  [
    "member invalidation does not match sibling prefixes",
    true,
    (Map, call) => `
    const holder = {}; holder.items = new ${Map}(); holder.item = custom;
    holder.items.${call}(key, value);
  `,
  ],
  [
    "destructuring assignments invalidate receivers",
    false,
    (Map, call) => `
    let cache = new ${Map}(); [cache] = [custom]; cache.${call}(key, value);
  `,
  ],
  [
    "object destructuring invalidates member receivers",
    false,
    (Map, call) => `
    const holder = {}; holder.items = new ${Map}();
    ({ cache: holder.items } = custom); holder.items.${call}(key, value);
  `,
  ],
  [
    "repeated var initializers invalidate receivers",
    false,
    (Map, call) => `
    var cache = new ${Map}(); var cache = custom; cache.${call}(key, value);
  `,
  ],
  [
    "var redeclarations without initializers preserve receivers",
    true,
    (Map, call) => `
    var cache = new ${Map}(); var cache; cache.${call}(key, value);
  `,
  ],
  [
    "for-of overwrites an existing receiver",
    false,
    (Map, call) => `
    let cache = new ${Map}(); for (cache of values) { cache.${call}(key, value); }
  `,
  ],
  [
    "for updates run after the body",
    true,
    (Map, call) => `
    let cache = new ${Map}();
    for (let i = 0; i < 1; cache = custom) { cache.${call}(key, value); i++; }
  `,
  ],
  [
    "for initialization runs even when the loop does not",
    true,
    (Map, call) => `
    let cache; for (cache = new ${Map}(); false;) {} cache.${call}(key, value);
  `,
  ],
  [
    "while bodies do not establish definite outer receivers",
    false,
    (Map, call) => `
    let cache = custom; while (enabled) { cache = new ${Map}(); }
    cache.${call}(key, value);
  `,
  ],
  [
    "nullish branches do not establish definite receivers",
    false,
    (Map, call) => `
    let cache = custom; enabled ?? (cache = new ${Map}()); cache.${call}(key, value);
  `,
  ],
  [
    "switch cases do not inherit state across breaks",
    false,
    (Map, call) => `
    let cache = custom;
    switch (value) {
      case 1: cache = new ${Map}(); break;
      case 2: cache.${call}(key, value);
    }
  `,
  ],
  [
    "switch cases retain their own assignments",
    true,
    (Map, call) => `
    let cache = custom;
    switch (value) { case 1: cache = new ${Map}(); cache.${call}(key, value); break; }
  `,
  ],
  [
    "default-only switches preserve definite assignments",
    true,
    (Map, call) => `
    let cache; switch (value) { default: cache = new ${Map}(); }
    cache.${call}(key, value);
  `,
  ],
  [
    "logical-or assignment preserves a known Map",
    true,
    (Map, call) => `
    let cache = new ${Map}(); cache ||= custom; cache.${call}(key, value);
  `,
  ],
  [
    "nullish assignment preserves a known Map",
    true,
    (Map, call) => `
    let cache = new ${Map}(); cache ??= custom; cache.${call}(key, value);
  `,
  ],
  [
    "logical-and assignment overwrites a known Map",
    false,
    (Map, call) => `
    let cache = new ${Map}(); cache &&= custom; cache.${call}(key, value);
  `,
  ],
  [
    "logical-and assignment can replace a Map with a Map",
    true,
    (Map, call) => `
    let cache = new ${Map}(); cache &&= new ${Map}(); cache.${call}(key, value);
  `,
  ],
  [
    "conditional logical assignment does not establish a Map",
    false,
    (Map, call) => `
    let cache = custom; cache ||= new ${Map}(); cache.${call}(key, value);
  `,
  ],
  [
    "arrow fields see later field initialization",
    true,
    (Map, call) => `
    class Cache {
      get = () => this.items.${call}(key, value);
      items = new ${Map}();
    }
  `,
  ],
  [
    "arrow fields see constructor receiver initialization",
    true,
    (Map, call) => `
    class Cache {
      get = () => this.items.${call}(key, value);
      constructor() { this.items = new ${Map}(); }
    }
  `,
  ],
  [
    "fallthrough states are not treated as switch exits",
    true,
    (Map, call) => `
    let cache = new ${Map}();
    switch (value) {
      case 1: cache = custom;
      case 2: cache = new ${Map}(); break;
    }
    cache.${call}(key, value);
  `,
  ],
  [
    "literal bracket writes invalidate dot receivers",
    false,
    (Map, call) => `
    const holder = {}; holder.items = new ${Map}(); holder["items"] = custom;
    holder.items.${call}(key, value);
  `,
  ],
  [
    "literal property names do not collide with member paths",
    false,
    (Map, call) => `
    const holder = { a: {} }; holder["a.b"] = new ${Map}();
    holder.a.b.${call}(key, value);
  `,
  ],
  [
    "private and public fields have separate receiver facts",
    false,
    (Map, call) => `
    class Cache {
      #items = new ${Map}(); items = custom;
      get() { return this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "both branches can establish the same receiver type",
    true,
    (Map, call) => `
    let cache; if (enabled) cache = new ${Map}(); else cache = new ${Map}();
    cache.${call}(key, value);
  `,
  ],
  [
    "for updates execute after continue",
    false,
    (Map, call) => `
    let cache = new ${Map}();
    for (let i = 0; i < 1; i++, cache = custom) { continue; }
    cache.${call}(key, value);
  `,
  ],
  [
    "for updates do not execute after break",
    true,
    (Map, call) => `
    let cache = new ${Map}();
    for (let i = 0; i < 1; cache = custom) { break; }
    cache.${call}(key, value);
  `,
  ],
];

describe("Map receiver flow regressions", () => {
  ["Map", "WeakMap"].forEach((constructor) => {
    ["getOrInsert", "getOrInsertComputed"].forEach((method) => {
      const feature = method === "getOrInsert" ? "MapGetOrInsert" : "MapGetOrInsertComputed";
      describe(`${constructor}.${method}`, () => {
        cases.forEach(([name, expected, source]) => {
          it(name, () => {
            const code = source(constructor, method);
            const ast = acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" });
            assert.equal(detectFeaturesFromAST(ast)[feature], expected, code);
          });
        });
      });
    });
  });

  it("rejects the RHS upsert against ES2025 through the feature checker", () => {
    const code = "let map = new Map(); map = map.getOrInsert(key, value);";
    const ast = acorn.parse(code, { ecmaVersion: "latest" });
    assert.throws(() => detectFeatures(code, 16, "script", new Set(), { ast }), {
      features: ["MapGetOrInsert"],
    });
  });
});
