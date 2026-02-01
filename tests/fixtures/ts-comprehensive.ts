interface Config {
  name: string;
  version?: string;
  features: string[];
}

type Status = 'active' | 'inactive' | 'pending';
type Result<T> = { success: true; data: T } | { success: false; error: string };

enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3
}

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

function processData<T, U>(
  input: T,
  transformer: (value: T) => U
): U {
  return transformer(input);
}

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

function parseJSON(text: string): any {
  const result = JSON.parse(text);
  return result as Record<string, any>;
}

function getProperty(obj: any, key: string): string {
  return obj[key]!;
}

namespace Utils {
  export function formatString(value: string): string {
    return value.trim().toLowerCase();
  }
}

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

service.initialize().then(success => {
  if (success) {
    console.log('Service initialized');
    console.log('Config:', service.getConfig());
    console.log('Container items:', container.getAllAsStrings());
    console.log('Processed result:', result);
  }
});

export { Config, Service, Container };