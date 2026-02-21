#!/usr/bin/env node

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import {
  CHILD_FEATURES,
  SPECIAL_CASES,
  SEGMENT_REPLACEMENTS,
} from "../../constants.mjs";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const coreJsModules = new Set(require("core-js-compat/modules"));
const { ES_FEATURES } = require("../../../lib/constants");

const ES_FEATURE_KEYS = new Set(Object.keys(ES_FEATURES));

function toPascalCase(segment) {
  return segment
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function normalizeModule(mod) {
  return mod.replace(/^es\./, "").replace(/\.v\d+$/, "");
}

function convertSegment(segment) {
  return SEGMENT_REPLACEMENTS[segment] || toPascalCase(segment);
}

function moduleToFeatureName(mod) {
  const normalized = normalizeModule(mod);
  return normalized.split(".").map(convertSegment).join("");
}

function collectFeatures() {
  const features = new Set();

  coreJsModules.forEach((mod) => {
    if (!mod.startsWith("es.")) return;

    const special = SPECIAL_CASES[mod];
    if (special && ES_FEATURE_KEYS.has(special)) {
      features.add(special);
    }

    const derived = moduleToFeatureName(mod);
    if (ES_FEATURE_KEYS.has(derived)) {
      features.add(derived);
    }

    const children = CHILD_FEATURES[mod];
    if (children) {
      children
        .filter((c) => ES_FEATURE_KEYS.has(c))
        .forEach((c) => features.add(c));
    }
  });

  return [...features].sort();
}

function formatFeatureList(features) {
  return features.map((f) => `  "${f}",`).join("\n");
}

function generateFileContent(features) {
  const formatted = formatFeatureList(features);
  return `const coreJsPolyfillable = new Set([
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
    process.exit(1);
  }

  const content = generateFileContent(features);
  const outputPath = join(
    __dirname,
    "../../../lib/constants/polyfillableFeatures.js",
  );

  writeFileSync(outputPath, content);
}

try {
  main();
} catch (error) {
  process.exit(1);
}
