// Test for Chrome 60 object spread support (issue #383)
function testObjectSpread(obj) {
  return { ...obj };
}

const result = testObjectSpread({ a: 1, b: 2 });
console.log(result);
