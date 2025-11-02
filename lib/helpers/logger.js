const util = require("util");

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const COLORS = {
  error: "\x1b[31m",
  warn: "\x1b[33m",
  info: "\x1b[36m",
  debug: "\x1b[90m",
  reset: "\x1b[0m",
};

function supportsColor(stream = process.stdout) {
  const hasNativeSupport = typeof stream.hasColors === "function";
  if (hasNativeSupport) {
    return stream.hasColors();
  }

  const isTTY = stream.isTTY;
  const colorsDisabled =
    process.env.NO_COLOR || process.env.NODE_DISABLE_COLORS;
  const colorsForced = process.env.FORCE_COLOR;

  if (!isTTY) return false;
  if (colorsDisabled) return false;
  if (colorsForced) return true;

  return true;
}

function createLogger(options = {}) {
  const noColor = options.noColor || options["no-color"];
  const silent = options.silent || false;
  const useColors = supportsColor(process.stdout) && !noColor;

  let level = "info";
  if (options.verbose) {
    level = "debug";
  } else if (options.quiet) {
    level = "warn";
  }

  const currentLevel = LEVELS[level];

  const log = (logLevel, ...args) => {
    const shouldLog = !silent && LEVELS[logLevel] <= currentLevel;
    if (!shouldLog) return;

    const message = args
      .map((arg) =>
        typeof arg === "string" ? arg : util.inspect(arg, { depth: null }),
      )
      .join(" ");

    const isErrorLevel = logLevel === "error" || logLevel === "warn";
    const stream = isErrorLevel ? process.stderr : process.stdout;

    const hasColor = useColors && COLORS[logLevel];
    const coloredMessage = hasColor
      ? `${COLORS[logLevel]}${logLevel}: ${message}${COLORS.reset}`
      : `${logLevel}: ${message}`;

    stream.write(coloredMessage + "\n");
  };

  return {
    error: (...args) => log("error", ...args),
    warn: (...args) => log("warn", ...args),
    info: (...args) => log("info", ...args),
    debug: (...args) => log("debug", ...args),
    isLevelEnabled: (checkLevel) => {
      const hasLevel = LEVELS[checkLevel] !== undefined;
      if (!hasLevel) return false;
      return LEVELS[checkLevel] <= currentLevel;
    },
  };
}

function determineLogLevel(logger) {
  const hasLogger = logger !== null && logger !== undefined;
  const hasIsLevelEnabled =
    hasLogger && typeof logger.isLevelEnabled === "function";

  if (!hasIsLevelEnabled) return null;

  return {
    isDebug: logger.isLevelEnabled("debug"),
    isWarn: logger.isLevelEnabled("warn"),
    isInfo: logger.isLevelEnabled("info"),
    isError: logger.isLevelEnabled("error"),
  };
}

module.exports = {
  supportsColor,
  createLogger,
  determineLogLevel,
};
