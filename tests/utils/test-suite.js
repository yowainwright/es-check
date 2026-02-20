"use strict";

const { TestRunner } = require("./test-runner");
const { ESCheckAssertions } = require("./assertions");
const { FixtureGenerator } = require("./fixtures");

/**
 * Comprehensive test suite builder for ES-Check
 */
class TestSuite {
  constructor(options = {}) {
    this.runner = new TestRunner(options);
    this.fixtures = new FixtureGenerator();
    this.assertions = ESCheckAssertions;
  }

  async testESVersionCompatibility(esVersion, features = [], shouldPass = true) {
    const testFile = this.fixtures.createESFile(esVersion, features);
    const result = await this.runner.runESCheck(`es${esVersion}`, [testFile]);

    if (shouldPass) {
      this.assertions.assertESCheckPassed(result, esVersion);
    } else {
      this.assertions.assertESVersionError(result, esVersion, features);
    }

    return result;
  }

  async testPolyfillDetection(esVersion, features, polyfills = []) {
    const testFile = this.fixtures.createESFile(esVersion, features, true);
    const result = await this.runner.runESCheck(`es${esVersion}`, [testFile], ["--checkForPolyfills"]);

    this.assertions.assertPolyfillIgnored(result, polyfills);
    return result;
  }

  async testBrowserslistIntegration(browserQuery, features = [], shouldPass = true) {
    const testFile = this.fixtures.createESFile(11, features);
    const result = await this.runner.runESCheck("checkBrowser", [testFile], [
      "--browserslistQuery",
      browserQuery,
    ]);

    if (shouldPass) {
      this.assertions.assertSuccess(result);
    } else {
      this.assertions.assertFailure(result);
    }

    return result;
  }

  async testFeatureDetection(targetES, modernFeatures = []) {
    const testFile = this.fixtures.createESFile(13, modernFeatures);
    const result = await this.runner.runESCheck(`es${targetES}`, [testFile], ["--checkFeatures"]);

    if (targetES >= 13) {
      this.assertions.assertSuccess(result);
    } else {
      this.assertions.assertFeatureDetected(result, modernFeatures);
    }

    return result;
  }

  async testIgnorePolyfillable(esVersion, features, library = "core-js") {
    const testFile = this.fixtures.createESFile(esVersion, features);
    const result = await this.runner.runESCheck(`es${esVersion}`, [testFile], [
      "--checkFeatures",
      "--ignorePolyfillable",
      library,
    ]);

    this.assertions.assertSuccess(result);
    return result;
  }

  cleanup() {
    this.fixtures.cleanup();
  }
}

module.exports = { TestSuite };