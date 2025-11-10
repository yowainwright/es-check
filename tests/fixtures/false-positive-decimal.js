// ES5 compatible code with ternary and decimal
// Should NOT be flagged as optional chaining
function calculate(e) {
  return e.isRemovedItem ? 0.35 : 1;
}

var result = calculate({ isRemovedItem: true });
