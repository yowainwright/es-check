const arrow = name => `Hello ${name}`;

class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
}

const { name } = { name: 'John' };
export default Person;