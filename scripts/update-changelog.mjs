#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import inquirer from "inquirer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_PATH = path.join(__dirname, "..", "CHANGELOG.md");

function runGitCommand(command) {
  try {
    return execSync(command, { encoding: "utf-8" }).trim();
  } catch (error) {
    return null;
  }
}

async function updateChangelog(version = null) {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
  );
  const targetVersion = version || packageJson.version;

  console.log(`\n📝 Changelog updater for version ${targetVersion}\n`);

  const changelogContent = fs.readFileSync(CHANGELOG_PATH, "utf8");
  if (
    changelogContent.includes(`## [${targetVersion}]`) &&
    changelogContent.includes("**What's Changed:**")
  ) {
    console.log(`✅ Version ${targetVersion} already has a changelog summary.`);
    return;
  }

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Would you like to update the changelog now?",
      choices: [
        { name: "Yes, update changelog now", value: "update" },
        { name: "No, add TODO and create branch for later", value: "todo" },
        { name: "Skip entirely", value: "skip" },
      ],
    },
  ]);

  if (action === "skip") {
    console.log("Skipping changelog update.");
    return;
  }

  const currentBranch = runGitCommand("git branch --show-current");
  const changelogBranch = `changelog-${targetVersion}`;

  if (action === "todo") {
    const lines = changelogContent.split("\n");
    const versionIndex = lines.findIndex((line) =>
      line.includes(`## [${targetVersion}]`),
    );

    if (versionIndex === -1) {
      console.log(`⚠️  Version ${targetVersion} not found in changelog.`);
      return;
    }

    const nextSectionIndex = lines.findIndex(
      (line, index) =>
        index > versionIndex &&
        (line.startsWith("#") || line.startsWith("---")),
    );

    const insertIndex =
      nextSectionIndex === -1 ? lines.length : nextSectionIndex;

    const todoLines = [
      "",
      "**What's Changed:**",
      "• TODO: Add user-facing changelog for this version",
      "",
    ];

    lines.splice(insertIndex, 0, ...todoLines);

    console.log(`\n🌿 Creating branch ${changelogBranch}...`);
    runGitCommand(`git checkout -b ${changelogBranch}`);

    fs.writeFileSync(CHANGELOG_PATH, lines.join("\n"));

    runGitCommand("git add CHANGELOG.md");
    runGitCommand(
      `git commit -m "chore: add TODO for changelog v${targetVersion}"`,
    );

    console.log(`\n📝 TODO added to changelog on branch ${changelogBranch}`);
    console.log(
      `   Run 'git checkout ${changelogBranch}' later to complete it.`,
    );

    runGitCommand(`git checkout ${currentBranch}`);
    return;
  }

  const { changes } = await inquirer.prompt([
    {
      type: "editor",
      name: "changes",
      message: "Enter user-focused changes (one per line):",
      validate: (input) => {
        if (!input.trim()) {
          return "Please provide at least one change";
        }
        return true;
      },
    },
  ]);

  const changesList = changes
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (changesList.length === 0) {
    console.log("No changes provided. Skipping.");
    return;
  }

  const lines = changelogContent.split("\n");
  const versionIndex = lines.findIndex((line) =>
    line.includes(`## [${targetVersion}]`),
  );

  if (versionIndex === -1) {
    console.log(`⚠️  Version ${targetVersion} not found in changelog.`);
    return;
  }

  const nextSectionIndex = lines.findIndex(
    (line, index) =>
      index > versionIndex && (line.startsWith("#") || line.startsWith("---")),
  );

  const insertIndex = nextSectionIndex === -1 ? lines.length : nextSectionIndex;

  const summaryLines = [
    "",
    "**What's Changed:**",
    ...changesList.map((change) => `• ${change}`),
    "",
  ];

  lines.splice(insertIndex, 0, ...summaryLines);

  console.log(`\n🌿 Creating branch ${changelogBranch}...`);
  runGitCommand(`git checkout -b ${changelogBranch}`);

  fs.writeFileSync(CHANGELOG_PATH, lines.join("\n"));

  runGitCommand("git add CHANGELOG.md");
  runGitCommand(`git commit -m "docs: update changelog for v${targetVersion}"`);

  console.log(`\n✅ Changelog updated on branch ${changelogBranch}!`);
  console.log(`   Create a PR with: git push -u origin ${changelogBranch}`);

  const { returnToBranch } = await inquirer.prompt([
    {
      type: "confirm",
      name: "returnToBranch",
      message: `Return to ${currentBranch}?`,
      default: true,
    },
  ]);

  if (returnToBranch) {
    runGitCommand(`git checkout ${currentBranch}`);
  }
}

const version = process.argv[2];
updateChangelog(version).catch(console.error);

export { updateChangelog };
