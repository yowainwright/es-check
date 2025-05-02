#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { mkdirSync, writeFileSync } = fs;

const numFiles = parseInt(process.argv[2], 10) || 100;
const outputDir = process.argv[3] || path.join(__dirname, 'test-files');
const es5Template = `
// ES5 compatible file
function createObject() {
  var obj = {
    name: 'example',
    value: 42,
    getValue: function() {
      return this.value;
    }
  };

  return obj;
}

var result = createObject();
var keys = [];

for (var i = 0; i < 10; i++) {
  keys.push('key_' + i);
}

function processData(data) {
  var output = '';
  for (var i = 0; i < data.length; i++) {
    output += data[i];
  }
  return output;
}
`;


const es6Template = `
// ES6+ features
const createObject = () => {
  const obj = {
    name: 'example',
    value: 42,
    getValue() {
      return this.value;
    }
  };

  return obj;
};

const result = createObject();
const keys = Array.from({ length: 10 }, (_, i) => \`key_\${i}\`);

function processData(data) {
  return data.reduce((output, item) => output + item, '');
}

// Class syntax
class Example {
  constructor(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  static create(name) {
    return new Example(name);
  }
}
`;


const es2020Template = `
// ES2020+ features
const obj = {
  name: 'example',
  value: undefined
};

// Nullish coalescing
const value = obj.value ?? 42;

// Optional chaining
const nestedValue = obj?.nested?.value;

// BigInt
const bigNumber = 1234567890123456789012345678901234567890n;

// Dynamic import (commented to avoid actual execution)
// const module = await import('./some-module.js');

// Promise.allSettled
const promises = [
  Promise.resolve(1),
  Promise.reject(new Error('error')),
  Promise.resolve(3)
];

// Commented to avoid actual execution
// const results = await Promise.allSettled(promises);

// Nullish assignment
let x;
x ??= 42;

// Logical assignment
let y = 0;
y ||= 42;
`;


function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}


function generateTestFiles() {
  console.log(`Generating ${numFiles} test files in ${outputDir}...`);

  ensureDirectoryExists(outputDir);

  const es5Count = Math.floor(numFiles * 0.4); // 40% ES5
  const es6Count = Math.floor(numFiles * 0.4); // 40% ES6
  const es2020Count = numFiles - es5Count - es6Count; // Remaining as ES2020+

  for (let i = 0; i < es5Count; i++) {
    const filePath = path.join(outputDir, `es5-file-${i + 1}.js`);
    writeFileSync(filePath, es5Template);
  }
  for (let i = 0; i < es6Count; i++) {
    const filePath = path.join(outputDir, `es6-file-${i + 1}.js`);
    writeFileSync(filePath, es6Template);
  }

  for (let i = 0; i < es2020Count; i++) {
    const filePath = path.join(outputDir, `es2020-file-${i + 1}.js`);
    writeFileSync(filePath, es2020Template);
  }

  console.log(`Generated ${es5Count} ES5 files, ${es6Count} ES6 files, and ${es2020Count} ES2020+ files.`);
}


generateTestFiles();
