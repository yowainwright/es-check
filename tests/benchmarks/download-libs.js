#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");
const { POPULAR_LIBRARIES, LIBRARY_URLS } = require("./constants");

const outputDir = path.join(__dirname, "real-libs");

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function handleResponse(response, file, destPath, url, resolve, reject) {
  const isRedirect = response.statusCode === 302 || response.statusCode === 301;

  if (isRedirect) {
    file.close();
    fs.unlinkSync(destPath);
    return downloadFile(response.headers.location, destPath)
      .then(resolve)
      .catch(reject);
  }

  const isSuccess = response.statusCode === 200;

  if (!isSuccess) {
    reject(
      new Error(
        `Failed to download ${url}: Status ${response.statusCode}`,
      ),
    );
    return;
  }

  response.pipe(file);

  file.on("finish", () => {
    file.close();
    resolve();
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    https
      .get(url, (response) => handleResponse(response, file, destPath, url, resolve, reject))
      .on("error", (err) => {
        fs.unlinkSync(destPath);
        reject(err);
      });

    file.on("error", (err) => {
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function downloadLibraries() {
  console.log(
    `Downloading real-world libraries from unpkg to ${outputDir}...\n`,
  );

  ensureDirectoryExists(outputDir);

  for (const lib of POPULAR_LIBRARIES) {
    const url = LIBRARY_URLS[lib];
    const hasUrl = Boolean(url);

    if (!hasUrl) {
      console.warn(`  ${lib}: No URL configured, skipping`);
      continue;
    }

    const fileName = `${lib}.js`;
    const destPath = path.join(outputDir, fileName);

    try {
      process.stdout.write(`  ${lib}: downloading... `);
      await downloadFile(url, destPath);
      const stats = fs.statSync(destPath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      console.log(`✓ (${fileSizeKB} KB)`);
    } catch (error) {
      console.log(`✗ ${error.message}`);
    }
  }

  console.log("\nDownload complete!");
  console.log(
    `\nRun benchmarks with: node tests/benchmarks/compare-tools.js 3 tests/benchmarks/real-libs`,
  );
}

downloadLibraries().catch((error) => {
  console.error("Error downloading libraries:", error);
  process.exit(1);
});
