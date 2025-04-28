#!/usr/bin/env node

/**
 * Simple script to check node_modules packages for ES compatibility
 * Focuses on checking the main distributable file of each package
 * based on its package.json "main" field
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

/**
 * Get all packages from node_modules directory
 *
 * @param {Object} options - Options object
 * @param {string} options.nodeModulesPath - Path to node_modules directory
 * @returns {string[]} Array of package names
 */
const getAllPackages = (options) => {
  const { nodeModulesPath } = options;
  const directItems = fs.readdirSync(nodeModulesPath);

  // Get regular packages
  const regularPackages = directItems
    .filter(item => !item.startsWith('.') &&
                   fs.statSync(path.join(nodeModulesPath, item)).isDirectory() &&
                   !item.startsWith('@'))
    .map(item => item);

  // Get scoped packages
  const scopedPackages = directItems
    .filter(item => item.startsWith('@') &&
                   fs.statSync(path.join(nodeModulesPath, item)).isDirectory())
    .flatMap(scope => {
      const scopePath = path.join(nodeModulesPath, scope);
      return fs.readdirSync(scopePath)
        .filter(item => fs.statSync(path.join(scopePath, item)).isDirectory())
        .map(item => `${scope}/${item}`);
    });

  // Combine all packages
  return [...regularPackages, ...scopedPackages];
};

/**
 * Check packages for ES compatibility
 *
 * @param {Object} options - Options object
 * @param {string[]} options.packages - Array of package names to check
 * @param {string} options.nodeModulesPath - Path to node_modules directory
 * @param {string} options.esVersion - ES version to check against
 * @param {boolean} options.silent - Whether to suppress console output
 * @returns {string[]} Array of incompatible package names
 */
const checkPackagesCompatibility = (options) => {
  const { packages, nodeModulesPath, esVersion, silent = false } = options;

  if (!silent) {
    console.log(`Checking ${packages.length} packages for ${esVersion} compatibility...`);
  }

  // Check each package and collect incompatible ones
  return packages.reduce((incompatible, pkg) => {
    const packagePath = path.join(nodeModulesPath, pkg);
    const packageJsonPath = path.join(packagePath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return incompatible;
    }

    try {
      // Get the main file from package.json
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const mainFile = packageJson.main || 'index.js';

      // Resolve the main file path
      const mainFileBasePath = path.join(packagePath, mainFile);

      // Determine the correct path with .js extension if needed
      const mainFilePath = !fs.existsSync(mainFileBasePath) && !mainFileBasePath.endsWith('.js')
        ? `${mainFileBasePath}.js`
        : mainFileBasePath;

      // Skip if not a JS file or doesn't exist
      if (!fs.existsSync(mainFilePath) || !mainFilePath.endsWith('.js')) {
        return incompatible;
      }

      // Run es-check on the main file
      try {
        execFile('npx', ['es-check', esVersion, mainFilePath, '--silent'], { stdio: 'pipe' });
        if (!silent) console.log(`✅ ${pkg}`);
        return incompatible;
      } catch (error) {
        if (!silent) console.log(`❌ ${pkg} - not compatible with ${esVersion}`);
        return [...incompatible, pkg];
      }
    } catch (error) {
      // Skip packages with errors
      return incompatible;
    }
  }, []);
};

/**
 * Print results of compatibility check
 *
 * @param {Object} options - Options object
 * @param {string[]} options.incompatiblePackages - Array of incompatible package names
 * @param {string} options.esVersion - ES version checked against
 */
const printResults = (options) => {
  const { incompatiblePackages, esVersion } = options;

  if (incompatiblePackages.length > 0) {
    console.log('\nIncompatible packages:');
    incompatiblePackages.forEach(pkg => console.log(`- ${pkg}`));
  } else {
    console.log(`\nAll packages are compatible with ${esVersion}`);
  }
};

// Main execution
const main = () => {
  // Parse command line arguments
  const esVersion = process.argv[2] || 'es5';
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  const silent = process.argv.includes('--silent');

  if (!silent) {
    console.log(`Checking node_modules main files for ${esVersion} compatibility...`);
  }

  // Get all packages
  const packages = getAllPackages({ nodeModulesPath });

  if (!silent) {
    console.log(`Found ${packages.length} packages to check`);
  }

  // Check compatibility
  const incompatiblePackages = checkPackagesCompatibility({
    packages,
    nodeModulesPath,
    esVersion,
    silent
  });

  // Print results
  if (!silent) {
    printResults({ incompatiblePackages, esVersion });
  }

  // Return exit code based on results
  process.exit(incompatiblePackages.length > 0 ? 1 : 0);
};

// Run the script
main();
