const winston = require('winston');

function supportsColor(stream = process.stdout) {
  const hasNativeSupport = typeof stream.hasColors === 'function';
  if (hasNativeSupport) {
    return stream.hasColors();
  }

  const isTTY = stream.isTTY;
  const colorsDisabled = process.env.NO_COLOR || process.env.NODE_DISABLE_COLORS;
  const colorsForced = process.env.FORCE_COLOR;

  if (!isTTY) return false;
  if (colorsDisabled) return false;
  if (colorsForced) return true;

  return true;
}

function createLogger(options = {}) {
  const noColor = options.noColor || options['no-color'];
  let level = 'info';

  if (options.verbose) {
    level = 'debug';
  } else if (options.quiet) {
    level = 'warn';
  }

  return winston.createLogger({
    transports: [
      new winston.transports.Console({
        silent: options.silent || false,
        level,
        stderrLevels: ['error', 'warn'],
        format: winston.format.combine(
          ...(supportsColor(process.stdout) && !noColor ? [winston.format.colorize()] : []),
          winston.format.simple(),
        ),
      })
    ]
  });
}

function determineLogLevel(logger) {
  if (!logger || !logger.isLevelEnabled) {
    return null;
  }

  return {
    isDebug: logger.isLevelEnabled('debug'),
    isWarn: logger.isLevelEnabled('warn'),
    isInfo: logger.isLevelEnabled('info'),
    isError: logger.isLevelEnabled('error')
  };
}

module.exports = {
  supportsColor,
  createLogger,
  determineLogLevel
};
