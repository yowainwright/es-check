#!/usr/bin/env node
// ES14 / ES2023 Features

// Array change by copy methods
const originalArray = [3, 1, 4, 1, 5];

// Array.prototype.toReversed()
const reversedArray = originalArray.toReversed();

// Array.prototype.toSorted()
const sortedArray = originalArray.toSorted();
const sortedWithComparator = originalArray.toSorted((a, b) => a - b);

// Array.prototype.toSpliced()
const splicedArray = originalArray.toSpliced(1, 2, "new", "items");

// Array.prototype.with()
const withReplacedElement = originalArray.with(0, "first");

// Array.prototype.findLast()
const numbers = [1, 2, 3, 4, 5, 4, 3, 2, 1];
const lastEven = numbers.findLast((x) => x % 2 === 0);

// Array.prototype.findLastIndex()
const lastEvenIndex = numbers.findLastIndex((x) => x % 2 === 0);

console.log({
  originalArray,
  reversedArray,
  sortedArray,
  sortedWithComparator,
  splicedArray,
  withReplacedElement,
  lastEven,
  lastEvenIndex,
});
