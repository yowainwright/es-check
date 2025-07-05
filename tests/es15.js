// ES15 / ES2024 Features

// String.prototype.isWellFormed() - ES2024
const wellFormedString = 'Hello, World!';
const malformedString = '\uD800'; // Lone surrogate
const isWellFormed1 = wellFormedString.isWellFormed();
const isWellFormed2 = malformedString.isWellFormed();

// String.prototype.toWellFormed() - ES2024
const correctedString = malformedString.toWellFormed();

// Add more detectable ES2024 features
const testArray = [1, 2, 3, 4, 5];
const testFindLast = testArray.findLast(x => x > 3); // This should be ES14 but will work
const testArrayAt = testArray.at(-1); // ES2022 but also works

// RegExp Unicode Set flag (v flag)
// Note: This is a syntax feature that may not be detectable in all environments
// const unicodeSetRegex = /[\p{Script=Latin}&&\p{ASCII}]/v;

// ArrayBuffer.prototype.resize() (if supported)
// const buffer = new ArrayBuffer(10, { maxByteLength: 100 });
// buffer.resize(20);

// ArrayBuffer.prototype.transfer() and transferToFixedLength()
// const buffer2 = new ArrayBuffer(10);
// const transferred = buffer2.transfer(20);

console.log({
  isWellFormed1,
  isWellFormed2,
  correctedString
});
