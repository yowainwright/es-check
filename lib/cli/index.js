#!/usr/bin/env node

"use strict";

const pkg = require("../../package.json");
const { parseArgs, showHelp, showVersion } = require("./parser");
const { handleMainCommand, handleCompletionCommand } = require("./handler");

const { options, positional } = parseArgs(process.argv);

const isVersionRequest = options.V || options.version;
if (isVersionRequest) {
  showVersion(pkg.version);
  process.exit(0);
}

const isHelpRequest = options.h || options.help;
if (isHelpRequest) {
  showHelp(pkg.version);
  process.exit(0);
}

const isCompletionCommand = positional[0] === "completion";
if (isCompletionCommand) {
  const shell = positional[1] || "bash";
  handleCompletionCommand(shell);
  process.exit(0);
}

const ecmaVersion = positional[0];
const files = positional.slice(1);

handleMainCommand(ecmaVersion, files, options);
