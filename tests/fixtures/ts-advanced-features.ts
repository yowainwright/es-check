// Advanced TypeScript Features
import type { ComponentType } from 'react';

// Decorators
function log(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${propertyName} with`, args);
    return method.apply(this, args);
  };
}

// Class with decorators and access modifiers
class Service {
  private readonly _config: Record<string, any>;
  protected status: 'active' | 'inactive' = 'inactive';

  constructor(config: Record<string, any>) {
    this._config = config;
  }

  @log
  public async process(data: unknown): Promise<void> {
    // Implementation
  }

  private validate(input: any): input is Record<string, any> {
    return typeof input === 'object' && input !== null;
  }
}

// Abstract class
abstract class BaseComponent<T = {}> {
  protected abstract render(): ComponentType<T>;

  public mount(): void {
    const Component = this.render();
    // Mount logic
  }
}

// Function overloads
function createArray(length: number): number[];
function createArray<T>(length: number, value: T): T[];
function createArray<T>(length: number, value?: T): T[] | number[] {
  if (value !== undefined) {
    return Array(length).fill(value);
  }
  return Array(length).fill(0);
}

// Assertion functions
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Expected string');
  }
}

// Module augmentation
declare global {
  interface Window {
    myApp: {
      version: string;
      config: Record<string, any>;
    };
  }
}

// Usage
const service = new Service({ apiUrl: 'https://api.example.com' });
const numbers = createArray(5);
const strings = createArray(3, 'hello');

let value: unknown = 'test';
assertIsString(value);
console.log(value.toUpperCase());