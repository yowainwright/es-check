// ES16 / ES2025 Features

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


console.log({
  groupedByCategory,
  groupedMap,
  result1,
  result2
});
