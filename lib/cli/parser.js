function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {};
  const positional = [];

  let i = 0;
  const hasMoreArgs = () => i < args.length;

  while (hasMoreArgs()) {
    const arg = args[i];

    const isLongOption = arg.startsWith("--");
    const isShortOption = arg.startsWith("-") && !arg.startsWith("--");

    if (isLongOption) {
      const hasEquals = arg.includes("=");
      if (hasEquals) {
        const [key, ...valueParts] = arg.slice(2).split("=");
        options[key] = valueParts.join("=");
      } else {
        const key = arg.slice(2);
        const nextArg = args[i + 1];
        const hasNextArg = nextArg !== undefined;
        const nextIsValue = hasNextArg && !nextArg.startsWith("-");

        if (nextIsValue) {
          options[key] = nextArg;
          i++;
        } else {
          options[key] = true;
        }
      }
    } else if (isShortOption) {
      const flags = arg.slice(1);
      const lastFlag = flags[flags.length - 1];
      const otherFlags = flags.slice(0, -1);

      for (const flag of otherFlags) {
        options[flag] = true;
      }

      const nextArg = args[i + 1];
      const hasNextArg = nextArg !== undefined;
      const nextIsValue = hasNextArg && !nextArg.startsWith("-");

      if (nextIsValue) {
        options[lastFlag] = nextArg;
        i++;
      } else {
        options[lastFlag] = true;
      }
    } else {
      positional.push(arg);
    }

    i++;
  }

  return { options, positional };
}

function showHelp(version) {
  const help = `
ES Check v${version} - Check JavaScript files ES version against a specified ES version

USAGE:
  es-check <ecmaVersion> [files...]
  es-check completion [shell]

ARGUMENTS:
  ecmaVersion    ES version to check (es3, es5, es6, es2015-es2025, or checkBrowser)
  files          Glob patterns of files to check

OPTIONS:
  -V, --version                    Output version number
  -h, --help                       Display help
  --module                         Use ES modules
  --light                          Fast checking using pattern matching only
  --allowHashBang                  Treat #! as comment
  --files <files>                  Files to check (comma-separated)
  --not <files>                    Files/folders to skip (comma-separated)
  --noColor                        Disable colors
  -v, --verbose                    Verbose mode (debug messages)
  --quiet                          Quiet mode (warnings and errors only)
  --silent                         Silent mode (no output)
  --looseGlobMatching              Don't fail if no files found
  --checkFeatures                  Check for ES version specific features
  --checkForPolyfills              Consider polyfills when checking features
  --ignore <features>              Features to ignore (comma-separated)
  --ignoreFile <path>              JSON file with features to ignore
  --allowList <features>           Features to allow (comma-separated)
  --checkBrowser                   Use browserslist config for ES version
  --browserslistQuery <query>      Custom browserslist query
  --browserslistPath <path>        Custom browserslist config path
  --browserslistEnv <env>          Browserslist environment (default: production)
  --config <path>                  Custom config file path
  --batchSize <number>             Files to process concurrently (0=unlimited)
  --noCache                        Disable file caching

EXAMPLES:
  es-check es5 './dist/**/*.js'
  es-check es6 './src/*.js' --module
  es-check es2020 './build/**/*.js' --checkFeatures
  es-check checkBrowser './dist/*.js' --browserslistQuery="last 2 versions"
  es-check es5 './dist/*.js' --not=./dist/vendor,./dist/legacy

COMPLETION:
  es-check completion          Generate bash completion
  es-check completion zsh      Generate zsh completion
`;
  console.log(help);
}

function showVersion(version) {
  console.log(version);
}

module.exports = {
  parseArgs,
  showHelp,
  showVersion,
};
