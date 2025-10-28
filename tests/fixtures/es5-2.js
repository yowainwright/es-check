function test() {
  var afunc = function () {};
  afunc();
  function bfunc() {}
  bfunc();

  var char = 3;
  console.log(char);
}
test();
