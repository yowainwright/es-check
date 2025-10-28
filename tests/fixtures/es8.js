const test = async (a, b) => (await a) + b;
await test(1, 2);
const objValues = Object.values({ a: 1, b: 2, c: 3 });
const objEntries = Object.entries({ a: 1, b: 2, c: 3 });
const padStartStr = "abc".padStart(10, "123");
const padEndStr = "abc".padEnd(10, "123");
export { test, objValues, objEntries, padStartStr, padEndStr };
