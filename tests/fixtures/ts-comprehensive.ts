// Comprehensive TypeScript feature demonstration

// 1. Interfaces with optional properties
interface Config {
  name: string;
  version?: string;
  features: string[];
}

// 2. Type aliases and unions
type Status = 'active' | 'inactive' | 'pending';
type Result<T> = { success: true; data: T } | { success: false; error: string };

// 3. Enums
enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3
}

// 4. Generic classes with constraints
class Container<T extends { toString(): string }> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  getFirst(): T | undefined {
    return this.items[0];
  }

  getAllAsStrings(): string[] {
    return this.items.map(item => item.toString());
  }
}

// 5. Functions with generics and type parameters
function processData<T, U>(
  input: T,
  transformer: (value: T) => U
): U {
  return transformer(input);
}

// 6. Class with access modifiers and type annotations
class Service {
  constructor(
    private readonly config: Config,
    public status: Status = 'inactive'
  ) {}

  async initialize(): Promise<boolean> {
    this.status = 'active';
    return true;
  }

  getConfig(): Config {
    return { ...this.config };
  }
}

// 7. Type assertions and non-null assertions
function parseJSON(text: string): any {
  const result = JSON.parse(text);
  return result as Record<string, any>;
}

function getProperty(obj: any, key: string): string {
  return obj[key]!;
}

// 8. Namespace (if supported)
namespace Utils {
  export function formatString(value: string): string {
    return value.trim().toLowerCase();
  }
}

// 9. Usage - actual JavaScript implementation
const config: Config = {
  name: 'MyApp',
  version: '1.0.0',
  features: ['auth', 'logging']
};

const service = new Service(config, 'pending');
const container = new Container<{ name: string; toString(): string }>();

container.add({
  name: 'test',
  toString() { return this.name; }
});

const result = processData(42, (x: number) => x.toString());
const data = parseJSON('{"test": true}');

// Initialize service
service.initialize().then(success => {
  if (success) {
    console.log('Service initialized');
    console.log('Config:', service.getConfig());
    console.log('Container items:', container.getAllAsStrings());
    console.log('Processed result:', result);
  }
});

export { Config, Service, Container };