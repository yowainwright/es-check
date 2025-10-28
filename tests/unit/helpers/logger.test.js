const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const {
  supportsColor,
  createLogger,
  determineLogLevel,
} = require("../../../lib/helpers/logger.js");

describe("helpers/logger.js", () => {
  describe("supportsColor()", () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should use native hasColors() when available", () => {
      const mockStream = {
        hasColors: () => true,
        isTTY: false,
      };

      const result = supportsColor(mockStream);
      assert.strictEqual(result, true);
    });

    it("should fallback when hasColors() not available and stream is not TTY", () => {
      const mockStream = {
        isTTY: false,
      };

      const result = supportsColor(mockStream);
      assert.strictEqual(result, false);
    });

    it("should return false when NO_COLOR is set", () => {
      process.env.NO_COLOR = "1";
      const mockStream = {
        isTTY: true,
      };

      const result = supportsColor(mockStream);
      assert.strictEqual(result, false);
    });

    it("should return false when NODE_DISABLE_COLORS is set", () => {
      process.env.NODE_DISABLE_COLORS = "1";
      const mockStream = {
        isTTY: true,
      };

      const result = supportsColor(mockStream);
      assert.strictEqual(result, false);
    });

    it("should return true when FORCE_COLOR is set", () => {
      process.env.FORCE_COLOR = "1";
      const mockStream = {
        isTTY: true,
      };

      const result = supportsColor(mockStream);
      assert.strictEqual(result, true);
    });

    it("should return true for TTY with no color env vars", () => {
      delete process.env.NO_COLOR;
      delete process.env.NODE_DISABLE_COLORS;
      delete process.env.FORCE_COLOR;

      const mockStream = {
        isTTY: true,
      };

      const result = supportsColor(mockStream);
      assert.strictEqual(result, true);
    });

    it("should use process.stdout by default", () => {
      const result = supportsColor();
      assert.strictEqual(typeof result, "boolean");
    });
  });

  describe("createLogger()", () => {
    it("should create logger with default info level", () => {
      const logger = createLogger({});
      assert(logger);
      assert.strictEqual(typeof logger.info, "function");
      assert.strictEqual(typeof logger.error, "function");
    });

    it("should create logger with debug level when verbose is true", () => {
      const logger = createLogger({ verbose: true });
      assert(logger);
      assert.strictEqual(logger.isLevelEnabled("debug"), true);
    });

    it("should create logger with warn level when quiet is true", () => {
      const logger = createLogger({ quiet: true });
      assert(logger);
      assert.strictEqual(logger.isLevelEnabled("warn"), true);
      assert.strictEqual(logger.isLevelEnabled("info"), false);
    });

    it("should create silent logger when silent is true", () => {
      const logger = createLogger({ silent: true });
      assert(logger);
      assert.strictEqual(logger.transports[0].silent, true);
    });

    it("should respect noColor option", () => {
      const logger = createLogger({ noColor: true });
      assert(logger);
      assert.strictEqual(typeof logger.info, "function");
    });

    it("should respect no-color option", () => {
      const logger = createLogger({ "no-color": true });
      assert(logger);
      assert.strictEqual(typeof logger.info, "function");
    });
  });

  describe("determineLogLevel()", () => {
    it("should return null when logger is null", () => {
      const result = determineLogLevel(null);
      assert.strictEqual(result, null);
    });

    it("should return null when logger is undefined", () => {
      const result = determineLogLevel(undefined);
      assert.strictEqual(result, null);
    });

    it("should return null when logger has no isLevelEnabled method", () => {
      const result = determineLogLevel({});
      assert.strictEqual(result, null);
    });

    it("should return level flags for valid logger", () => {
      const mockLogger = {
        isLevelEnabled: (level) => {
          return level === "info" || level === "error";
        },
      };

      const result = determineLogLevel(mockLogger);
      assert.deepStrictEqual(result, {
        isDebug: false,
        isWarn: false,
        isInfo: true,
        isError: true,
      });
    });

    it("should work with real winston logger", () => {
      const logger = createLogger({ verbose: true });
      const result = determineLogLevel(logger);

      assert.strictEqual(typeof result, "object");
      assert.strictEqual(typeof result.isDebug, "boolean");
      assert.strictEqual(typeof result.isWarn, "boolean");
      assert.strictEqual(typeof result.isInfo, "boolean");
      assert.strictEqual(typeof result.isError, "boolean");
      assert.strictEqual(result.isDebug, true);
    });
  });
});
