"use strict";

const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const fg = require("fast-glob");
const { createLogger } = require("../lib/helpers/logger");

const verbose = process.env.VERBOSE === "true" || process.env.DEBUG === "true";
const defaultLogger = createLogger({ verbose });

function createUniqueConfigFile(config, testName) {
  const hash = crypto
    .createHash("md5")
    .update(testName)
    .digest("hex")
    .substring(0, 8);
  const configFileName = `.escheckrc.${hash}`;
  fs.writeFileSync(configFileName, JSON.stringify(config));
  return configFileName;
}

function removeConfigFile(configFileName) {
  if (fs.existsSync(configFileName)) {
    fs.unlinkSync(configFileName);
  }
}

async function expandGlobs(args) {
  const expanded = await Promise.all(
    args.map(async (arg) => {
      if (typeof arg === "string" && (arg.includes("*") || arg.includes("?"))) {
        const matches = await fg(arg, { onlyFiles: true });
        return matches.length > 0 ? matches : [arg];
      }
      return arg;
    }),
  );
  return expanded.flat();
}

function execFileWithGlob(file, args, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  expandGlobs(args)
    .then((expandedArgs) => {
      execFile(file, expandedArgs, options, callback);
    })
    .catch((err) => {
      callback(err, "", "");
    });
}

function execFilePromise(file, args, options = {}) {
  return new Promise((resolve) => {
    execFileWithGlob(file, args, options, (err, stdout, stderr) => {
      resolve({ err, stdout, stderr });
    });
  });
}

function assertSuccess(err, stdout, stderr, done) {
  if (err) {
    defaultLogger.error(err.stack);
    defaultLogger.error(stdout.toString());
    defaultLogger.error(stderr.toString());
    done(err);
    return false;
  }
  return true;
}

function assertFailure(err, stdout, done) {
  if (!err) {
    defaultLogger.error("Expected command to fail but it succeeded");
    done(new Error("Expected command to fail but it succeeded"));
    return false;
  }
  defaultLogger.debug(stdout);
  return true;
}

function createTempDir(basePath) {
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }
  return basePath;
}

function cleanupTempDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

function createTempFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
}

function createMockLogger(options = {}) {
  const logs = [];
  return {
    info: (msg) => logs.push({ level: "info", msg }),
    error: (msg) => logs.push({ level: "error", msg }),
    warn: (msg) => logs.push({ level: "warn", msg }),
    debug: (msg) => logs.push({ level: "debug", msg }),
    isLevelEnabled: (level) =>
      options.enabledLevels ? options.enabledLevels[level] : true,
    getLogs: () => logs,
    clear: () => (logs.length = 0),
  };
}

function createSilentLogger() {
  return {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
    isLevelEnabled: () => false,
  };
}

function createTestLogger(options = {}) {
  return createLogger({ verbose, ...options });
}

function mockFs(mockFsState) {
  const originalExistsSync = fs.existsSync;
  const originalReadFileSync = fs.readFileSync;

  const manualMockExistsSync = (path) => {
    return mockFsState.existsSyncMocks[path] !== undefined
      ? mockFsState.existsSyncMocks[path]
      : originalExistsSync(path);
  };

  const manualMockReadFileSync = (path, encoding) => {
    if (mockFsState.readFileSyncMocks[path] !== undefined) {
      return mockFsState.readFileSyncMocks[path];
    }
    return originalReadFileSync(path, encoding);
  };

  fs.existsSync = manualMockExistsSync;
  fs.readFileSync = manualMockReadFileSync;

  return {
    restore: () => {
      fs.existsSync = originalExistsSync;
      fs.readFileSync = originalReadFileSync;
    },
  };
}

function createMockFsState() {
  return {
    existsSyncMocks: {},
    readFileSyncMocks: {},
  };
}

module.exports = {
  createUniqueConfigFile,
  removeConfigFile,
  execFileWithGlob,
  execFilePromise,
  expandGlobs,
  assertSuccess,
  assertFailure,
  createTempDir,
  cleanupTempDir,
  createTempFile,
  createMockLogger,
  createSilentLogger,
  createTestLogger,
  mockFs,
  createMockFsState,
};
