#!/usr/bin/env node

import { writeFileSync, chmodSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const hooksDir = join(__dirname, "..", ".git", "hooks");

// Ensure hooks directory exists
if (!existsSync(hooksDir)) {
  mkdirSync(hooksDir, { recursive: true });
}

const hooks = {
  "pre-commit": `#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Running pre-commit checks...');

try {
  execSync('pnpm lint', { stdio: 'inherit' });
  execSync('pnpm format', { stdio: 'inherit' });
  execSync('pnpm test', { stdio: 'inherit' });
  console.log('✓ All pre-commit checks passed');
} catch (error) {
  console.error('✗ Pre-commit checks failed');
  process.exit(1);
}
`,
  "commit-msg": `#!/usr/bin/env node

const { execSync } = require('child_process');

const commitMsgFile = process.argv[2];

try {
  execSync(\`pnpm commit-msg \${commitMsgFile}\`, { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
`,
  "post-merge": `#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Running post-merge hook...');

try {
  execSync('pnpm install', { stdio: 'inherit' });
  console.log('✓ Dependencies updated');
} catch (error) {
  console.error('✗ Failed to update dependencies');
  process.exit(1);
}
`,
};

console.log("Installing git hooks...");

for (const [name, content] of Object.entries(hooks)) {
  const hookPath = join(hooksDir, name);
  writeFileSync(hookPath, content, "utf8");
  chmodSync(hookPath, 0o755);
  console.log(`✓ Installed ${name} hook`);
}

console.log("✓ All git hooks installed successfully");
