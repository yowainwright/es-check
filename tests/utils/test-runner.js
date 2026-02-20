"use strict";

const { execFile } = require("child_process");
const path = require("path");
const { expandGlobs } = require("../helpers");

/**
 * Enhanced test runner utilities for ES-Check testing
 */
class TestRunner {
  constructor(options = {}) {
    this.timeout = options.timeout || 10000;
    this.verbose = options.verbose || false;
  }

  async runESCheck(esVersion, files, flags = []) {
    const args = [esVersion, ...files, ...flags];
    const result = await this.execCommand("node", ["lib/index.js", ...args]);

    return {
      success: !result.err,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.err,
    };
  }

  async runESCheckAPI(config) {
    const esCheck = require("../../lib/index.js");
    const allErrors = [];

    try {
      await esCheck(config, { isNodeAPI: true, allErrors });
      return {
        success: allErrors.length === 0,
        errors: allErrors,
      };
    } catch (err) {
      return {
        success: false,
        errors: [{ err, file: "api" }],
      };
    }
  }

  async execCommand(command, args, options = {}) {
    const expandedArgs = await expandGlobs(args);

    return new Promise((resolve) => {
      execFile(command, expandedArgs, { ...options, timeout: this.timeout }, (err, stdout, stderr) => {
        resolve({ err, stdout, stderr });
      });
    });
  }
}

module.exports = { TestRunner };