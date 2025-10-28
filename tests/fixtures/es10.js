const flatArr = [1, 2, [3, 4, [5, 6, [7, 8, [9, 10]]]]];
const flatArr2 = [1, 2, [3, 4, [5, 6, [7, 8, [9, 10]]]]];
const flatMap = [1, 2, [3, 4, [5, 6, [7, 8, [9, 10]]]]].flatMap((item) => item);
const objectFromEntries = Object.fromEntries([
  ["name", "John"],
  ["age", 30],
]);
const testTryCatch = () => {
  try {
    throw Error("error");
  } catch {
    console.log("error");
  }
};
