// Minified code with ternary operator immediately followed by decimal without leading zero
// Should NOT be flagged as optional chaining
function calculate(e){return e.isRemovedItem?.35:1}
function another(x){return x.active?.5:.25}
