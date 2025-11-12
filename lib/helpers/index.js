const logger = require("./logger");
const parsers = require("./parsers");
const ast = require("./ast");
const files = require("./files");
const cli = require("../cli/utils");
const sourcemap = require("./sourcemap");

const detectFeaturesModule = require("../detectFeatures");

module.exports = Object.assign(
  {},
  logger,
  parsers,
  ast,
  files,
  cli,
  sourcemap,
  {
    detectFeatures: detectFeaturesModule,
    polyfillDetector: {
      detectPolyfills: detectFeaturesModule.detectPolyfills,
      filterPolyfilled: detectFeaturesModule.filterPolyfilled,
    },
  },
);
