module.exports = {
  ...require('./logger'),
  ...require('./parsers'),
  ...require('./ast'),
  ...require('./files'),
  ...require('./cli'),
  ...require('./sourcemap'),
  detectFeatures: require('./detectFeatures'),
  polyfillDetector: require('./polyfillDetector')
};
