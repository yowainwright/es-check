# Changelog

## [9.3.1](https://github.com/yowainwright/es-check/compare/9.3.0...9.3.1) (2024)

### Bug Fixes
* **cache:** Added cache.js to distributed files to fix missing module error

**What's Changed:**
• Fixes "module not found" error when installing from npm

---

## [9.3.0](https://github.com/yowainwright/es-check/compare/9.2.0...9.3.0) (2024)

### Features
* **ESM Support:** Enhanced ESM module support with updated wrapper
* **Performance:** Added caching mechanism for improved performance
* **Node API:** Better ESM support for Node.js API usage
* **Dependencies:** Updated all dependencies to latest versions

**What's Changed:**
• Full ES Module support for modern JavaScript projects
• Faster repeated checks with new caching system

---

## [9.2.0](https://github.com/yowainwright/es-check/compare/9.1.5...9.2.0) (2024)

### Features
* **Node API:** Exposed Node.js functions for programmatic usage
* **Performance:** Added batchFiles option for processing multiple files efficiently

**What's Changed:**
• Use es-check as a Node.js library in your build tools
• Process multiple files faster with batch mode

---

## [9.1.5](https://github.com/yowainwright/es-check/compare/9.1.4...9.1.5) (2024)

**What's Changed:**
• Minor bug fixes and improvements

---

## [9.1.4](https://github.com/yowainwright/es-check/compare/9.1.3...9.1.4) (2024)

**What's Changed:**
• Performance improvements and bug fixes

---

## [9.1.3](https://github.com/yowainwright/es-check/compare/9.1.2...9.1.3) (2024)

**What's Changed:**
• Stability improvements

---

## [9.1.2](https://github.com/yowainwright/es-check/compare/9.1.1...9.1.2) (2024)

**What's Changed:**
• Bug fixes for edge cases

---

## [9.1.1](https://github.com/yowainwright/es-check/compare/9.0.0...9.1.1) (2024)

**What's Changed:**
• Fixed critical issues from 9.0.0 release

---

## [9.0.0](https://github.com/yowainwright/es-check/compare/8.0.2...9.0.0) (2024)

**What's Changed:**
• Major version bump with breaking changes
• Improved ES2022+ support

---

## [8.0.2](https://github.com/yowainwright/es-check/compare/8.0.1...8.0.2) (2023)

**What's Changed:**
• Bug fixes and stability improvements

---

## [8.0.1](https://github.com/yowainwright/es-check/compare/8.0.0...8.0.1) (2023)

**What's Changed:**
• Fixed regression from 8.0.0

---

## [8.0.0](https://github.com/yowainwright/es-check/compare/7.2.1...8.0.0) (2023)

**What's Changed:**
• Updated parser for better modern JavaScript support
• Breaking: Dropped Node.js 12 support

---

## [7.2.1](https://github.com/yowainwright/es-check/compare/7.0.0...7.2.1) (2022)

**What's Changed:**
• Fixed parsing issues with newer syntax
• Improved error messages

---

## [7.0.0](https://github.com/yowainwright/es-check/compare/6.2.1...7.0.0) (2022)

**What's Changed:**
• Major parser upgrade for ES2021 support
• Better async/await detection

---

## [6.2.1](https://github.com/yowainwright/es-check/compare/6.2.0...6.2.1) (2022)

**What's Changed:**
• Fixed false positives in ES version detection

---

## [6.2.0](https://github.com/yowainwright/es-check/compare/6.1.1...6.2.0) (2022)

**What's Changed:**
• Added ES2020 and ES2021 support
• Improved performance for large codebases

---

## [6.1.1](https://github.com/yowainwright/es-check/compare/6.1.0...6.1.1) (2021)

**What's Changed:**
• Fixed compatibility issues with certain build tools

---

## [6.1.0](https://github.com/yowainwright/es-check/compare/6.0.0...6.1.0) (2021)

**What's Changed:**
• Added support for optional chaining and nullish coalescing
• Better TypeScript compiled code detection

---

## [6.0.0](https://github.com/yowainwright/es-check/compare/5.2.4...6.0.0) (2021)

**What's Changed:**
• Major Acorn parser upgrade for modern JavaScript features
• Breaking: Changed CLI options format

---

## [5.2.4](https://github.com/yowainwright/es-check/compare/5.2.3...5.2.4) (2021-06-27)

### Bug Fixes

* default config.not to empty array before concatenation ([833dc99](https://github.com/yowainwright/es-check/commit/833dc99a440b30b60b2789ce0313f7a469acace5)), closes [yowainwright/es-check#58](https://github.com/yowainwright/es-check/issues/58)
* fixes test for hash-bang ([4269ee0](https://github.com/yowainwright/es-check/commit/4269ee08093d4fa010267916686813b07f21fdc2))
* improve variable names ([b33fef9](https://github.com/yowainwright/es-check/commit/b33fef9ca91a53d84764ade3292e86ab3b16bef1))
* init, [@yowainwright](https://github.com/yowainwright) codeowner ([6e2195e](https://github.com/yowainwright/es-check/commit/6e2195ec06a5598388ba7c06dacf3d44f6afd03f))
* init, [@yowainwright](https://github.com/yowainwright) codeowner ([5a00393](https://github.com/yowainwright/es-check/commit/5a003936b7206f0daf2b6cde4623771ff89abd1d))
* logger for a successful ES-Check run changed from error log to info log ([96f0d9c](https://github.com/yowainwright/es-check/commit/96f0d9cec36e198a5e5160d449a51f48d0d2a08a))
* misspelling in image ([8116ac9](https://github.com/yowainwright/es-check/commit/8116ac9ae2c86b6b288819ef94a94d7bfce3f259))
* not fix; thanks [@noah-potter](https://github.com/noah-potter) ([ef934c3](https://github.com/yowainwright/es-check/commit/ef934c34d0f8513a48ec91e1a18ef92dd47cff14))
* re-adds new es versions ([9f64841](https://github.com/yowainwright/es-check/commit/9f648412fa474c1a40af1c3e3f99884b97a263dd))
* removes backages + circleci ([b9852f9](https://github.com/yowainwright/es-check/commit/b9852f914ec18345f013444dc5dde2891b9efd64))
* switch workflow to yarn ([ad3288f](https://github.com/yowainwright/es-check/commit/ad3288f774b3098bf582a1a3d3127b508613e2ce))
* switch workflow to yarn ([6df8c2a](https://github.com/yowainwright/es-check/commit/6df8c2a161c241e0c1a42a8f2fcf8653e1281602))
* updates eslint ([56439bb](https://github.com/yowainwright/es-check/commit/56439bbe79295f6e9a14fee6fc0761740b3738f2))
* updates linting ([83aaae9](https://github.com/yowainwright/es-check/commit/83aaae9f36d2f24ed2387246cc676254247d3396))
* updates node v ([39b7481](https://github.com/yowainwright/es-check/commit/39b748178668f81020e3e30cf3d601dd70ce02a6))
* updates readme h1 ([43bb791](https://github.com/yowainwright/es-check/commit/43bb791515c5d20bef4a6c7e8177aa2642bb54bf))
* updates spelling in comment ([9100ed7](https://github.com/yowainwright/es-check/commit/9100ed725a57255cee40f3e2d6fea0e903335ca0))

### Features

* adds es version checks + notes ([d909f54](https://github.com/yowainwright/es-check/commit/d909f5408d96f4d598e4169895768835a056ad0f))
* adds husky, commitlint ([73f05cc](https://github.com/yowainwright/es-check/commit/73f05ccad6137c5beb2ec32563b7de4be001b3d3))
* bump version ([#124](https://github.com/yowainwright/es-check/issues/124)) ([8f07cae](https://github.com/yowainwright/es-check/commit/8f07caead14a545bbf19e9f75607e9ea7dd359cf))

**What's Changed:**
• Fixed file exclusion with the 'not' option
• Support for files starting with hashbang (#!/usr/bin/env node)
• Added support for newer ES versions
• Better logging - success messages now use info instead of error level



# [5.1.0](https://github.com/yowainwright/es-check/compare/5.0.0...5.1.0) (2019-11-13)

### Features

* **index:** Add not option to filter files ([#104](https://github.com/yowainwright/es-check/issues/104)) ([f709c3b](https://github.com/yowainwright/es-check/commit/f709c3b94749f065586843c482880e26ea66f5de))

**What's Changed:**
• New 'not' option to exclude files from checking



# [5.0.0](https://github.com/yowainwright/es-check/compare/4.0.0...5.0.0) (2018-11-20)

### Features

* Update Caporal.js, exit without files, options as flags ([#75](https://github.com/yowainwright/es-check/issues/75)) ([6ea433c](https://github.com/yowainwright/es-check/commit/6ea433cf833fd012d6b46e257cc03d4defe9d677))

**What's Changed:**
• Breaking: Options now use flags instead of arguments
• Tool exits properly when no files are found



# [4.0.0](https://github.com/yowainwright/es-check/compare/3.0.0...4.0.0) (2018-09-13)

### Bug Fixes

* exit on an invalid es version ([#67](https://github.com/yowainwright/es-check/issues/67)) ([37bf919](https://github.com/yowainwright/es-check/commit/37bf9191c3a1d5eac72848df6a807228089c5df1))

**What's Changed:**
• Breaking: Tool now exits with error on invalid ES version



# [3.0.0](https://github.com/yowainwright/es-check/compare/2.3.0...3.0.0) (2018-09-10)

### Bug Fixes

* should exit with an error if no files were checked ([#58](https://github.com/yowainwright/es-check/issues/58)) ([8e8d61f](https://github.com/yowainwright/es-check/commit/8e8d61f720c2633016ed74c0d2d55a221a2b8db6))

### Features

* support files that start with hash bang ([#62](https://github.com/yowainwright/es-check/issues/62)) ([06b412c](https://github.com/yowainwright/es-check/commit/06b412c1aade76e8fbc04e47a6d31b5abff56f60))

**What's Changed:**
• Support for executable JavaScript files with shebang (#!/usr/bin/env node)
• Breaking: Exits with error when no files match the glob pattern



# [2.3.0](https://github.com/yowainwright/es-check/compare/2.2.0...2.3.0) (2018-09-09)

### Features

* log version, module, and files ([#59](https://github.com/yowainwright/es-check/issues/59)) ([3de6d31](https://github.com/yowainwright/es-check/commit/3de6d31840efb8332d4b60b63b466f81dc81b213))

**What's Changed:**
• Better logging shows ES version, module type, and files being checked



# [2.2.0](https://github.com/yowainwright/es-check/compare/2.1.0...2.2.0) (2018-09-04)

**What's Changed:**
• Performance improvements and bug fixes



# [2.1.0](https://github.com/yowainwright/es-check/compare/270ed6ca82859495cf9f134cb2c8783f14e0b8cc...2.1.0) (2018-08-02)

### Bug Fixes

* **package:** update acorn to version 5.6.0 ([#45](https://github.com/yowainwright/es-check/issues/45)) ([90d1ae7](https://github.com/yowainwright/es-check/commit/90d1ae7fc752de0f3a4e2eff281db7d730becf62))
* **package:** update acorn to version 5.7.0 ([#47](https://github.com/yowainwright/es-check/issues/47)) ([3826159](https://github.com/yowainwright/es-check/commit/3826159a6059d33623feb7d88fc77c42ff7c2948))
* **package:** update caporal to version 0.10.0 ([#37](https://github.com/yowainwright/es-check/issues/37)) ([f3e0f52](https://github.com/yowainwright/es-check/commit/f3e0f528a12ddb97c21a25a0fbb0e701695666ef))
* **package:** update caporal to version 0.8.0 ([#17](https://github.com/yowainwright/es-check/issues/17)) ([270ed6c](https://github.com/yowainwright/es-check/commit/270ed6ca82859495cf9f134cb2c8783f14e0b8cc))
* **package:** update caporal to version 0.9.0 ([#33](https://github.com/yowainwright/es-check/issues/33)) ([300c0d5](https://github.com/yowainwright/es-check/commit/300c0d5e7b92b7e8b48d5cd07200a7e0d99b0385))

**What's Changed:**
• Updated parser for better JavaScript compatibility
• Improved CLI framework



## [test-version] (2024)
