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
  ArrayBufferTransfer: {
    minVersion: 17,
    example: "buffer.transfer(newByteLength)",
    astInfo: {
      nodeType: "CallExpression",
      property: "transfer",
    },
  },
  ArrayBufferTransferToFixedLength: {
    minVersion: 17,
    example: "buffer.transferToFixedLength(newByteLength)",
    astInfo: {
      nodeType: "CallExpression",
      property: "transferToFixedLength",
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
};

module.exports = { ES17_FEATURES };
