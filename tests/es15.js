// ES15 / ES2024 Features

// String.prototype.isWellFormed()
const wellFormedString = 'Hello, World!';
const malformedString = '\uD800';
const isWellFormed1 = wellFormedString.isWellFormed();
const isWellFormed2 = malformedString.isWellFormed();

// String.prototype.toWellFormed()
const correctedString = malformedString.toWellFormed();

// Additional ES2024 features for testing
const testArray = [1, 2, 3, 4, 5];
const testFindLast = testArray.findLast(x => x > 3);
const testArrayAt = testArray.at(-1);

console.log({
  isWellFormed1,
  isWellFormed2,
  correctedString
});
