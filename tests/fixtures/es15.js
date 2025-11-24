const wellFormedString = "Hello, World!";
const malformedString = "\uD800";
const isWellFormed1 = wellFormedString.isWellFormed();
const isWellFormed2 = malformedString.isWellFormed();

const correctedString = malformedString.toWellFormed();

const { promise, resolve, reject } = Promise.withResolvers();
setTimeout(() => resolve("resolved"), 100);

const items = [
  { category: "fruit", name: "apple" },
  { category: "fruit", name: "banana" },
  { category: "vegetable", name: "carrot" },
];
const groupedByCategory = Object.groupBy(items, (item) => item.category);

const groupedMap = Map.groupBy(items, (item) => item.category);

const sab = new SharedArrayBuffer(16);
const int32 = new Int32Array(sab);
const waitResult = Atomics.waitAsync(int32, 0, 0);
