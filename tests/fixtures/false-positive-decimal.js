function calculate(e) {
  return e.isRemovedItem ? 0.35 : 1;
}

var result = calculate({ isRemovedItem: true });
