const greet = (name) => {
  return `Hello, ${name}!`;
};

class Person {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return greet(this.name);
  }
}

export default Person;
