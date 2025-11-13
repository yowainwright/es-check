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
  });

  describe("createLogger()", () => {
    it("should create logger with debug level when verbose is true", () => {
      const logger = createLogger({ verbose: true });
      assert.strictEqual(logger.isLevelEnabled("debug"), true);
    });

    it("should create logger with warn level when quiet is true", () => {
      const logger = createLogger({ quiet: true });
      assert.strictEqual(logger.isLevelEnabled("warn"), true);
      assert.strictEqual(logger.isLevelEnabled("info"), false);
    });
  });

  describe("determineLogLevel()", () => {
    it("should return null for invalid loggers", () => {
      assert.strictEqual(determineLogLevel(null), null);
      assert.strictEqual(determineLogLevel(undefined), null);
      assert.strictEqual(determineLogLevel({}), null);
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
  });
});
