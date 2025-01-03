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

## Version 8 🎉

**ES Check** version 8 is a major release update that can enforce actual ES version specific features checks; no longer just that a files are syntatically correct to the es version. To enable this feature, just pass the `--checkFeatures` flag. This feature will become default in version 9. Besides this, there are minor feature updates based on user feedback—glob matching updates and some optional fixes. This should not break any existing scripts. Please report any issues!

```sh
es-check es6 './dist/**/*.js' --checkFeatures
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

Pass
![pass](https://user-images.githubusercontent.com/1074042/31471487-d7be22ee-ae9d-11e7-86e2-2c0f71cfffe6.jpg)

Fail
![fail](https://user-images.githubusercontent.com/1074042/31471486-d65c3a80-ae9d-11e7-94fd-68b7acdb2d89.jpg)

**ES Check** is run above with node commands. It can also be run within npm scripts, ci tools, or testing suites.

---

## API

**ES Check** provides the necessities. It accepts its place as a JavaScript matcher/tester.

### General Information

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

**Modules Flag**

```sh

--module use ES modules, default false

```

**Allow Hash Bang**

```sh

--allowHashBang supports files that start with hash bang, default false

```

**Not**

```sh

--not=target1,target2 An array of file/folder names or globs that you would like to ignore. Defaults to `[]`.

```

**Files**

```sh

--files=target1,target2 An array of file/folder names or globs to test the ECMAScript version against. Alias of [...files] argument.

```

**Loose Glob Matching**

```sh

--looseGlobMatch allows for loose glob matching, default false

```

⚠️ **NOTE:** This is primarily intended as a way to override the `files` setting in the `.escheckrc` file for specific invocations. Setting both the `[...files]` argument and `--files` flag is an error.

**Check Features**


```sh
es-check es6 './dist/**/*.js' --checkFeatures
```

### Global Options

```sh

Options:
  -V, --version                       output the version number
  --module                            use ES modules
  --allow-hash-bang, --allowHashBang  if the code starts with #! treat it as a comment (default: false)
  --files <files>                     a glob of files to to test the EcmaScript version against (alias for [files...])
  --not <files>                       folder or file names to skip
  --no-color, --noColor               disable use of colors in output (default: false)
  -v, --verbose                       verbose mode: will also output debug messages (default: false)
  --quiet                             quiet mode: only displays warn and error messages (default: false)
  --looseGlobMatching                 doesn't fail if no files are found in some globs/files (default: false)
  --silent                            silent mode: does not output anything, giving no indication of success or
  failure other than the exit code (default: false)
  --checkFeatures                     check for actual ES version specific features (default: false)
  -h, --help                          display help for command

```

---

## Usage

ES Check is a shell command CLI. It is run in [shell tool](http://linuxcommand.org/lc3_learning_the_shell.php) like Terminal, ITerm, or Hyper. It takes in two arguments: an [ECMAScript version](https://www.w3schools.com/js/js_versions.asp) (`<ECMAScript version>`) and files (`[files]`) in [globs](http://searchsecurity.techtarget.com/definition/globbing).

Here are some example of **es check** scripts that could be run:

```sh
# globs
es-check ./js/*.js

# array of arguments
es-check ./js/*.js ./dist/*.js
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
  "not": ["./dist/skip/*.js"]
}
```

⚠️ **NOTE:** Using command line arguments while there is an `.escheckrc` file in the project directory will override the configuration values in `.escheckrc`.

## Debugging

As of ES-Check version **2.0.2**, a better debugging interface is provided. When a file errors, An error object will be logged with:

- the erroring file
- the error
- the error stack

⚠️ **NOTE:** Error logs are from the Acorn parser while parsing JavaScript related to specific versions of ECMAScript. This means error messaging is not specific to ECMAScript version. It still offers context into parsing issues!

---

## Acknowledgements

ES Check is a small utility using powerful tools that [Isaac Z. Schlueter](https://github.com/isaacs), [Marijn Haverbeke](https://github.com/marijnh), and [Matthias Etienne](https://github.com/mattallty) built. [ES Checker](https://github.com/ruanyf/es-checker) by [Ruan YiFeng](https://github.com/ruanyf) checks the JavaScript version supported within a [browser](http://ruanyf.github.io/es-checker/) at run time. ES Check offers similar feedback to ES Checker but at build time and is specific to the product that is using it. ES Check was started after reading this [post](https://philipwalton.com/articles/deploying-es2015-code-in-production-today/) about [deploying es2015 code to production today] by [Philip Walton](https://github.com/philipwalton).

---

## Contributing

ES Check has 6 dependencies: [acorn and acorn-walk](https://github.com/ternjs/acorn/), [fast-glob](https://github.com/mrmlnc/fast-glob), [supports-color](github.com/chalk/supports-color), [winston](https://github.com/winstonjs/winston), and [commander](https://github.com/tj/commander). To contribute, file an [issue](https://github.com/yowainwright/es-check/issues) or submit a pull request.

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
