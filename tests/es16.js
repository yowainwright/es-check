// ES16 / ES2025 Features (Proposed)

// Array.prototype.group()
const items = [
  { category: 'fruit', name: 'apple' },
  { category: 'fruit', name: 'banana' },
  { category: 'vegetable', name: 'carrot' },
  { category: 'vegetable', name: 'broccoli' },
  { category: 'fruit', name: 'orange' }
];

// Group items by category
const groupedByCategory = items.group(item => item.category);

// Array.prototype.groupToMap()
const groupedMap = items.groupToMap(item => item.category);

// Promise.try()
function maybeAsyncFunction(shouldBeAsync) {
  if (shouldBeAsync) {
    return Promise.resolve('async result');
  } else {
    return 'sync result';
  }
}

// Promise.try() handles both sync and async functions uniformly
const result1 = Promise.try(() => maybeAsyncFunction(false));
const result2 = Promise.try(() => maybeAsyncFunction(true));

// Duplicate named capture groups in RegExp (proposed)
// This allows the same group name to be used in different branches
// const regexWithDuplicateGroups = /(?<name>Mr\\.\\s+\\w+)|(?<name>Ms\\.\\s+\\w+)/;
// const match1 = regexWithDuplicateGroups.exec('Mr. Smith');
// const match2 = regexWithDuplicateGroups.exec('Ms. Johnson');

// Temporal API (if available - proposed for future ES versions)
// const now = Temporal.Now.instant();
// const today = Temporal.Now.plainDateISO();

console.log({
  groupedByCategory,
  groupedMap,
  result1,
  result2
});
