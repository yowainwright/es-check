// Complex Generic Types
interface Repository<T extends { id: string }> {
  findById<K extends keyof T>(id: string): Promise<Pick<T, K>>;
  save<U extends Partial<T>>(entity: U): Promise<T>;
}

type ApiResponse<TData, TError = Error> =
  | { success: true; data: TData; error: null }
  | { success: false; data: null; error: TError };

class GenericService<T extends Record<string, any>> {
  constructor(private config: T) {}

  process<K extends keyof T, R = T[K]>(key: K): R {
    return this.config[key];
  }
}

// Conditional Types
type NonNullable<T> = T extends null | undefined ? never : T;
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;

// Mapped Types
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Template Literal Types
type EventName<T extends string> = `on${Capitalize<T>}`;
type Handler<T> = (event: T) => void;

const service = new GenericService({ name: 'test', value: 42 });
const result = service.process('name');