// ES13 / ES2022 Features

// Private class fields
class ExampleClass {
  #privateField = 'private value';
  
  static staticField = 'static value';
  
  // Static block
  static {
    this.staticField = 'initialized';
  }
  
  getPrivate() {
    return this.#privateField;
  }
  
  // Ergonomic brand checks
  hasPrivateField(obj) {
    return #privateField in obj;
  }
}

// Array.prototype.at()
const arr = [1, 2, 3, 4, 5];
const lastElement = arr.at(-1);

// Error cause
function throwErrorWithCause() {
  try {
    throw new Error('Original error');
  } catch (e) {
    throw new Error('Wrapped error', { cause: e });
  }
}

// Object.hasOwn()
const obj = { prop: 'value' };
const hasProperty = Object.hasOwn(obj, 'prop');

// Top-level await (only works in modules, commented out for script mode)
// await new Promise(resolve => setTimeout(resolve, 1000));

// RegExp match indices
const regex = /a+(?<Z>z)?/d;
const match = regex.exec('xaaaz');
