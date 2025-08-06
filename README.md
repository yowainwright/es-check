<p align="center">
  <img src="https://yowainwright.imgix.net/gh/es-check.svg" alt="ES Check ✔️" width="120" />
</p>

---

<p align="center">Check JavaScript files ES version against a specified ES version 🏆</p>

---

# ES Check ✔️

[![npm version](https://badge.fury.io/js/es-check.svg)](https://www.npmjs.com/package/es-check)

---

**ES Check** checks JavaScript files against a specified version of ECMAScript (ES) with a shell command. If a specified file's ES version doesn't match the ES version argument passed in the ES Check command, ES Check will throw an error and log the files that didn't match the check.

Ensuring that JavaScript files can pass ES Check is important in a [modular and bundled](https://www.sitepoint.com/javascript-modules-bundling-transpiling/) world. Read more about [why](#why).

---

## Version 9 🎉

**ES Check** version 9 is a major release update that can enforce more ES version specific features checks, implements initial browserslist integration, basic (naive) polyfill detection, and supports an allowlist. To enable ecmaVersion specific checks, pass the `--checkFeatures` flag. To enable browserslist integration, pass the `--checkBrowser` flag. To enable polyfill detection, pass the `--checkForPolyfills` flag. There is also more config file support. Besides this, there are other feature updates based on user feedback. This version should not break any existing scripts but, as significant changes/features have been added and it's know that es-check supports protecting against breaking errors going to production, a major version bump feels appropriate. Please report any issues!


### `--checkFeatures`

```sh
es-check es6 './dist/**/*.js' --checkFeatures
```

### `checkBrowser --browserslistQuery='<broswerslist query>'`

```sh
es-check checkBrowser ./dist/**/*.js --browserslistQuery="last 2 versions"
```

---

<p align="center">
  <a href="#get-started">Get Started</a>&nbsp;&nbsp;
  <a href="#why-es-check">Why ES Check?</a>&nbsp;&nbsp;
  <a href="#usage">Usage</a>&nbsp;&nbsp;
  <a href="#walk-through">Walk Through</a>&nbsp;&nbsp;
  <a href="#api">API</a>&nbsp;&nbsp;
  <a href="#debugging">Debugging</a>&nbsp;&nbsp;
  <a href="#contributing">Contributing</a>&nbsp;&nbsp;
  <a href="/issues">Issues</a>
</p>

---

## Get Started

Install

```sh

npm i es-check --save-dev   # locally
npm i es-check -g           # or globally

```

Check if an array or glob of files matches a specified ES version.

- **Note:** adds quotation around globs. Globs are patterns like so, `<something>/*.js`.

```sh

es-check es5 './vendor/js/*.js' './dist/**/*.js'

```

- The ES Check script (above) checks `/dist/*.js` files to see if they're ES5. It throws an error and logs files are that do not pass the check.

---

## Why ES Check?

In modern JavaScript builds, files are bundled up so they can be served in an optimized manner in the browsers. It is assumed by developers that future JavaScript—like ES8 will be transpiled (changed from future JavaScript to current JavaScript) appropriately by a tool like Babel. Sometimes there is an issue where files are not transpiled. There was no efficient way to test for files that weren't transpiled—until now. That's what ES Check does.

## What features does ES Check check for?

ES Check checks syntax out of the box—to protect against breaking errors going to production. Additionally, by adding the `--checkFeatures` flag, ES Check will check for actual ES version specific features. This ensures that your code is syntactically correct and only using features that are available in the specified ES version. Look here to view/add [features](./constants.js) that ES Check checks for with the `--checkFeatures` flag!

---

## Walk through

The images below demonstrate command line scripts and their corresponding logged results.

### Pass

![pass](https://user-images.githubusercontent.com/1074042/31471487-d7be22ee-ae9d-11e7-86e2-2c0f71cfffe6.jpg)

### Fail

![fail](https://user-images.githubusercontent.com/1074042/31471486-d65c3a80-ae9d-11e7-94fd-68b7acdb2d89.jpg)

**ES Check** is run above with node commands. It can also be run within npm scripts, ci tools, or testing suites. It also provide minimal support for use in node apps. 

---

## API

```sh

# USAGE

es-check <ecmaVersion> [files...]

```

### Arguments

```sh

Usage: index [options] [ecmaVersion] [files...]

Arguments:
  ecmaVersion                         ecmaVersion to check files against. Can be: es3, es4, es5, es6/es2015, es7/es2016, es8/es2017, es9/es2018, es10/es2019, es11/es2020, es12/es2021,
                                      es13/es2022, es14/es2023
  files                               a glob of files to to test the EcmaScript version against

```

### Options

Here's a comprehensive list of all available options:

| Option | Description |
|--------|-------------|
| `-V, --version` | Output the version number |
| `--module` | Use ES modules (default: false) |
| `--allowHashBang` | If the code starts with #! treat it as a comment (default: false) |
| `--files <files>` | A glob of files to test the ECMAScript version against (alias for [files...]) |
| `--not <files>` | Folder or file names to skip |
| `--noColor` | Disable use of colors in output (default: false) |
| `-v, --verbose` | Verbose mode: will also output debug messages (default: false) |
| `--quiet` | Quiet mode: only displays warn and error messages (default: false) |
| `--looseGlobMatching` | Doesn't fail if no files are found in some globs/files (default: false) |
| `--silent` | Silent mode: does not output anything, giving no indication of success or failure other than the exit code (default: false) |
| `--checkFeatures` | Check for actual ES version specific features (default: false) |
| `--checkForPolyfills` | Consider polyfills when checking features (only works with --checkFeatures) (default: false) |
| `--ignore <features>` | Comma-separated list of features to ignore, e.g., "ErrorCause,TopLevelAwait" |
| `--ignoreFile <path>` | Path to JSON file containing features to ignore |
| `--allowList <features>` | Comma-separated list of features to allow even in lower ES versions, e.g., "const,let" |
| `--checkBrowser` | Use browserslist configuration to determine ES version (default: false) |
| `--browserslistQuery <query>` | Custom browserslist query (e.g., "last 2 versions") |
| `--browserslistPath <path>` | Path to custom browserslist configuration (default: uses standard browserslist config resolution) |
| `--browserslistEnv <env>` | Browserslist environment to use (default: production) |
| `--config <path>` | Path to custom .escheckrc config file |
| `--batchSize <number>` | Number of files to process concurrently (0 for unlimited, default: 0) |
| `-h, --help` | Display help for command |

### Shell Completion

ES Check supports shell tab completion for commands and options. You can generate completion scripts for bash and zsh shells:

```sh
# Generate completion script for bash (default)
es-check completion

# Generate completion script for zsh
es-check completion zsh
```

To enable completions in your shell:

**Bash:**

```sh
# Add to ~/.bashrc or ~/.bash_profile
es-check completion > ~/.es-check-completion.bash
echo 'source ~/.es-check-completion.bash' >> ~/.bashrc
```

**Zsh:**

```sh
# Add to ~/.zshrc
es-check completion zsh > ~/.es-check-completion.zsh
echo 'source ~/.es-check-completion.zsh' >> ~/.zshrc
```

Once enabled, you can use tab completion for:

- ES versions (es5, es6, etc.)
- Commands (completion)
- Options (--module, --checkFeatures, etc.)
- File paths

#### Examples

**Using ES modules:**

```sh
es-check es6 './dist/**/*.js' --module
```

**Checking files with hash bang:**

```sh
es-check es6 './bin/*.js' --allowHashBang
```

**Skipping specific files or directories:**

```sh
es-check es5 './dist/**/*.js' --not=./dist/vendor,./dist/polyfills
```

**Using the files option instead of arguments:**

```sh
es-check es6 --files=./dist/main.js,./dist/utils.js
```

⚠️ **NOTE:** Setting both the `[...files]` argument and `--files` flag is an error.

**Using loose glob matching:**

```sh
es-check es5 './dist/**/*.js' './optional/**/*.js' --looseGlobMatching
```

**Checking for ES version specific features:**

```sh
es-check es6 './dist/**/*.js' --checkFeatures
```

**Considering polyfills when checking features:**

```sh
es-check es2022 './dist/**/*.js' --checkFeatures --checkForPolyfills
```

**Using a custom config file:**

```sh
es-check --config=./configs/production.escheckrc.json
```

**Using a custom browserslist query:**

```sh
es-check --checkBrowser --browserslistQuery="last 2 versions" ./dist/**/*.js
```

**Using browserslist with custom query and feature checking:**

```sh
es-check --checkBrowser --browserslistQuery=">0.5%, not dead" --checkFeatures ./dist/**/*.js
```

**Using browserlist just like an es version**

```sh
es-check checkBrowser ./dist/**/*.js --browserslistQuery=">0.5%, not dead"
```

**Using browserlist with a pre-defined browserlist**

```sh
es-check checkBrowser ./dist/**/*.js
```

---

## Usage

ES Check is mainly a shell command CLI. It is run in [shell tool](http://linuxcommand.org/lc3_learning_the_shell.php) like Terminal, ITerm, or Hyper. It takes in two arguments: an [ECMAScript version](https://www.w3schools.com/js/js_versions.asp) (`<ECMAScript version>`) and files (`[files]`) in [globs](http://searchsecurity.techtarget.com/definition/globbing).

Here are some example of **es check** scripts that could be run:

```sh
# globs
es-check es6 ./js/*.js

# array of arguments
es-check es6 ./js/*.js ./dist/*.js
```

### Using ES Check in Node

In addition to its CLI utility, ES Check can be used programmatically in Node.js applications:

```javascript
const { runChecks, loadConfig } = require('es-check');

async function checkMyFiles() {
  const config = {
    ecmaVersion: 'es5',
    files: ['dist/**/*.js'],
    module: false,
    checkFeatures: true
  };
  
  try {
    await runChecks([config], logger);
    console.log('All files passed ES5 check!');
  } catch (error) {
    console.error('Some files failed the ES check');
    process.exit(1);
  }
}

async function checkWithConfig() {
  const configs = await loadConfig('./.escheckrc');
  await runChecks(configs, logger);
}
```

---

## Configuration

If you're using a consistent configuration, you can create a `.escheckrc` file in JSON format with the `ecmaVersion` and `files` arguments so you can conveniently run `es-check` standalone from the command line.

Here's an example of what an `.escheckrc` file will look like:

```json
{
  "ecmaVersion": "es6",
  "module": false,
  "files": "./dist/**/*.js",
  "not": ["./dist/skip/*.js"],
  "allowHashBang": false,
  "looseGlobMatching": false,
  "checkFeatures": true,
  "checkForPolyfills": true,
  "ignore": ["ErrorCause", "TopLevelAwait"],
  "allowList": ["ArrayToSorted", "ObjectHasOwn"],
  "checkBrowser": false,
  "browserslistQuery": "last 2 versions",
  "browserslistPath": "./config/.browserslistrc",
  "browserslistEnv": "production"
}
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `ecmaVersion` | String | ECMAScript version to check against (e.g., "es5", "es6", "es2020") |
| `files` | String or Array | Files or glob patterns to check |
| `module` | Boolean | Whether to parse files as ES modules |
| `not` | Array | Files or glob patterns to exclude |
| `allowHashBang` | Boolean | Whether to allow hash bang in files |
| `looseGlobMatching` | Boolean | Whether to ignore missing files in globs |
| `checkFeatures` | Boolean | Whether to check for ES version specific features |
| `checkForPolyfills` | Boolean | Whether to consider polyfills when checking features |
| `ignore` | Array | Features to ignore when checking |
| `allowList` | Array | Features to allow even in lower ES versions |
| `checkBrowser` | Boolean | Whether to use browserslist configuration to determine ES version |
| `browserslistQuery` | String | Custom browserslist query to use |
| `browserslistPath` | String | Path to custom browserslist configuration |
| `browserslistEnv` | String | Browserslist environment to use |

### Multiple Configurations

For projects with multiple bundle types (like UMD, CJS, and ESM), you can specify different configurations using an array:

```json
[
  {
    "ecmaVersion": "es6",
    "module": false,
    "files": "{cjs,umd}/index.{cjs,js}"
  },
  {
    "ecmaVersion": "es2020",
    "module": true,
    "files": "esm/index.mjs",
    "checkFeatures": true
  },
  {
    "files": "legacy/*.js",
    "checkBrowser": true,
    "browserslistEnv": "legacy"
  }
]
```

### Custom Config Path

⚠️ **NOTE:** Using command line arguments while there is an `.escheckrc` file in the project directory will override all configurations in `.escheckrc`.

You can also specify a custom config file path using the `--config` option:

```sh
es-check --config=./configs/my-custom-config.json
```

This is useful for projects that need different configurations for different environments or test scenarios.

## Debugging

As of ES-Check version **2.0.2**, a better debugging interface is provided. When a file errors, An error object will be logged with:

- the erroring file
- the error
- the error stack

⚠️ **NOTE:** Error logs are from the Acorn parser while parsing JavaScript related to specific versions of ECMAScript. This means error messaging is not specific to ECMAScript version. It still offers context into parsing issues!

---

## Ignoring Features

Sometimes you may need to temporarily ignore certain feature detections while working on fixes. ES Check provides two ways to ignore features:

1. Via command line:

```sh
es-check es6 './dist/**/*.js' --checkFeatures --ignore="ErrorCause,TopLevelAwait"
```

1. Via ignore file:

```sh
es-check es6 './dist/**/*.js' --checkFeatures --ignoreFile=".escheckignore"
```

Example `.escheckignore` file:

```json
{
  "features": [
    "ErrorCause",
    "TopLevelAwait"
  ]
}
```

⚠️ **NOTE:** The ignore feature is intended as a temporary solution while working on fixes. It's recommended to remove ignored features once the underlying issues are resolved.

---

## Polyfill Detection

When using polyfills like core-js to add support for modern JavaScript features in older environments, you might encounter false positives with the `--checkFeatures` flag. ES Check provides the `--checkForPolyfills` option to handle this scenario:

```sh
es-check es2022 './dist/**/*.js' --checkFeatures --checkForPolyfills
```

This option tells ES Check to look for common polyfill patterns in your code and avoid flagging features that have been polyfilled. Currently, it supports detection of:

- Core-js polyfills (both direct usage and imports)
- Common polyfill patterns for Array, String, Object, Promise, and RegExp methods

### Comparing Polyfill Handling Options

ES Check provides three ways to handle polyfilled features:

1. **--checkForPolyfills**: Automatically detects polyfills in your code
   ```sh
   es-check es2022 './dist/**/*.js' --checkFeatures --checkForPolyfills
   ```

2. **--allowList**: Explicitly specify features to allow regardless of ES version
   ```sh
   es-check es2022 './dist/**/*.js' --checkFeatures --allowList="ArrayToSorted,ObjectHasOwn"
   ```

3. **--ignore**: Completely ignore specific features during checking
   ```sh
   es-check es2022 './dist/**/*.js' --checkFeatures --ignore="ArrayToSorted,ObjectHasOwn"
   ```

#### When to use each option:

- Use `--checkForPolyfills` when you have a standard polyfill setup (like core-js) and want automatic detection
- Use `--allowList` when you have custom polyfills or want to be explicit about which features are allowed
- Use `--ignore` as a temporary solution when you're working on fixes

⚠️ **NOTE:** The polyfill detection is not exhaustive and may not catch all polyfill patterns. For complex polyfill setups, you might need to combine it with `--allowList`.

---

## Browserslist Integration

ES-Check can use your project's browserslist configuration to automatically determine which ES version to check against:

```sh
# Using --checkBrowser flag with browserslist query
es-check --checkBrowser --browserslistQuery="last 2 versions" ./dist/**/*.js

# Using 'checkBrowser' as the ES version argument
es-check checkBrowser --browserslistQuery="last 2 versions" ./dist/**/*.js

# Using a pre-defined browserslist configuration
es-check checkBrowser ./dist/**/*.js
```

This will read your browserslist configuration (from `.browserslistrc`, `package.json`, etc.) and determine the appropriate ES version based on your targeted browsers.

### Examples with Browserslist

**Using a custom browserslist query:**

```sh
es-check --checkBrowser --browserslistQuery="last 2 versions" ./dist/**/*.js
```

**Using a specific browserslist environment:**

```sh
es-check --checkBrowser --browserslistEnv="production" ./dist/**/*.js
```

**Combining with feature checking:**

```sh
es-check --checkBrowser --checkFeatures ./dist/**/*.js
```

⚠️ **NOTE:** When using `--checkBrowser`, you must also provide a `--browserslistQuery` or have a valid browserslist configuration in your project. You cannot have a files directly after your `--checkBrowser` option; it will read as 

---

## Performance Optimization

ES Check provides the `--batchSize` option to optimize performance for different scenarios:

```sh
# Process all files in parallel (default)
es-check es5 './dist/**/*.js' --batchSize 0

# Process 10 files at a time (memory-constrained environments)
es-check es5 './dist/**/*.js' --batchSize 10

# Process 50 files at a time (balanced approach)
es-check es5 './dist/**/*.js' --batchSize 50
```

### Performance Guidelines

| Scenario | Recommended `--batchSize` | Reason |
|----------|---------------------------|---------|
| Small codebases (< 100 files) | `0` (unlimited) | Maximum parallelism for fastest results |
| Medium codebases (100-500 files) | `0` or `50` | Balance between speed and memory |
| Large codebases (> 500 files) | `50-100` | Prevent memory spikes |
| CI/CD with limited memory | `10-20` | Conservative memory usage |
| Local development | `0` (default) | Utilize available hardware |

### Recent Performance Improvements

As of August 2025, ES Check has been optimized with:
- **Single-parse optimization**: Files are parsed once and the AST is reused
- **Async file processing**: Non-blocking I/O for better performance
- **Configurable batch processing**: Fine-tune based on your needs

---

## Checking node_modules Dependencies

To check node_modules dependencies for ES compatibility:

```sh
// Check a specific package
npx es-check es5 ./node_modules/some-package/dist/index.js

// Check all JS files in node_modules
npx es-check es5 './node_modules/**/*.js'
```

A simple example script is available in `examples/check-node-modules.js`.

---

## Acknowledgements

ES Check is a small utility using powerful tools that [Isaac Z. Schlueter](https://github.com/isaacs), [Marijn Haverbeke](https://github.com/marijnh), and [Matthias Etienne](https://github.com/mattallty) built. [ES Checker](https://github.com/ruanyf/es-checker) by [Ruan YiFeng](https://github.com/ruanyf) checks the JavaScript version supported within a [browser](http://ruanyf.github.io/es-checker/) at run time. ES Check offers similar feedback to ES Checker but at build time and is specific to the product that is using it. ES Check was started after reading [Philip Walton](https://github.com/philipwalton)'s post about [deploying es2015 code to production today](https://philipwalton.com/articles/deploying-es2015-code-in-production-today/).

---

## Contributing

ES Check has 7 dependencies: [acorn and acorn-walk](https://github.com/ternjs/acorn/), [fast-glob](https://github.com/mrmlnc/fast-glob), [supports-color](https://github.com/chalk/supports-color), [winston](https://github.com/winstonjs/winston), [browserslist](https://github.com/browserslist/browserslist), and [commander](https://github.com/tj/commander). To contribute, file an [issue](https://github.com/yowainwright/es-check/issues) or submit a pull request.

To update es versions, check out these lines of code [here](https://github.com/yowainwright/es-check/blob/main/index.js#L92-L153) and [here (in acorn.js)](https://github.com/acornjs/acorn/blob/3221fa54f9dea30338228b97210c4f1fd332652d/acorn/src/acorn.d.ts#L586).

To update es feature detection, update these files [here](./utils.js) and [here](./constants.js) as enabled feature testing using [acorn walk](https://github.com/acornjs/acorn/blob/master/acorn-walk/README.md).

[tests](./test.js) to go with new version and/or feature detection updates are great to have!

### Contributors

- [Jeff Wainwright](https://github.com/yowainwright/)
- [Brian Gonzalez](https://github.com/briangonzalez/)
- [Jon Ong](https://github.com/jonathanong/)
- [Suhas Karanth](https://github.com/sudo-suhas)
- [Ben Junya](https://github.com/MrBenJ)
- [Jeff Barczewski](https://github.com/jeffbski)
- [Brandon Casey](https://github.com/BrandonOCasey)
