const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { runChecks, loadConfig } = require("../../lib/index.js");

const testDir = path.join(__dirname, "test-files-node-api");

if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

function cleanupTestDir() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

describe("Node API Tests", () => {
  [
    ["JSON.parse(text, (k, v, context, raw = context.source) => raw);", "JSONParseSource"],
    ["JSON.parse(text, (k, v, context) => context.source);", "JSONParseSource"],
    ["const bytes = new Uint8Array(1); bytes.toHex();", "Uint8ArrayToHex"],
  ].forEach(([code, feature], index) => {
    test(`runChecks - enforces reconciled ES2026 behavior (case ${index})`, async () => {
      const file = path.join(testDir, `es2026-audit-${index}.js`);
      fs.writeFileSync(file, code);
      const config = { files: [file], checkFeatures: true, cache: false };
      const rejected = await runChecks([Object.assign({}, config, { ecmaVersion: "es2025" })]);
      assert.strictEqual(rejected.success, false);
      assert.ok(rejected.errors[0].err.features.includes(feature));
      const accepted = await runChecks([Object.assign({}, config, { ecmaVersion: "es2026" })]);
      assert.strictEqual(accepted.success, true);
    });
  });

  test("runChecks - accepts custom hex methods before ES2026", async () => {
    const file = path.join(testDir, "custom-hex-method.js");
    fs.writeFileSync(file, "const custom = {toHex() { return ''; }}; custom.toHex();");
    const result = await runChecks([
      { ecmaVersion: "es2025", files: [file], checkFeatures: true, cache: false },
    ]);
    assert.strictEqual(result.success, true);
  });

  const iteratorCases = [
    [
      "[1, 2].sort().reverse().fill(0).copyWithin(0, 1).splice(0, 1).values().map(fn);",
      "IteratorMap",
    ],
    ["Array(3).values().map(fn);", "IteratorMap"],
    ["String(value).matchAll(pattern).map(fn);", "IteratorMap"],
    ["let it = ''; it ||= [].values(); it.map(fn);", "IteratorMap"],
    ["Iterator.from([]);", "IteratorFrom"],
    ["const it = [1].values(); it.map(fn);", "IteratorMap"],
    ["function* gen() { yield 1; } gen().take(1);", "IteratorTake"],
    ["new Map().values().filter(fn);", "IteratorFilter"],
  ];

  iteratorCases.forEach(([code, feature], index) => {
    test(`runChecks - enforces ES2025 iterator helpers (case ${index})`, async () => {
      const file = path.join(testDir, `es2025-iterator-${index}.js`);
      fs.writeFileSync(file, code);
      const config = { files: [file], checkFeatures: true, cache: false };
      const rejected = await runChecks([Object.assign({}, config, { ecmaVersion: "es2024" })]);
      assert.strictEqual(rejected.success, false);
      assert.ok(rejected.errors[0].err.features.includes(feature));
      const accepted = await runChecks([Object.assign({}, config, { ecmaVersion: "es2025" })]);
      assert.strictEqual(accepted.success, true);
    });
  });

  const syntaxCases = [
    ['import data from "x" with {type: "json"};', ["ImportAttributes"]],
    ['import "x" with {};', ["ImportAttributes"]],
    ['export * from "x" with {};', ["ImportAttributes"]],
    ['import("x", options);', ["ImportOptions"]],
    ['import("x",);', ["ImportOptions"]],
    ['import("x", {with: {type: "json"}});', ["ImportAttributes", "ImportOptions"]],
    ["/(?i:pattern)/;", ["RegExpModifiers"]],
  ];

  syntaxCases.forEach(([code, features], index) => {
    test(`runChecks - enforces ES2025 syntax (case ${index})`, async () => {
      const file = path.join(testDir, `es2025-syntax-${index}.js`);
      fs.writeFileSync(file, code);
      const config = { files: [file], module: true, checkFeatures: true, cache: false };
      const rejected = await runChecks([Object.assign({}, config, { ecmaVersion: "es2024" })]);
      assert.strictEqual(rejected.success, false);
      assert.deepStrictEqual(rejected.errors[0].err.features, features);
      const accepted = await runChecks([Object.assign({}, config, { ecmaVersion: "es2025" })]);
      assert.strictEqual(accepted.success, true);
      assert.deepStrictEqual(accepted.errors, []);
    });

    test(`runChecks - preserves syntax ignores and polyfill rules (case ${index})`, async () => {
      const file = path.join(testDir, `es2025-syntax-options-${index}.js`);
      fs.writeFileSync(file, code);
      const config = {
        ecmaVersion: "es2024",
        files: [file],
        module: true,
        checkFeatures: true,
        checkForPolyfills: true,
        ignorePolyfillable: "core-js",
        cache: false,
      };
      const rejected = await runChecks([config]);
      assert.strictEqual(rejected.success, false);
      assert.deepStrictEqual(rejected.errors[0].err.features, features);
      const allowList = features.join(",");
      const accepted = await runChecks([Object.assign({}, config, { allowList })]);
      assert.strictEqual(accepted.success, true);
    });
  });

  const samsungCases = [
    ["async function f() {}", "5", "6.2-6.4"],
    ["const copy = {...source};", "7.2-7.4", "8.2"],
    ["try {} catch {}", "8.2", "9.2"],
  ];

  samsungCases.forEach(([code, before, supported], index) => {
    test(`runChecks - respects Samsung syntax boundaries (case ${index})`, async () => {
      const file = path.join(testDir, `samsung-syntax-${index}.js`);
      fs.writeFileSync(file, code);
      const config = { ecmaVersion: "checkBrowser", files: [file], cache: false };
      const rejectedConfig = Object.assign({}, config, { browserslistQuery: `samsung ${before}` });
      const acceptedConfig = Object.assign({}, config, {
        browserslistQuery: `samsung ${supported}`,
      });
      const rejected = await runChecks([rejectedConfig]);
      const accepted = await runChecks([acceptedConfig]);
      assert.strictEqual(rejected.success, false);
      assert.strictEqual(accepted.success, true);
    });
  });

  ["last 1 and_chr version", "last 1 and_ff version", "samsung 24", "op_mob 80"].forEach(
    (browserslistQuery) => {
      test(`runChecks - accepts ES6 syntax for ${browserslistQuery}`, async () => {
        const file = path.join(__dirname, "../fixtures/es6.js");
        const result = await runChecks([
          { ecmaVersion: "checkBrowser", files: [file], browserslistQuery, cache: false },
        ]);
        assert.strictEqual(result.success, true);
        assert.deepStrictEqual(result.errors, []);
      });
    },
  );

  const featureCases = [
    ["ObjectSpread", 9, "const copy = {...source};"],
    ["AsyncIteration", 9, "async function consume() { for await (const item of source) {} }"],
    ["RegExpUnicodeSetFlag", 15, "/[a&&b]/v;"],
    ["ArrayFromAsync", 17, "try {} catch ({items = Array.fromAsync([])}) {}"],
    ["ArrayFromAsync", 17, "tag`${Array.fromAsync([])}`;"],
    ["ArrayFromAsync", 17, 'Array["fromAsync"]([]);'],
    ["MapGetOrInsert", 17, "let cache; (cache = new Map(), use)(cache.getOrInsert(key, value));"],
    [
      "MapGetOrInsert",
      17,
      "let cache; for (; (cache = new Map(), running); cache = custom) {} cache.getOrInsert(key, value);",
    ],
  ];

  featureCases.forEach(([feature, minVersion, code], index) => {
    test(`runChecks - enforces the version of ${feature} (case ${index})`, async () => {
      const file = path.join(testDir, `feature-regression-${index}.js`);
      fs.writeFileSync(file, code);
      const config = { files: [file], checkFeatures: true, cache: false };
      const rejected = await runChecks([{ ...config, ecmaVersion: `es${minVersion - 1}` }]);
      assert.strictEqual(rejected.success, false);
      assert.strictEqual(rejected.errors.length, 1);
      assert.deepStrictEqual(rejected.errors[0].err.features, [feature]);
      const accepted = await runChecks([{ ...config, ecmaVersion: `es${minVersion}` }]);
      assert.strictEqual(accepted.success, true);
      assert.deepStrictEqual(accepted.errors, []);
    });
  });

  test("runChecks - accepts custom computed methods and invalidated member receivers", async () => {
    const file = path.join(testDir, "custom-receiver-regression.js");
    fs.writeFileSync(
      file,
      'const fromAsync = "from"; Array[fromAsync]([]); const holder = {}; ' +
        "holder.items = new Map(); holder[key] = custom; holder.items.getOrInsert(key, value);",
    );
    const config = { ecmaVersion: "es2025", files: [file], checkFeatures: true, cache: false };
    const result = await runChecks([config]);
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.errors, []);
  });

  test("runChecks - should handle missing files gracefully", async () => {
    const config = [
      {
        ecmaVersion: "es5",
        files: [path.join(testDir, "nonexistent.js")],
      },
    ];

    const result = await runChecks(config);
    assert.strictEqual(result.success, false);
    assert(result.errors.length > 0);
  });

  test("runChecks - should work with options object but no logger", async () => {
    const es5File = path.join(testDir, "es5.js");
    fs.writeFileSync(es5File, "var x = 5;");

    const config = [
      {
        ecmaVersion: "es5",
        files: [es5File],
      },
    ];

    const result = await runChecks(config, {});
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.errors, []);
  });

  test("runChecks - should handle invalid ecmaVersion without exiting", async () => {
    const es5File = path.join(testDir, "invalid-version.js");
    fs.writeFileSync(es5File, "var x = 5;");

    const config = [
      {
        ecmaVersion: "es99",
        files: [es5File],
      },
    ];

    const result = await runChecks(config);
    assert.strictEqual(result.success, false);
    assert(result.errors.length > 0);
    assert(result.errors[0].err.message.includes("Invalid ecmaScript version"));
  });

  test("runChecks - should handle missing ecmaVersion without exiting", async () => {
    const config = [
      {
        files: ["*.js"],
      },
    ];

    const result = await runChecks(config);
    assert.strictEqual(result.success, false);
    assert(result.errors.length > 0);
    assert(result.errors[0].err.message.includes("ecmaScript version"));
  });

  test("runChecks - should handle no files specified without exiting", async () => {
    const config = [
      {
        ecmaVersion: "es5",
        files: [],
      },
    ];

    const result = await runChecks(config);
    assert.strictEqual(result.success, false);
    assert(result.errors.length > 0);
    assert(result.errors[0].err.message.includes("file patterns"));
  });

  test("runChecks - should handle glob patterns with no matches", async () => {
    const config = [
      {
        ecmaVersion: "es5",
        files: [path.join(testDir, "*.xyz")],
      },
    ];

    const result = await runChecks(config);
    assert.strictEqual(result.success, false);
    assert(result.errors.length > 0);
    assert(result.errors[0].err.message.includes("Did not find any files"));
  });

  test("runChecks - should detect ES6 features in ES5 mode", async () => {
    const es6File = path.join(testDir, "features.js");
    fs.writeFileSync(
      es6File,
      `
    const arrow = () => {};
    class MyClass {}
    let template = \`hello\`;
  `,
    );

    const config = [
      {
        ecmaVersion: "es5",
        files: [es6File],
        checkFeatures: true,
      },
    ];

    const result = await runChecks(config);
    assert.strictEqual(result.success, false);
    assert(result.errors.length > 0);
  });

  test("runChecks - should pass when features match version", async () => {
    const es6File = path.join(testDir, "valid-es6.js");
    fs.writeFileSync(
      es6File,
      `
    const arrow = () => {};
    class MyClass {}
    let template = \`hello\`;
  `,
    );

    const config = [
      {
        ecmaVersion: "es6",
        files: [es6File],
        checkFeatures: true,
      },
    ];

    const result = await runChecks(config);
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.errors, []);
  });

  test("runChecks - should handle ES modules when module option is set", async () => {
    const moduleFile = path.join(testDir, "module.js");
    fs.writeFileSync(
      moduleFile,
      `
    import fs from 'fs';
    export const myFunc = () => {};
  `,
    );

    const config = [
      {
        ecmaVersion: "es6",
        files: [moduleFile],
        module: true,
      },
    ];

    const result = await runChecks(config);
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.errors, []);
  });

  test("runChecks - should fail ES modules when module option is not set", async () => {
    const moduleFile = path.join(testDir, "module-fail.js");
    fs.writeFileSync(
      moduleFile,
      `
    import fs from 'fs';
    export const myFunc = () => {};
  `,
    );

    const config = [
      {
        ecmaVersion: "es6",
        files: [moduleFile],
        module: false,
      },
    ];

    const result = await runChecks(config);
    assert.strictEqual(result.success, false);
    assert(result.errors.length > 0);
  });

  test("runChecks - should process multiple configs and aggregate errors", async () => {
    const es5File = path.join(testDir, "multi-es5.js");
    const es6File = path.join(testDir, "multi-es6.js");

    fs.writeFileSync(es5File, "var x = 5;");
    fs.writeFileSync(es6File, "const y = 10;");

    const configs = [
      {
        ecmaVersion: "es5",
        files: [es5File],
      },
      {
        ecmaVersion: "es5",
        files: [es6File],
      },
    ];

    const result = await runChecks(configs);
    assert.strictEqual(result.success, false);
    assert(result.errors.length > 0);
    assert(result.errors.some((e) => e.file === es6File));
  });

  test("runChecks - should handle all configs passing", async () => {
    const es5File = path.join(testDir, "valid-es5.js");
    const es6File = path.join(testDir, "valid-es6.js");

    fs.writeFileSync(es5File, "var x = 5;");
    fs.writeFileSync(es6File, "const y = 10;");

    const configs = [
      {
        ecmaVersion: "es5",
        files: [es5File],
      },
      {
        ecmaVersion: "es6",
        files: [es6File],
      },
    ];

    const result = await runChecks(configs);
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.errors, []);
  });

  test("loadConfig - should load default config", async () => {
    const configs = await loadConfig();
    assert(Array.isArray(configs));
    assert(configs.length >= 1);
  });

  test("loadConfig - should load custom config file", async () => {
    const configFile = path.join(testDir, ".escheckrc");
    const configContent = {
      ecmaVersion: "es6",
      files: ["src/**/*.js"],
    };
    fs.writeFileSync(configFile, JSON.stringify(configContent));

    const configs = await loadConfig(configFile);
    assert(Array.isArray(configs));
    assert.strictEqual(configs[0].ecmaVersion, "es6");
    assert.deepStrictEqual(configs[0].files, ["src/**/*.js"]);
  });

  test("loadConfig - should handle array configs", async () => {
    const configFile = path.join(testDir, ".escheckrc");
    const configContent = [
      { ecmaVersion: "es5", files: ["lib/**/*.js"] },
      { ecmaVersion: "es6", files: ["src/**/*.js"] },
    ];
    fs.writeFileSync(configFile, JSON.stringify(configContent));

    const configs = await loadConfig(configFile);
    assert(Array.isArray(configs));
    assert.strictEqual(configs.length, 2);
    assert.strictEqual(configs[0].ecmaVersion, "es5");
    assert.strictEqual(configs[1].ecmaVersion, "es6");
  });

  test("runChecks - should handle null as second argument", async () => {
    const es5File = path.join(testDir, "null-logger.js");
    fs.writeFileSync(es5File, "var x = 5;");

    const config = [
      {
        ecmaVersion: "es5",
        files: [es5File],
      },
    ];

    const result = await runChecks(config, null);
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.errors, []);
  });

  test("runChecks - should handle undefined as second argument", async () => {
    const es5File = path.join(testDir, "undefined-logger.js");
    fs.writeFileSync(es5File, "var x = 5;");

    const config = [
      {
        ecmaVersion: "es5",
        files: [es5File],
      },
    ];

    const result = await runChecks(config, undefined);
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.errors, []);
  });

  test("runChecks - should handle allowHashBang option", async () => {
    const hashbangFile = path.join(testDir, "hashbang.js");
    fs.writeFileSync(hashbangFile, "#!/usr/bin/env node\nvar x = 5;");

    const config = [
      {
        ecmaVersion: "es5",
        files: [hashbangFile],
        allowHashBang: true,
      },
    ];

    const result = await runChecks(config);
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.errors, []);
  });

  test("runChecks - should handle looseGlobMatching option", async () => {
    const config = [
      {
        ecmaVersion: "es5",
        files: [path.join(testDir, "*.nonexistent")],
        looseGlobMatching: true,
      },
    ];

    const result = await runChecks(config);
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.errors, []);
  });

  test("runChecks - should pass object method shorthand and property shorthand with ios >= 9 browserslist query", async () => {
    const file = path.join(testDir, "ios9-object-shorthand.js");
    fs.writeFileSync(
      file,
      `var x = {
  get() {
    return 123;
  },
};

var i = 123;
var v = {
  i,
};`,
    );

    const result = await runChecks([
      {
        ecmaVersion: "checkBrowser",
        browserslistQuery: "ios >= 9",
        files: [file],
        cache: false,
      },
    ]);
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.errors, []);
  });

  test("runChecks - should pass arrow functions and template literals with ios >= 9 browserslist query", async () => {
    const file = path.join(testDir, "ios9-es6-features.js");
    fs.writeFileSync(
      file,
      `const double = (x) => x * 2;
const name = "world";
const greeting = \`hello \${name}\`;
const [first, ...rest] = [1, 2, 3];`,
    );

    const result = await runChecks([
      {
        ecmaVersion: "checkBrowser",
        browserslistQuery: "ios >= 9",
        files: [file],
        cache: false,
      },
    ]);
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.errors, []);
  });
});

process.on("exit", cleanupTestDir);
