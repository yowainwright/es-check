"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createTempDir, cleanupTempDir } = require("../helpers");

/**
 * Dynamic test fixture generator for ES-Check testing
 */
class FixtureGenerator {
  constructor(tempRoot = "temp-fixtures") {
    this.tempRoot = path.join(process.cwd(), tempRoot);
    this.createdFiles = new Set();
  }

  createTempFile(relativePath, content) {
    const fullPath = path.join(this.tempRoot, relativePath);
    const dir = path.dirname(fullPath);

    createTempDir(dir);
    fs.writeFileSync(fullPath, content);
    this.createdFiles.add(fullPath);

    return fullPath;
  }

  createESFile(esVersion, features = [], withPolyfills = false) {
    const hash = crypto.randomBytes(4).toString("hex");
    const filename = `es${esVersion}-${hash}.js`;

    let content = this.generateESContent(esVersion, features);

    if (withPolyfills) {
      content = this.addPolyfills(features) + "\n" + content;
    }

    return this.createTempFile(filename, content);
  }

  generateESContent(esVersion, features = []) {
    const contentMap = {
      5: "var x = 5; function test() { return x; }",
      6: "const arrow = () => {}; class Test { constructor() {} }",
      8: "async function test() { await Promise.resolve(); }",
      9: "const obj = { ...other }; async function* gen() { yield 1; }",
      11: "const result = obj?.prop ?? 'default';",
      12: "obj &&= value; class Private { #field = 1; }",
      13: "class Static { static { this.init(); } }",
    };

    let baseContent = contentMap[esVersion] || contentMap[5];

    features.forEach((feature) => {
      baseContent += "\n" + this.generateFeatureUsage(feature);
    });

    return baseContent;
  }

  generateFeatureUsage(feature) {
    const usageMap = {
      "Array.prototype.toSorted": "const sorted = [3,1,2].toSorted();",
      "Array.prototype.at": "const last = arr.at(-1);",
      "String.prototype.replaceAll": "str.replaceAll('old', 'new');",
      "Object.hasOwn": "Object.hasOwn(obj, 'prop');",
      "Promise.any": "Promise.any([p1, p2]);",
      OptionalChaining: "obj?.prop?.nested",
      NullishCoalescing: "value ?? defaultValue",
      ObjectSpread: "const merged = { ...obj1, ...obj2 };",
    };

    return usageMap[feature] || `// Using ${feature}`;
  }

  addPolyfills(features) {
    const polyfills = features
      .map((feature) => this.generatePolyfill(feature))
      .filter(Boolean)
      .join("\n");

    return polyfills;
  }

  generatePolyfill(feature) {
    const polyfillMap = {
      "Array.prototype.toSorted":
        "Array.prototype.toSorted = function() { return [...this].sort(); };",
      "Array.prototype.at":
        "Array.prototype.at = function(i) { return this[i < 0 ? this.length + i : i]; };",
      "String.prototype.replaceAll":
        "String.prototype.replaceAll = function(s, r) { return this.split(s).join(r); };",
      "Object.hasOwn":
        "Object.hasOwn = function(o, p) { return Object.prototype.hasOwnProperty.call(o, p); };",
    };

    return polyfillMap[feature];
  }

  createConfigFile(config, testName) {
    const hash = crypto
      .createHash("md5")
      .update(testName + JSON.stringify(config))
      .digest("hex")
      .substring(0, 8);

    const configPath = this.createTempFile(
      `.escheckrc.${hash}`,
      JSON.stringify(config),
    );
    return configPath;
  }

  cleanup() {
    if (fs.existsSync(this.tempRoot)) {
      cleanupTempDir(this.tempRoot);
    }
    this.createdFiles.clear();
  }
}

module.exports = { FixtureGenerator };
