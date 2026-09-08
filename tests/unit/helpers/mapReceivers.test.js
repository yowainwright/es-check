const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const acorn = require("acorn");
const { detectFeaturesFromAST } = require("../../../lib/helpers/astDetector");
const detectFeatures = require("../../../lib/detectFeatures");

const cases = [
  [
    "loop-condition closures observe receivers initialized by updates",
    true,
    (Map, call) =>
      `let cache; for (; inspect(() => cache.${call}(key, value)); cache = new ${Map}()) {}`,
  ],
  [
    "loop-condition closures retain features before receiver invalidation",
    true,
    (Map, call) =>
      `let cache = new ${Map}(); for (; inspect(() => cache.${call}(key, value)); cache = custom) {}`,
  ],
  [
    "loop-condition closures do not infer custom receivers",
    false,
    (Map, call) =>
      `let cache = custom; for (; inspect(() => cache.${call}(key, value)); cache = other) {}`,
  ],
  [
    "cached loop conditions replay static-block initialization",
    true,
    (
      Map,
      call,
    ) => `let cache; for (; class { static { cache = new ${Map}(); } };) { cache = custom; }
      cache.${call}(key, value);`,
  ],
  [
    "cached loop conditions replay static-block invalidation",
    false,
    (
      Map,
      call,
    ) => `let cache = new ${Map}(); for (; class { static { cache = custom; } };) { cache = new ${Map}(); }
      cache.${call}(key, value);`,
  ],
  [
    "callees initialize receivers before arguments",
    true,
    (Map, call) => `let cache; (cache = new ${Map}(), use)(cache.${call}(key, value));`,
  ],
  [
    "callees invalidate receivers before arguments",
    false,
    (Map, call) => `let cache = new ${Map}(); (cache = custom, use)(cache.${call}(key, value));`,
  ],
  [
    "constructors evaluate callees before arguments",
    true,
    (Map, call) => `let cache; new (cache = new ${Map}(), Wrapper)(cache.${call}(key, value));`,
  ],
  [
    "arguments cannot initialize a receiver used by the callee",
    false,
    (Map, call) => `let cache; use[cache.${call}(key, value)](cache = new ${Map}());`,
  ],
  [
    "tags initialize receivers before substitutions",
    true,
    (Map, call) => `let cache; (cache = new ${Map}(), tag)\`\${cache.${call}(key, value)}\`;`,
  ],
  [
    "for conditions restore receivers after body writes",
    true,
    (Map, call) => `let cache; for (; (cache = new ${Map}(), running);) { cache = custom; }
      cache.${call}(key, value);`,
  ],
  [
    "for conditions restore receivers after updates and continues",
    true,
    (Map, call) => `let cache; outer: for (; (cache = new ${Map}(), running); cache = custom) {
      continue outer;
    } cache.${call}(key, value);`,
  ],
  [
    "for conditions invalidate receivers after updates",
    false,
    (
      Map,
      call,
    ) => `let cache = new ${Map}(); for (; (cache = custom, running); cache = new ${Map}()) {}
      cache.${call}(key, value);`,
  ],
  [
    "breaks bypass the next for condition",
    false,
    (Map, call) => `let cache; for (; (cache = new ${Map}(), running);) { cache = custom; break; }
      cache.${call}(key, value);`,
  ],
  [
    "literal computed methods match Map receivers",
    true,
    (Map, call) => `const cache = new ${Map}(); cache["${call}"](key, value);`,
  ],
  [
    "computed identifiers are not method names",
    false,
    (Map, call) => `const cache = new ${Map}(); const ${call} = "get"; cache[${call}](key);`,
  ],
  [
    "dynamic writes invalidate member receivers",
    false,
    (Map, call) => `const holder = {}; holder.items = new ${Map}(); holder[key] = custom;
      holder.items.${call}(key, value);`,
  ],
  [
    "dynamic deletes invalidate member receivers",
    false,
    (Map, call) => `const holder = {}; holder.items = new ${Map}(); delete holder[key];
      holder.items.${call}(key, value);`,
  ],
  [
    "nested dynamic writes invalidate descendant receivers",
    false,
    (Map, call) => `const holder = {}; holder.branch = {}; holder.branch.items = new ${Map}();
      holder[key].items = custom; holder.branch.items.${call}(key, value);`,
  ],
  [
    "dynamic writes do not change the object itself into a non-Map",
    true,
    (Map, call) => `const cache = new ${Map}(); cache[key] = custom; cache.${call}(key, value);`,
  ],
  [
    "dynamic writes preserve unrelated roots",
    true,
    (Map, call) => `const holder = {}; holder.items = new ${Map}(); const other = {};
      other[key] = custom; holder.items.${call}(key, value);`,
  ],
  [
    "static sibling writes preserve receivers",
    true,
    (Map, call) => `const holder = {}; holder.items = new ${Map}(); holder["other"] = custom;
      holder.items.${call}(key, value);`,
  ],
  [
    "shadowed dynamic writes preserve outer receivers",
    true,
    (Map, call) => `const holder = {}; holder.items = new ${Map}();
      { const holder = {}; holder[key] = custom; } holder.items.${call}(key, value);`,
  ],
  [
    "catch defaults cannot definitely initialize receivers",
    false,
    (Map, call) => `let cache; try { throw input; } catch ({item = (cache = new ${Map}())}) {}
      cache.${call}(key, value);`,
  ],
  [
    "catch defaults can invalidate receivers",
    false,
    (
      Map,
      call,
    ) => `let cache = new ${Map}(); try { throw input; } catch ({item = (cache = custom)}) {}
      cache.${call}(key, value);`,
  ],
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
    "returning branches do not erase continuing receiver initialization",
    true,
    (Map, call) => `
    function get(stop) {
      let cache; if (stop) return; else cache = new ${Map}();
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "throwing branches do not erase continuing receiver initialization",
    true,
    (Map, call) => `
    function get(stop) {
      let cache; if (stop) throw new Error(); else cache = new ${Map}();
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "returning alternate branches do not erase continuing receiver initialization",
    true,
    (Map, call) => `
    function get(enabled) {
      let cache; if (enabled) cache = new ${Map}(); else return;
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "throwing alternate branches do not erase continuing receiver initialization",
    true,
    (Map, call) => `
    function get(enabled) {
      let cache; if (enabled) cache = new ${Map}(); else throw new Error();
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "returning writes do not invalidate the implicit continuing branch",
    true,
    (Map, call) => `
    function get(stop) {
      let cache = new ${Map}(); if (stop) { cache = custom; return; }
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "nested unconditional exits do not erase the continuing branch",
    true,
    (Map, call) => `
    function get(stop, fail) {
      let cache;
      if (stop) { if (fail) throw new Error(); else { return; } }
      else { cache = new ${Map}(); }
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "conditional returns retain reachable non-Map branches",
    false,
    (Map, call) => `
    function get(enabled, stop) {
      let cache;
      if (enabled) { cache = custom; if (stop) return; }
      else cache = new ${Map}();
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "nested function returns do not terminate the containing branch",
    false,
    (Map, call) => `
    function get(enabled) {
      let cache;
      if (enabled) { cache = custom; function deferred() { return; } }
      else cache = new ${Map}();
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "upserts in returning branches are still detected",
    true,
    (Map, call) => `
    function get(enabled) {
      if (enabled) { const cache = new ${Map}(); return cache.${call}(key, value); }
    }
  `,
  ],
  [
    "upserts in throwing branches are still detected",
    true,
    (Map, call) => `
    function get(enabled) {
      if (enabled) { const cache = new ${Map}(); throw cache.${call}(key, value); }
    }
  `,
  ],
  [
    "two exiting branches preserve receiver facts for syntactic checks",
    true,
    (Map, call) => `
    function get(stop) {
      const cache = new ${Map}(); if (stop) return; else throw new Error();
      cache.${call}(key, value);
    }
  `,
  ],
  [
    "caught throws retain paths that reach code after the catch",
    false,
    (Map, call) => `
    let cache;
    try { if (stop) throw new Error(); else cache = new ${Map}(); } catch {}
    cache.${call}(key, value);
  `,
  ],
  [
    "break branches retain paths that reach code after the loop",
    false,
    (Map, call) => `
    let cache;
    do { if (stop) break; else cache = new ${Map}(); } while (false);
    cache.${call}(key, value);
  `,
  ],
  [
    "finalizers retain receiver states from returning branches",
    false,
    (Map, call) => `
    function get(stop) {
      let cache;
      try { if (stop) return; else cache = new ${Map}(); }
      finally { cache.${call}(key, value); }
    }
  `,
  ],
  [
    "switch breaks retain paths that reach code after the switch",
    false,
    (Map, call) => `
    let cache;
    switch (value) { default: if (stop) break; else cache = new ${Map}(); }
    cache.${call}(key, value);
  `,
  ],
  [
    "labeled breaks retain paths that reach code after the label",
    false,
    (Map, call) => `
    let cache;
    done: { if (stop) break done; else cache = new ${Map}(); }
    cache.${call}(key, value);
  `,
  ],
  [
    "nested functions analyze their own exits inside enclosing try blocks",
    true,
    (Map, call) => `
    try {
      function get(stop) {
        let cache; if (stop) return; else cache = new ${Map}();
        return cache.${call}(key, value);
      }
    } catch {}
  `,
  ],
  [
    "exit joins do not affect subsequent branches outside their body",
    true,
    (Map, call) => `
    function get(stop) {
      try {} finally {}
      let cache; if (stop) return; else cache = new ${Map}();
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "continue branches retain paths that reach code after the loop",
    false,
    (Map, call) => `
    let cache;
    do { if (stop) continue; else cache = new ${Map}(); } while (false);
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
  [
    "returning switch cases do not erase the default receiver",
    true,
    (Map, call) => `
    function get(stop) {
      let cache;
      switch (stop) { case true: return; default: cache = new ${Map}(); }
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "caught throws can establish the continuing receiver",
    true,
    (Map, call) => `
    let cache;
    try { if (stop) throw 1; else cache = new ${Map}(); }
    catch { cache = new ${Map}(); }
    cache.${call}(key, value);
  `,
  ],
  [
    "returning catches do not erase successful try receivers",
    true,
    (Map, call) => `
    function get() {
      let cache;
      try { cache = new ${Map}(); } catch { return; }
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "catch receivers include failures before initialization completes",
    false,
    (Map, call) => `
    let cache;
    try { cache = new ${Map}(); } catch {}
    cache.${call}(key, value);
  `,
  ],
  [
    "finalizers preserve continuing initialization after early return",
    true,
    (Map, call) => `
    function get(stop) {
      let cache;
      try { if (stop) return; else cache = new ${Map}(); } finally {}
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "conditional finalizer writes preserve an already initialized continuing receiver",
    true,
    (Map, call) => `
    function get(stop, reset) {
      let cache;
      try { if (stop) return; else cache = new ${Map}(); }
      finally { if (reset) cache = new ${Map}(); }
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "finalizer writes invalidate continuing receivers",
    false,
    (Map, call) => `
    function get(stop) {
      let cache;
      try { if (stop) return; else cache = new ${Map}(); }
      finally { cache = custom; }
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "finalizer breaks override returns and reach the enclosing label exit",
    false,
    (Map, call) => `
    function get(stop) {
      let cache;
      done: {
        try { if (stop) return; else cache = new ${Map}(); }
        finally { break done; }
      }
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "nested finalizers retain thrown receiver states for an outer catch",
    true,
    (Map, call) => `
    let cache;
    try { try { throw 1; } finally { cache = new ${Map}(); } }
    catch { cache = new ${Map}(); }
    cache.${call}(key, value);
  `,
  ],
  [
    "constructor finalizer writes apply to early returns",
    true,
    (Map, call) => `
    class Cache {
      constructor(stop) { try { if (stop) return; } finally { this.items = new ${Map}(); } }
      get() { return this.items.${call}(key, value); }
    }
  `,
  ],
  [
    "break state is not overwritten by later loop statements",
    false,
    (Map, call) => `
    let cache;
    do { if (stop) break; cache = new ${Map}(); } while (false);
    cache.${call}(key, value);
  `,
  ],
  [
    "labeled continues still run loop updates",
    false,
    (Map, call) => `
    let cache = new ${Map}();
    outer: for (let i = 0; i < 1; i++, cache = custom) { continue outer; }
    cache.${call}(key, value);
  `,
  ],
  [
    "returning inner labels do not erase a continuing outer branch",
    true,
    (Map, call) => `
    function get(stop) {
      let cache;
      if (stop) { done: { return; } } else cache = new ${Map}();
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "return expressions can throw before returning",
    false,
    (Map, call) => `
    function get() {
      let cache = new ${Map}();
      try { return 1n + 1; } catch { cache = custom; }
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "unresolved return values can reach a catch",
    false,
    (Map, call) => `
    function get() {
      let cache = new ${Map}();
      try { return missingValue; } catch { cache = custom; }
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "do/while initializes a previously unknown continuing receiver",
    true,
    (Map, call) => `
    function get(stop) {
      let cache;
      do { if (stop) return; else cache = new ${Map}(); } while (false);
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "labels initialize a previously unknown continuing receiver",
    true,
    (Map, call) => `
    function get(stop) {
      let cache;
      done: { if (stop) throw 1; else cache = new ${Map}(); }
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "finalizer returns do not erase the continuing receiver",
    true,
    (Map, call) => `
    function get(stop) {
      let cache = new ${Map}();
      try {} finally { if (stop) { cache = custom; return; } }
      return cache.${call}(key, value);
    }
  `,
  ],
  [
    "multiple labels route continues to the loop update",
    false,
    (Map, call) => `
    let cache = new ${Map}();
    outer: inner: for (let i = 0; i < 1; i++, cache = custom) { continue outer; }
    cache.${call}(key, value);
  `,
  ],
];

const exitContainers = [
  ["do/while", (body) => `do { ${body} } while (false);`],
  ["while", (body) => `while (enabled) { ${body} enabled = false; }`],
  ["for", (body) => `for (let i = 0; i < count; i++) { ${body} }`],
  ["for/in", (body) => `for (const name in values) { ${body} }`],
  ["for/of", (body) => `for (const item of values) { ${body} }`],
  ["switch", (body) => `switch (value) { default: ${body} }`],
  ["label", (body) => `done: { ${body} }`],
  ["try/finally", (body) => `try { ${body} } finally {}`],
  ["try/catch", (body) => `try { ${body} } catch (error) { throw error; }`],
];

const loopConditions = [
  ["arrow", (body) => `(() => { ${body} return running; })()`, (node) => node.callee.body.body[0]],
  [
    "function",
    (body) => `(function () { ${body} return running; })()`,
    (node) => node.callee.body.body[0],
  ],
  ["class", (body) => `class { static { ${body} } }`, (node) => node.body.body[0].body[0]],
];

const conditionalLoops = [
  ["for", (condition) => `for (; ${condition};) {}`],
  ["while", (condition) => `while (${condition}) {}`],
  ["do/while", (condition) => `do {} while (${condition});`],
];

function checkLoopTestVisits(code, depth, descend) {
  const ast = acorn.parse(code, { ecmaVersion: "latest" });
  let leaf = ast.body[0];
  Array.from({ length: depth }).forEach(() => {
    leaf = descend(leaf.test);
  });
  let visits = 0;
  Object.defineProperty(leaf, "type", {
    get() {
      visits += 1;
      assert.ok(visits < 1000, `Read the innermost condition node ${visits} times`);
      return "ExpressionStatement";
    },
  });
  const features = detectFeaturesFromAST(ast);
  assert.equal(features.ArrayFromAsync, true);
  assert.ok(visits > 0);
}

describe("Map receiver flow regressions", () => {
  conditionalLoops.forEach(([loopName, wrapLoop]) => {
    loopConditions.forEach(([conditionName, wrapCondition, descend]) => {
      [4, 8, 12].forEach((depth) => {
        it(`bounds ${depth} nested ${loopName} conditions containing ${conditionName} bodies`, () => {
          const code = Array.from({ length: depth }).reduce(
            (body) => wrapLoop(wrapCondition(body)),
            "Array.fromAsync([]);",
          );
          checkLoopTestVisits(code, depth, descend);
        });
      });
    });
  });

  it("does not replay nested finalizers for identical receiver states", () => {
    const depth = 10;
    const body = Array.from({ length: depth }).reduce(
      (inner) => `try { if (stop) return; } finally { ${inner} }`,
      "cache = new Map();",
    );
    const ast = acorn.parse(`function get(stop) { let cache; ${body} }`, { ecmaVersion: "latest" });
    let leaf = ast.body[0].body.body[1];
    while (leaf.type === "TryStatement") leaf = leaf.finalizer.body[0];
    let visits = 0;
    Object.defineProperty(leaf, "type", {
      get() {
        visits += 1;
        return "ExpressionStatement";
      },
    });
    detectFeaturesFromAST(ast);
    assert.ok(visits < 100, `Visited the innermost finalizer ${visits} times`);
  });

  it("reuses receiver analysis across distinct finalizer completion paths", () => {
    const body = Array.from({ length: 10 }).reduce(
      (inner) => `try { if (stop) { cache = custom; return; } else cache = new Map(); }
        finally { ${inner} }`,
      "cache = new Map();",
    );
    const ast = acorn.parse(`function get(stop) { let cache; ${body} }`, { ecmaVersion: "latest" });
    let leaf = ast.body[0].body.body[1];
    while (leaf.type === "TryStatement") leaf = leaf.finalizer.body[0];
    let visits = 0;
    Object.defineProperty(leaf, "type", {
      get() {
        visits += 1;
        return "ExpressionStatement";
      },
    });
    detectFeaturesFromAST(ast);
    assert.ok(visits < 300, `Visited the innermost finalizer ${visits} times`);
  });

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
        exitContainers.forEach(([name, wrap]) => {
          ["return;", "throw 1;"].forEach((exit) => {
            [true, false].forEach((exitFirst) => {
              it(`${name} preserves receivers after ${exit} in branch ${exitFirst}`, () => {
                const exiting = `{ cache = custom; ${exit} }`;
                const continuing = `cache = new ${constructor}();`;
                const consequent = exitFirst ? exiting : continuing;
                const alternate = exitFirst ? continuing : exiting;
                const body = wrap(`if (stop) ${consequent} else ${alternate}`);
                const code = `function get(stop) {
                  let cache = new ${constructor}(); ${body}
                  return cache.${method}(key, value);
                }`;
                const ast = acorn.parse(code, { ecmaVersion: "latest" });
                assert.equal(detectFeaturesFromAST(ast)[feature], true, code);
                assert.throws(() => detectFeatures(code, 16, "script", new Set(), { ast }), {
                  features: [feature],
                });
                assert.deepEqual(
                  detectFeatures(code, 17, "script", new Set(), { ast }).unsupportedFeatures,
                  [],
                );
              });
            });
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

  ["return;", "throw new Error();"].forEach((exit) => {
    it(`rejects an upsert after ${exit} against ES2025 and accepts ES2026`, () => {
      const code = `function get(stop) {
        let cache; if (stop) { ${exit} } else cache = new Map();
        return cache.getOrInsert(key, value);
      }`;
      const ast = acorn.parse(code, { ecmaVersion: "latest" });
      assert.throws(() => detectFeatures(code, 16, "script", new Set(), { ast }), {
        features: ["MapGetOrInsert"],
      });
      const result = detectFeatures(code, 17, "script", new Set(), { ast });
      assert.deepEqual(result.unsupportedFeatures, []);
      assert.equal(result.foundFeatures.MapGetOrInsert, true);
    });
  });
});
