const {
  TYPESCRIPT_ACCESS_MODIFIERS,
  TYPESCRIPT_STOP_CHARS,
  TYPESCRIPT_NON_NULL_ASSERTION_NEXT_CHARS,
  TYPESCRIPT_STRING_QUOTES,
  TYPESCRIPT_IDENTIFIER_REGEX,
  TYPESCRIPT_WHITESPACE_REGEX,
} = require("../constants");

function stripTypeScript(code) {
  if (!code || typeof code !== 'string') {
    return code;
  }

  const chars = Array.from(code);
  const result = [];
  let i = 0;

  while (i < chars.length) {
    const char = chars[i];

    if (TYPESCRIPT_STRING_QUOTES.includes(char)) {
      const quote = char;
      result.push(char);
      i++;
      while (i < chars.length) {
        const current = chars[i];
        result.push(current);
        if (current === quote && chars[i - 1] !== '\\') {
          break;
        }
        i++;
      }
      i++;
      continue;
    }

    if (char === '/' && chars[i + 1] === '/') {
      while (i < chars.length && chars[i] !== '\n') {
        result.push(chars[i]);
        i++;
      }
      continue;
    }

    if (char === '/' && chars[i + 1] === '*') {
      result.push(char);
      result.push(chars[i + 1]);
      i += 2;
      while (i < chars.length - 1) {
        result.push(chars[i]);
        if (chars[i] === '*' && chars[i + 1] === '/') {
          result.push(chars[i + 1]);
          i += 2;
          break;
        }
        i++;
      }
      continue;
    }

    if (char === ':' && i > 0 && isTypeAnnotationContext(chars, i)) {
      result.push(' ');
      i++;
      i = skipTypeAnnotation(chars, i);
      continue;
    }

    if (char === 'a' && chars[i + 1] === 's' &&
        (i === 0 || !isIdentifierChar(chars[i - 1])) &&
        (i + 2 >= chars.length || !isIdentifierChar(chars[i + 2]))) {
      i = skipAsTypeAssertion(chars, i, result);
      continue;
    }

    const keyword = getKeywordAt(chars, i);
    if (TYPESCRIPT_ACCESS_MODIFIERS.includes(keyword)) {
      for (let j = 0; j < keyword.length; j++) {
        result.push(' ');
      }
      i += keyword.length;
      while (i < chars.length && isWhitespace(chars[i])) {
        result.push(chars[i]);
        i++;
      }
      continue;
    }

    if (['interface', 'type', 'enum', 'namespace', 'declare'].includes(keyword)) {
      i = skipTypeDeclaration(chars, i, result);
      continue;
    }

    if (char === '!' && i + 1 < chars.length &&
        TYPESCRIPT_NON_NULL_ASSERTION_NEXT_CHARS.includes(chars[i + 1])) {
      result.push(' ');
      i++;
      continue;
    }

    result.push(char);
    i++;
  }

  return result.join('');
}

function isTypeAnnotationContext(chars, colonIndex) {
  let i = colonIndex - 1;
  while (i >= 0 && isWhitespace(chars[i])) {
    i--;
  }
  return i >= 0 && (isIdentifierChar(chars[i]) || chars[i] === ')' || chars[i] === ']');
}

function skipTypeAnnotation(chars, start) {
  let i = start;
  let depth = 0;

  while (i < chars.length) {
    const char = chars[i];

    if (char === '<') depth++;
    else if (char === '>') depth--;
    else if (depth === 0 && TYPESCRIPT_STOP_CHARS.includes(char)) {
      break;
    }

    i++;
  }

  return i;
}

function skipAsTypeAssertion(chars, start, result) {
  let i = start;

  result.push(' ');
  result.push(' ');
  i += 2;

  while (i < chars.length && isWhitespace(chars[i])) {
    result.push(chars[i]);
    i++;
  }

  i = skipTypeAnnotation(chars, i);

  return i;
}

function getKeywordAt(chars, start) {
  let end = start;
  while (end < chars.length && isIdentifierChar(chars[end])) {
    end++;
  }
  return chars.slice(start, end).join('');
}

function isIdentifierChar(char) {
  return TYPESCRIPT_IDENTIFIER_REGEX.test(char);
}

function isWhitespace(char) {
  return TYPESCRIPT_WHITESPACE_REGEX.test(char);
}

function skipTypeDeclaration(chars, start, result) {
  let i = start;
  let braceDepth = 0;
  let isInBraces = false;

  while (i < chars.length) {
    const char = chars[i];

    if (char === '{') {
      braceDepth++;
      isInBraces = true;
    } else if (char === '}') {
      braceDepth--;
      if (braceDepth === 0 && isInBraces) {
        result.push(' ');
        i++;
        break;
      }
    } else if (!isInBraces && (char === ';' || char === '\n')) {
      result.push(char);
      i++;
      break;
    }

    result.push(' ');
    i++;
  }

  return i;
}

function parseCode(code, acornOpts, acorn, file, options = {}) {
  let processedCode = code;

  const isTypeScriptEnabled = options.typescript || options.ts;
  const isTypeScriptFile = file && (file.endsWith('.ts') || file.endsWith('.tsx'));

  if (isTypeScriptEnabled && isTypeScriptFile) {
    processedCode = stripTypeScript(code);
  }

  try {
    const ast = acorn.parse(processedCode, acornOpts);
    return { ast, error: null };
  } catch (err) {
    const hasLocation = err.loc && err.loc.line && err.loc.column;
    const line = hasLocation ? err.loc.line : null;
    const column = hasLocation ? err.loc.column : null;

    return {
      ast: null,
      error: {
        err,
        stack: err.stack,
        file,
        line,
        column,
      },
    };
  }
}

module.exports = {
  parseCode,
  stripTypeScript,
  isTypeAnnotationContext,
  skipTypeAnnotation,
  skipAsTypeAssertion,
  skipTypeDeclaration,
  getKeywordAt,
  isIdentifierChar,
  isWhitespace,
};
