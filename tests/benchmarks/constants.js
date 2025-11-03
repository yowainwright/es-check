const POPULAR_LIBRARIES = [
  "lodash",
  "axios",
  "react",
  "moment",
  "express",
  "chalk",
];

const LIBRARY_URLS = {
  lodash: "https://unpkg.com/lodash@4.17.21/lodash.js",
  axios: "https://unpkg.com/axios@1.6.0/dist/axios.js",
  react: "https://unpkg.com/react@18.2.0/umd/react.production.min.js",
  moment: "https://unpkg.com/moment@2.29.4/moment.js",
  express: "https://unpkg.com/express@4.18.2/index.js",
  chalk: "https://unpkg.com/chalk@4.1.2/source/index.js",
};

const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/test/**",
  "**/tests/**",
  "**/*.test.js",
  "**/*.spec.js",
  "**/*.min.js",
];

const DEFAULT_ITERATIONS = 5;
const DEFAULT_TEST_DIR = "./node_modules";
const DEFAULT_ES_VERSION = "es5";
const DEFAULT_MAX_FILES = 100;

module.exports = {
  POPULAR_LIBRARIES,
  LIBRARY_URLS,
  IGNORE_PATTERNS,
  DEFAULT_ITERATIONS,
  DEFAULT_TEST_DIR,
  DEFAULT_ES_VERSION,
  DEFAULT_MAX_FILES,
};
