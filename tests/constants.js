"use strict";

const path = require("path");

/**
 * Test Constants
 * Shared constants used across test files to avoid duplication
 */

// Fixture paths
const FIXTURES_ROOT = path.join(__dirname, "fixtures");

const FIXTURE_FILES = {
  ES5: path.join(FIXTURES_ROOT, "es5.js"),
  ES5_2: path.join(FIXTURES_ROOT, "es5-2.js"),
  ES6: path.join(FIXTURES_ROOT, "es6.js"),
  ES6_2: path.join(FIXTURES_ROOT, "es6-2.js"),
  ES7: path.join(FIXTURES_ROOT, "es7.js"),
  ES8: path.join(FIXTURES_ROOT, "es8.js"),
  ES9: path.join(FIXTURES_ROOT, "es9.js"),
  ES10: path.join(FIXTURES_ROOT, "es10.js"),
  ES11: path.join(FIXTURES_ROOT, "es11.js"),
  ES12: path.join(FIXTURES_ROOT, "es12.js"),
  ES13: path.join(FIXTURES_ROOT, "es13.js"),
  ES14: path.join(FIXTURES_ROOT, "es14.js"),
  ES15: path.join(FIXTURES_ROOT, "es15.js"),
  ES16: path.join(FIXTURES_ROOT, "es16.js"),
  ES2018: path.join(FIXTURES_ROOT, "es2018.js"),
  ES2020: path.join(FIXTURES_ROOT, "es2020.js"),
  PROXY: path.join(FIXTURES_ROOT, "proxy.js"),
  PROMISE_NEW: path.join(FIXTURES_ROOT, "promise.new.js"),
  PROMISE_RESOLVE: path.join(FIXTURES_ROOT, "promise.resolve.js"),
  PROMISE_REJECT: path.join(FIXTURES_ROOT, "promise.reject.js"),
  MODULES: path.join(FIXTURES_ROOT, "modules/*.js"),
  MODULES_ES5: path.join(FIXTURES_ROOT, "modules/es5-syntax-module.js"),
  SKIPPED: path.join(FIXTURES_ROOT, "skipped/*"),
  PASSED: path.join(FIXTURES_ROOT, "passed/*"),
  HASH_BANG: path.join(FIXTURES_ROOT, "scripts/hash-bang.js"),
  CHECKBROWSER_ES6: path.join(FIXTURES_ROOT, "checkbrowser/es6.js"),
  CHECKBROWSER_ES2020: path.join(FIXTURES_ROOT, "checkbrowser/es2020.js"),
};

// Common CLI commands
const CLI_COMMANDS = {
  BASE: "node lib/index.js",
  ES5_CHECK: "node lib/index.js es5",
  ES6_CHECK: "node lib/index.js es6",
  ES2018_CHECK: "node lib/index.js es2018",
};

// Common command flags
const FLAGS = {
  MODULE: "--module",
  CHECK_FEATURES: "--checkFeatures",
  ALLOW_HASH_BANG: "--allow-hash-bang",
  NO_COLOR: "--no-color",
  CHECK_BROWSER: "--checkBrowser",
  NO_CACHE: "--noCache",
};

// Test emojis
const TEST_EMOJIS = {
  PASS: "🎉",
  FAIL: "👌",
  TEST: "🧪",
  LAB: "🔬",
};

// ES Version mappings
const ES_VERSIONS = {
  ES5: "es5",
  ES6: "es6",
  ES7: "es7",
  ES8: "es8",
  ES9: "es9",
  ES10: "es10",
  ES11: "es11",
  ES12: "es12",
  ES13: "es13",
  ES14: "es14",
  ES15: "es15",
  ES16: "es16",
  ES2015: "es2015",
  ES2016: "es2016",
  ES2017: "es2017",
  ES2018: "es2018",
  ES2019: "es2019",
  ES2020: "es2020",
  ES2021: "es2021",
  ES2022: "es2022",
  ES2023: "es2023",
  ES2024: "es2024",
  ES2025: "es2025",
};

// Browser queries for testing
const BROWSER_QUERIES = {
  MODERN_CHROME: "Chrome >= 100",
  OLD_IE: "IE 11",
  CHROME_85: "Chrome >= 85",
  CHROME_60: "Chrome >= 60",
  FIREFOX_60: "Firefox >= 60",
  MIXED_OLD: "Chrome >= 60, Firefox >= 60",
};

// Common test messages
const MESSAGES = {
  SUCCESS: "no ES version matching errors",
  ERROR: "ES version matching errors",
  ERROR_ALT: "ES-Check: there were",
};

// Sample code snippets for testing
const CODE_SAMPLES = {
  ES5: "var x = 5;",
  ES6_CONST: "const x = 5;",
  ES6_LET: "let y = 10;",
  ES6_ARROW: "() => {};",
  ES6_CLASS: "class MyClass {}",
  ES6_TEMPLATE: "`template string`",
  ES6_DESTRUCTURING: "const { a, b } = obj;",
  ES6_MODULE_EXPORT: 'export const foo = "bar";',
  ES6_MODULE_IMPORT: 'import foo from "bar";',
  ES2020_OPTIONAL_CHAINING: "obj?.prop",
  ES2020_NULLISH_COALESCING: "value ?? default",
  HASHBANG: "#!/usr/bin/env node\nvar x = 5;",
};

module.exports = {
  FIXTURES_ROOT,
  FIXTURE_FILES,
  CLI_COMMANDS,
  FLAGS,
  TEST_EMOJIS,
  ES_VERSIONS,
  BROWSER_QUERIES,
  MESSAGES,
  CODE_SAMPLES,
};
