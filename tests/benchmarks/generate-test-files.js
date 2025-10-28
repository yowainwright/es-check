#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { mkdirSync, writeFileSync } = fs;

const numFiles = parseInt(process.argv[2], 10) || 100;
const outputDir = process.argv[3] || path.join(__dirname, "test-files");
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

// Promise.allSettled
const promises = [
  Promise.resolve(1),
  Promise.reject(new Error('error')),
  Promise.resolve(3)
];

// Nullish assignment
let x;
x ??= 42;

// Logical assignment
let y = 0;
y ||= 42;
`;

const es2024Template = `
// ES2024 features
const numbers = [1, 2, 3, 4, 5, 4, 3, 2, 1];

// Array.prototype.findLast and findLastIndex
const lastEven = numbers.findLast(x => x % 2 === 0);
const lastEvenIndex = numbers.findLastIndex(x => x % 2 === 0);

// Array.prototype.toReversed, toSorted, toSpliced, with
const originalArray = [3, 1, 4, 1, 5];
const reversedArray = originalArray.toReversed();
const sortedArray = originalArray.toSorted();
const splicedArray = originalArray.toSpliced(1, 2, 'new', 'items');
const withReplacedElement = originalArray.with(0, 'first');

// String well-formed methods
const wellFormedString = 'Hello, World!';
const malformedString = '\uD800'; // Lone surrogate
const isWellFormed = wellFormedString.isWellFormed();
const correctedString = malformedString.toWellFormed();
`;

const es2025Template = `
// ES2025 features
const items = [
  { category: 'fruit', name: 'apple' },
  { category: 'fruit', name: 'banana' },
  { category: 'vegetable', name: 'carrot' },
  { category: 'vegetable', name: 'broccoli' },
  { category: 'fruit', name: 'orange' }
];

// Array.prototype.group and groupToMap
const groupedByCategory = items.group(item => item.category);
const groupedMap = items.groupToMap(item => item.category);

// Promise.try for handling sync/async functions uniformly
function maybeAsyncFunction(shouldBeAsync) {
  if (shouldBeAsync) {
    return Promise.resolve('async result');
  } else {
    return 'sync result';
  }
}

const result1 = Promise.try(() => maybeAsyncFunction(false));
const result2 = Promise.try(() => maybeAsyncFunction(true));
`;

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function generateTestFiles() {
  console.log(`Generating ${numFiles} test files in ${outputDir}...`);

  ensureDirectoryExists(outputDir);

  const es5Count = Math.floor(numFiles * 0.3); // 30% ES5
  const es6Count = Math.floor(numFiles * 0.3); // 30% ES6
  const es2020Count = Math.floor(numFiles * 0.2); // 20% ES2020
  const es2024Count = Math.floor(numFiles * 0.1); // 10% ES2024
  const es2025Count =
    numFiles - es5Count - es6Count - es2020Count - es2024Count; // Remaining as ES2025

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
  for (let i = 0; i < es2024Count; i++) {
    const filePath = path.join(outputDir, `es2024-file-${i + 1}.js`);
    writeFileSync(filePath, es2024Template);
  }
  for (let i = 0; i < es2025Count; i++) {
    const filePath = path.join(outputDir, `es2025-file-${i + 1}.js`);
    writeFileSync(filePath, es2025Template);
  }

  console.log(
    `Generated ${es5Count} ES5, ${es6Count} ES6, ${es2020Count} ES2020, ${es2024Count} ES2024, and ${es2025Count} ES2025 files.`,
  );
}

generateTestFiles();
