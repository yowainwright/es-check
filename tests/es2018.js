class Test { constructor() { this.test = 'test'; } };
function test(...args) { console.log(args); };
const obj = { a: 1, b: 2, c: 3 };
const objSpread = { ...obj, d: 4 };
