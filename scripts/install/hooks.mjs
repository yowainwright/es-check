#!/usr/bin/env node

import { writeFileSync, chmodSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const hooksDir = join(__dirname, "..", "..", ".git", "hooks");

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

const { readFileSync } = require('fs');

const commitMsgFile = process.argv[2];
const message = readFileSync(commitMsgFile, 'utf8').trim();

const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];

const pattern = /^(\\w+)(\\([\\w-]+\\))?!?: .+$/;

const match = message.match(pattern);

if (!match) {
  console.error('\\x1b[31m✗ Invalid commit message format\\x1b[0m');
  console.error('');
  console.error('Expected format: type(scope): description');
  console.error('Examples:');
  console.error('  feat: add new feature');
  console.error('  fix(cli): resolve parsing issue');
  console.error('  chore: update dependencies');
  console.error('');
  console.error(\`Valid types: \${types.join(', ')}\`);
  process.exit(1);
}

const type = match[1];

if (!types.includes(type)) {
  console.error(\`\\x1b[31m✗ Invalid commit type: "\${type}"\\x1b[0m\`);
  console.error(\`Valid types: \${types.join(', ')}\`);
  process.exit(1);
}

const colonIndex = message.indexOf(': ');
if (colonIndex !== -1) {
  const description = message.slice(colonIndex + 2);
  const firstChar = description[0];
  if (firstChar && firstChar !== firstChar.toLowerCase()) {
    console.error('\\x1b[31m✗ Description must start with lowercase\\x1b[0m');
    console.error(\`Got: "\${description}"\`);
    process.exit(1);
  }
}

console.log('\\x1b[32m✓ Commit message valid\\x1b[0m');
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
