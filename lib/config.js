const fs = require("fs");
const path = require("path");
const { createLogger } = require("./helpers");

function findConfigFile() {
  const searchPlaces = [".escheckrc", ".escheckrc.json"];

  const configPath = searchPlaces
    .map((place) => path.resolve(process.cwd(), place))
    .find((configPath) => fs.existsSync(configPath));

  if (configPath) return configPath;

  const pkgPath = path.resolve(process.cwd(), "package.json");
  const pkgExists = fs.existsSync(pkgPath);

  if (!pkgExists) return null;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const hasEscheckConfig = pkg.escheck !== undefined;

  return hasEscheckConfig ? pkgPath : null;
}

async function loadConfig(customConfigPath) {
  const logger = createLogger();

  try {
    const configPath = customConfigPath || findConfigFile();
    const hasNoConfig = !configPath;

    if (hasNoConfig) return [{}];

    const content = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(content);

    const isPackageJson = path.basename(configPath) === "package.json";
    const config = isPackageJson ? parsed.escheck : parsed;

    return Array.isArray(config) ? config : [config];
  } catch (err) {
    logger.error(`Error loading config: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { loadConfig };
