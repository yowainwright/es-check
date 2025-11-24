const result1 = Promise.try(() => Math.random());
const result2 = Promise.try(() => Promise.resolve(42));

const regex = /(?<year>\d{4})-\d{2}|(?<year>\d{4})\/\d{2}/;
const match = regex.exec("2025-01");

const set1 = new Set([1, 2, 3]);
const set2 = new Set([3, 4, 5]);

const union = set1.union(set2);
const intersection = set1.intersection(set2);
const difference = set1.difference(set2);
const symmetricDiff = set1.symmetricDifference(set2);
const isSubset = set1.isSubsetOf(set2);
const isSuperset = set1.isSupersetOf(set2);
const isDisjoint = set1.isDisjointFrom(set2);

const float16Array = new Float16Array([1.5, 2.5, 3.5]);

const escaped = RegExp.escape("Hello (world)");
