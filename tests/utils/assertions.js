"use strict";

const assert = require("node:assert");
const { createTestLogger } = require("../helpers");

const logger = createTestLogger();

/**
 * ES-Check specific assertion utilities
 */
class ESCheckAssertions {
  static assertSuccess(result, message = "Expected command to succeed") {
    if (!result.success) {
      logger.error("Command failed:", result.error?.message || result.stderr);
      throw new Error(`${message}: ${result.error?.message || result.stderr}`);
    }
  }

  static assertFailure(result, message = "Expected command to fail") {
    if (result.success) {
      logger.error("Command unexpectedly succeeded:", result.stdout);
      throw new Error(`${message}: ${result.stdout}`);
    }
  }

  static assertOutputContains(result, expectedText, message) {
    const output = result.stdout || result.stderr || "";
    assert.ok(
      output.includes(expectedText),
      message || `Expected output to contain "${expectedText}", got: ${output}`,
    );
  }

  static assertOutputMatches(result, regex, message) {
    const output = result.stdout || result.stderr || "";
    assert.ok(
      regex.test(output),
      message || `Expected output to match ${regex}, got: ${output}`,
    );
  }

  static assertESVersionError(result, esVersion, features = []) {
    this.assertFailure(result);
    this.assertOutputContains(result, "ES version matching errors");

    if (features.length > 0) {
      features.forEach((feature) => {
        this.assertOutputContains(
          result,
          feature,
          `Expected error to mention feature: ${feature}`,
        );
      });
    }

    if (esVersion) {
      this.assertOutputContains(
        result,
        `ES${esVersion}`,
        `Expected error to mention target version ES${esVersion}`,
      );
    }
  }

  static assertESCheckPassed(result, esVersion) {
    this.assertSuccess(result);
    const versionLabel = esVersion
      ? `ES${esVersion}`
      : "the specified ES version";
    this.assertOutputContains(
      result,
      `All files are ${versionLabel} compatible`,
      "Expected success message",
    );
  }

  static assertFeatureDetected(result, features) {
    this.assertFailure(result);
    features.forEach((feature) => {
      this.assertOutputContains(
        result,
        feature,
        `Expected feature "${feature}" to be detected in error output`,
      );
    });
  }

  static assertPolyfillIgnored(result, features) {
    this.assertSuccess(result, "Expected polyfilled features to be ignored");
    features.forEach((feature) => {
      const output = result.stdout || result.stderr || "";
      assert.ok(
        !output.includes(feature),
        `Expected feature "${feature}" to be ignored due to polyfill detection`,
      );
    });
  }
}

module.exports = { ESCheckAssertions };
