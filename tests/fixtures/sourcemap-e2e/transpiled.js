"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
const greet = (name) => "Hello, ".concat(name, "!");
class Person {
  constructor(name) {
    this.name = name;
  }
  greet() {
    return greet(this.name);
  }
}
var _default = (exports.default = Person);
