#!/usr/bin/env node

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { FEATURE_CORE_JS_MODULES } from "../../constants.mjs";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const coreJsModules = new Set(require("core-js-compat/modules"));
const { version: coreJsVersion } = require("core-js-compat/package.json");
const { ES_FEATURES, ES_GLOBAL_MIN_VERSION } = require("../../../lib/constants");

const featureKeys = Object.keys(ES_FEATURES);
const globalKeys = Object.keys(ES_GLOBAL_MIN_VERSION);
const allFeatureKeys = featureKeys.concat(globalKeys);
const ES_FEATURE_KEYS = new Set(allFeatureKeys);

function resolveFeature([featureName, moduleName]) {
  const isKnownFeature = ES_FEATURE_KEYS.has(featureName);
  if (!isKnownFeature) throw new Error(`Unknown es-check feature: ${featureName}`);

  const hasPolyfill = coreJsModules.has(moduleName);
  if (!hasPolyfill) {
    throw new Error(`No core-js-compat module found for ${featureName} at ${moduleName}`);
  }

  return featureName;
}

function collectFeatures() {
  const entries = Object.entries(FEATURE_CORE_JS_MODULES);
  const features = entries.map(resolveFeature);
  return features.sort();
}

function formatFeatureList(features) {
  return features.map((f) => `  "${f}",`).join("\n");
}

function generateFileContent(features, version) {
  const formatted = formatFeatureList(features);
  return `// Generated from core-js-compat ${version}; run pnpm scripts:generate:polyfills.
// Feature names are mapped explicitly in scripts/constants.mjs.
const coreJsPolyfillable = new Set([
${formatted}
]);

const POLYFILLABLE_FEATURES = coreJsPolyfillable;
const CORE_JS_POLYFILLABLE = coreJsPolyfillable;

module.exports = {
  POLYFILLABLE_FEATURES,
  CORE_JS_POLYFILLABLE,
};
`;
}

function main() {
  const features = collectFeatures();

  if (features.length === 0) {
    throw new Error("No core-js polyfillable features found");
  }

  const content = generateFileContent(features, coreJsVersion);
  const outputPath = join(__dirname, "../../../lib/constants/polyfillableFeatures.js");

  writeFileSync(outputPath, content);
}

main();
