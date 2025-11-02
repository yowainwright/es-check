const { runChecks } = require("./check-runner");
const { loadConfig } = require("./config");
const { createLogger } = require("./helpers");

module.exports = {
  runChecks,
  loadConfig,
  createLogger,
};
