#!/usr/bin/env node

"use strict";

const pkg = require("../../package.json");
const { loadConfig, runChecks, createLogger } = require("../index");
const { JS_VERSIONS } = require("../constants/es");
const { SUPPORTED_SHELLS, COMPLETION_OPTIONS } = require("./constants");
const {
  parseArgs,
  showHelp,
  showVersion,
  buildConfig,
  warnAboutIgnoreFile,
  getCompletionScript,
} = require("./utils");

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

function handleCompletionCommand(shell) {
  const logger = createLogger();

  const isSupportedShell = SUPPORTED_SHELLS.includes(shell);

  if (!isSupportedShell) {
    logger.error(
      `Shell "${shell}" not supported for completion. Supported shells: ${SUPPORTED_SHELLS.join(", ")}`,
    );
    process.exit(1);
  }

  const commands = ["completion"];
  const options = COMPLETION_OPTIONS;

  const completionScript = getCompletionScript(shell, commands, options);

  logger.info(completionScript);
}

async function handleMainCommand(ecmaVersionArg, filesArg, options) {
  const logger = createLogger(options);

  const hasBothFilesInputs = filesArg?.length > 0 && options.files;
  if (hasBothFilesInputs) {
    logger.error("Cannot pass in both [files...] argument and --files flag at the same time!");
    process.exit(1);
  }

  const validEcmaVersionValues = new Set(JS_VERSIONS);
  const isCheckBrowser = options.checkBrowser;
  const hasEcmaVersion = ecmaVersionArg !== undefined;
  const isInvalidEcmaVersion = hasEcmaVersion && !validEcmaVersionValues.has(ecmaVersionArg);
  const shouldTreatAsFile = isCheckBrowser && isInvalidEcmaVersion;

  let adjustedEcmaVersion = ecmaVersionArg;
  let adjustedFiles = filesArg;

  if (shouldTreatAsFile) {
    adjustedFiles = [ecmaVersionArg].concat(filesArg);
    adjustedEcmaVersion = "checkBrowser";
  }

  const configs = await loadConfig(options.config);
  const baseConfig = configs[0] || {};

  const hasCommandLineArgs = adjustedEcmaVersion || adjustedFiles?.length || options.files;

  if (hasCommandLineArgs) {
    const ignoreFilePath = options.ignoreFile || options["ignore-file"];
    warnAboutIgnoreFile(ignoreFilePath, logger);

    const singleConfig = buildConfig(adjustedEcmaVersion, adjustedFiles, options, baseConfig);
    return runChecks([singleConfig], logger);
  }

  const hasNoConfigs = configs.length === 0;
  if (hasNoConfigs) {
    logger.error("No configuration found. Please provide command line arguments or a config file.");
    process.exit(1);
  }

  return runChecks(configs, logger);
}
