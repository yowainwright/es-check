const ES17_FEATURES = {
  ArrayFromAsync: {
    minVersion: 17,
    example: "Array.fromAsync(asyncIterable)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Array",
      property: "fromAsync",
    },
  },
  ErrorIsError: {
    minVersion: 17,
    example: "Error.isError(value)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Error",
      property: "isError",
    },
  },
  MapGetOrInsert: {
    minVersion: 17,
    example: "map.getOrInsert(key, value)",
    astInfo: {
      nodeType: "CallExpression",
      property: "getOrInsert",
      requireMapReceiver: true,
    },
  },
  MapGetOrInsertComputed: {
    minVersion: 17,
    example: "map.getOrInsertComputed(key, fn)",
    astInfo: {
      nodeType: "CallExpression",
      property: "getOrInsertComputed",
      requireMapReceiver: true,
    },
  },
  IntlDurationFormat: {
    minVersion: 17,
    example: "new Intl.DurationFormat('en')",
    astInfo: {
      nodeType: "NewExpression",
      object: "Intl",
      property: "DurationFormat",
    },
  },
  IteratorConcat: {
    minVersion: 17,
    example: "Iterator.concat(first, second)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Iterator",
      property: "concat",
    },
  },
  JSONRawJSON: {
    minVersion: 17,
    example: "JSON.rawJSON(text)",
    astInfo: {
      nodeType: "CallExpression",
      object: "JSON",
      property: "rawJSON",
    },
  },
  JSONIsRawJSON: {
    minVersion: 17,
    example: "JSON.isRawJSON(value)",
    astInfo: {
      nodeType: "CallExpression",
      object: "JSON",
      property: "isRawJSON",
    },
  },
  MathSumPrecise: {
    minVersion: 17,
    example: "Math.sumPrecise(values)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Math",
      property: "sumPrecise",
    },
  },
  Uint8ArrayFromBase64: {
    minVersion: 17,
    example: "Uint8Array.fromBase64(text)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Uint8Array",
      property: "fromBase64",
    },
  },
  Uint8ArrayFromHex: {
    minVersion: 17,
    example: "Uint8Array.fromHex(text)",
    astInfo: {
      nodeType: "CallExpression",
      object: "Uint8Array",
      property: "fromHex",
    },
  },
  Uint8ArrayToBase64: {
    minVersion: 17,
    example: "bytes.toBase64()",
    astInfo: {
      nodeType: "CallExpression",
      property: "toBase64",
    },
  },
  Uint8ArrayToHex: {
    minVersion: 17,
    example: "bytes.toHex()",
    astInfo: {
      nodeType: "CallExpression",
      property: "toHex",
    },
  },
  Uint8ArraySetFromBase64: {
    minVersion: 17,
    example: "bytes.setFromBase64(text)",
    astInfo: {
      nodeType: "CallExpression",
      property: "setFromBase64",
    },
  },
  Uint8ArraySetFromHex: {
    minVersion: 17,
    example: "bytes.setFromHex(text)",
    astInfo: {
      nodeType: "CallExpression",
      property: "setFromHex",
    },
  },
};

module.exports = { ES17_FEATURES };
