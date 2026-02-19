// ES17 (ES2026) Features

// Array.fromAsync - static method for converting async iterables to arrays
const asyncIterable = (async function* () {
  yield 1;
  yield 2;
  yield 3;
})();
const asyncArray = Array.fromAsync(asyncIterable);

// Error.isError - static method to check if value is an Error
const isError1 = Error.isError(new Error("test"));
const isError2 = Error.isError({});
const isError3 = Error.isError("not an error");

// ArrayBuffer transfer operations
const buffer = new ArrayBuffer(16);
const transferred1 = buffer.transfer(8);
const transferred2 = buffer.transferToFixedLength(32);

// Intl.DurationFormat - format duration objects
const formatter = new Intl.DurationFormat("en", { style: "long" });
const formatted = formatter.format({ hours: 1, minutes: 30, seconds: 45 });

// Additional examples with different configurations
const shortFormatter = new Intl.DurationFormat("fr", { style: "short" });
const narrowFormatter = new Intl.DurationFormat("ja", {
  style: "narrow",
  fractionalDigits: 2,
});
