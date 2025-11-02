const CLI_DESCRIPTION = {
  main: "es-check 🏆 - Check JavaScript files against an ECMAScript version",
  ecmaVersion: "ecmaVersion to check files against. Can be: es3, es4, es5, es6/es2015, es7/es2016, es8/es2017, es9/es2018, es10/es2019, es11/es2020, es12/es2021, es13/es2022, es14/es2023, es15/es2024, es16/es2025, checkBrowser",
  files: "a glob of files to to test the EcmaScript version against",
  completion: "generate shell completion script",
  shell: "shell type: bash, zsh",
};

const CLI_OPTIONS = [
  {
    flags: "--module",
    description: "use ES modules",
  },
  {
    flags: "--allow-hash-bang",
    description: "if the code starts with #! treat it as a comment",
    default: false,
    hidden: true,
  },
  {
    flags: "--allowHashBang",
    description: "if the code starts with #! treat it as a comment",
    default: false,
  },
  {
    flags: "--files <files>",
    description: "a glob of files to to test the EcmaScript version against (alias for [files...])",
  },
  {
    flags: "--not <files>",
    description: "folder or file names to skip",
  },
  {
    flags: "--no-color",
    description: "disable use of colors in output",
    default: false,
    hidden: true,
  },
  {
    flags: "--noColor",
    description: "disable use of colors in output",
    default: false,
  },
  {
    flags: "-v, --verbose",
    description: "verbose mode: will also output debug messages",
    default: false,
  },
  {
    flags: "--quiet",
    description: "quiet mode: only displays warn and error messages",
    default: false,
  },
  {
    flags: "--looseGlobMatching",
    description: "doesn't fail if no files are found in some globs/files",
    default: false,
  },
  {
    flags: "--checkFeatures",
    description: "check features of es version",
    default: false,
  },
  {
    flags: "--checkForPolyfills",
    description: "consider polyfills when checking features (only works with --checkFeatures)",
    default: false,
  },
  {
    flags: "--silent",
    description: "silent mode: does not output anything, giving no indication of success or failure other than the exit code",
    default: false,
  },
  {
    flags: "--ignore <features>",
    description: 'comma-separated list of features to ignore, e.g., "ErrorCause,TopLevelAwait"',
  },
  {
    flags: "--ignore-file <path>",
    description: "path to JSON file containing features to ignore",
    hidden: true,
  },
  {
    flags: "--ignoreFile <path>",
    description: "path to JSON file containing features to ignore",
  },
  {
    flags: "--allowList <features>",
    description: 'comma-separated list of features to allow even in lower ES versions, e.g., "const,let"',
  },
  {
    flags: "--checkBrowser",
    description: "use browserslist configuration to determine ES version, use checkBrowser argument instead of ecmaVersion",
    default: false,
    hidden: true,
  },
  {
    flags: "--browserslistQuery <query>",
    description: "browserslist query",
  },
  {
    flags: "--browserslistPath <path>",
    description: "path to custom browserslist configuration",
  },
  {
    flags: "--browserslistEnv <env>",
    description: "browserslist environment to use",
  },
  {
    flags: "--config <path>",
    description: "path to custom .escheckrc config file",
  },
  {
    flags: "--batchSize <number>",
    description: "number of files to process concurrently (0 for unlimited)",
    default: "0",
  },
  {
    flags: "--noCache",
    description: "disable file caching (caching is enabled by default)",
    default: false,
  },
  {
    flags: "--light",
    description: "lightweight mode: faster checking with pattern matching only (skips full AST parsing)",
    default: false,
  },
];

const SUPPORTED_SHELLS = ["bash", "zsh"];

const COMPLETION_OPTIONS = [
  "version", "help", "module", "light", "allowHashBang", "files", "not",
  "noColor", "verbose", "quiet", "silent", "looseGlobMatching",
  "checkFeatures", "checkForPolyfills", "ignore", "ignoreFile", "allowList",
  "checkBrowser", "browserslistQuery", "browserslistPath", "browserslistEnv",
  "config", "batchSize", "noCache"
];

module.exports = {
  CLI_DESCRIPTION,
  CLI_OPTIONS,
  SUPPORTED_SHELLS,
  COMPLETION_OPTIONS,
};
