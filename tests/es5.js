function test() {
	var afunc = function() {};
	afunc();
	function bfunc() {}
	bfunc();
}
window.getElementById('test');
test();
