// Simple TypeScript types that Node.js strip-only mode supports
const name: string = "John";
const age: number = 30;
const isActive: boolean = true;

function greet(person: string): string {
  return `Hello, ${person}!`;
}

interface User {
  name: string;
  age: number;
}

const user: User = { name, age };

export { greet, user };