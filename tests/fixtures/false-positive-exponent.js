// ES5 compatible code with ** in string literal (markdown)
// Should NOT be flagged as exponent operator
var markdown = "**bold text**";
var anotherMarkdown = "Use ** for exponentiation";
var combined = markdown + anotherMarkdown;
