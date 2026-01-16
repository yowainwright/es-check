#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..", "..");

const packageJson = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
);
const filesInPackage = packageJson.files || [];

function analyzeFileDependencies(filePath, visited = new Set()) {
  if (visited.has(filePath)) return [];
  visited.add(filePath);

  const dependencies = [];
  const fullPath = path.join(rootDir, filePath);

  if (!fs.existsSync(fullPath)) return dependencies;

  try {
    const content = fs.readFileSync(fullPath, "utf8");

    const requirePattern = /require\(['"`]([^'"`]+)['"`]\)/g;
    const importPattern = /(?:import|from)\s+['"`]([^'"`]+)['"`]/g;

    const patterns = [requirePattern, importPattern];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let depPath = match[1];

        if (depPath.startsWith(".")) {
          depPath = path.normalize(path.join(path.dirname(filePath), depPath));

          if (!depPath.endsWith(".js") && !depPath.endsWith(".mjs")) {
            if (fs.existsSync(path.join(rootDir, depPath + ".js"))) {
              depPath += ".js";
            } else if (fs.existsSync(path.join(rootDir, depPath + ".mjs"))) {
              depPath += ".mjs";
            }
          }

          if (fs.existsSync(path.join(rootDir, depPath))) {
            dependencies.push(depPath);
            dependencies.push(...analyzeFileDependencies(depPath, visited));
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error analyzing ${filePath}: ${error.message}`);
  }

  return [...new Set(dependencies)];
}

function findAllRequiredFiles() {
  const requiredFiles = new Set();

  if (packageJson.main) {
    requiredFiles.add(packageJson.main);
    analyzeFileDependencies(packageJson.main).forEach((dep) =>
      requiredFiles.add(dep),
    );
  }

  if (packageJson.bin) {
    for (const binPath of Object.values(packageJson.bin)) {
      const normalizedPath = binPath.replace(/^\.\//, "");
      requiredFiles.add(normalizedPath);
      analyzeFileDependencies(normalizedPath).forEach((dep) =>
        requiredFiles.add(dep),
      );
    }
  }

  if (packageJson.exports) {
    const extractExports = (exports) => {
      for (const value of Object.values(exports)) {
        if (typeof value === "string") {
          const normalizedPath = value.replace(/^\.\//, "");
          requiredFiles.add(normalizedPath);
          analyzeFileDependencies(normalizedPath).forEach((dep) =>
            requiredFiles.add(dep),
          );
        } else if (typeof value === "object" && value !== null) {
          extractExports(value);
        }
      }
    };
    extractExports(packageJson.exports);
  }

  return Array.from(requiredFiles).filter(
    (file) =>
      fs.existsSync(path.join(rootDir, file)) &&
      (file.endsWith(".js") || file.endsWith(".mjs")),
  );
}

function verifyPackageFiles() {
  console.log("🔍 Dynamically analyzing required files...\n");

  const requiredFiles = findAllRequiredFiles();
  const errors = [];
  const warnings = [];

  console.log("📦 Entry points and their dependencies:\n");

  for (const file of requiredFiles.sort()) {
    const isCovered = filesInPackage.some((pkgFile) => {
      if (pkgFile === file) return true;
      if (file.startsWith(pkgFile + "/")) return true;
      return false;
    });

    if (!isCovered) {
      errors.push(
        `❌ Required file "${file}" is missing from package.json files array`,
      );
      console.log(`❌ ${file}`);
    } else {
      console.log(`[PASS] ${file}`);
    }
  }

  console.log("\n📊 Checking for orphaned files in package.json...\n");

  for (const file of filesInPackage) {
    if (!fs.existsSync(path.join(rootDir, file))) {
      warnings.push(`⚠️  File "${file}" in package.json does not exist`);
    } else if (!requiredFiles.includes(file)) {
      console.log(
        `ℹ️  ${file} - in package.json but not detected as dependency`,
      );
    }
  }

  if (warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    warnings.forEach((w) => console.log(w));
  }

  if (errors.length > 0) {
    console.log("\n❌ Errors found:");
    errors.forEach((e) => console.log(e));

    const missingFiles = errors
      .map((e) => e.match(/"([^"]+)"/)?.[1])
      .filter(Boolean)
      .filter((f, i, arr) => arr.indexOf(f) === i);

    if (missingFiles.length > 0) {
      console.log('\n🔧 Add these to package.json "files" array:');
      console.log(JSON.stringify(missingFiles, null, 2));
    }

    process.exit(1);
  }

  testNpmPack(requiredFiles);

  console.log("\n[PASS] All dynamically detected files are properly configured!");
  console.log(`   Total required files: ${requiredFiles.length}`);
}

function testNpmPack(requiredFiles) {
  console.log("\n📦 Testing npm pack to verify files will be included...\n");

  try {
    const packOutput = execSync("npm pack --dry-run --json", {
      cwd: rootDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });

    const packData = JSON.parse(packOutput);
    const packedFiles = packData[0].files.map((f) => f.path);

    let hasError = false;
    for (const requiredFile of requiredFiles) {
      if (!packedFiles.includes(requiredFile)) {
        console.log(
          `❌ Required file "${requiredFile}" will NOT be included in npm package`,
        );
        hasError = true;
      }
    }

    if (hasError) {
      process.exit(1);
    }

    console.log("[PASS] npm pack verification passed");
  } catch (error) {
    console.log("⚠️  Could not verify with npm pack --dry-run");
  }
}

verifyPackageFiles();
