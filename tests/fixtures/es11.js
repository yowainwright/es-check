const bigIntTest = 1234567890123456789012345678901234567890n;
console.log(bigIntTest);
const opts = { a: { b: { c: 1 } } };
const chained = opts?.a?.b?.c;
const nullishCoalescingTest = chained ?? 'default';
