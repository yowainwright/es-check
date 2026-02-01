const greet = (name: string): string => `Hello ${name}`;
let count: number = 0;

function add(a: number, b: number): number {
  return a + b;
}

class Person {
  constructor(
    public name: string,
    private age: number,
  ) {}
}
