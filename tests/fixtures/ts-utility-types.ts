type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;
type NonFunctionProperties<T> = Omit<T, FunctionPropertyNames<T>>;

type Head<T extends readonly any[]> = T extends readonly [any, ...any[]] ? T[0] : never;
type Tail<T extends readonly any[]> = T extends readonly [any, ...infer U] ? U : [];

type Join<T extends readonly string[], D extends string = ',') =
  T extends readonly [] ? '' :
  T extends readonly [string] ? T[0] :
  T extends readonly [string, ...infer U] ?
    U extends readonly string[] ? `${T[0]}${D}${Join<U, D>}` : never :
  never;

interface ComplexConfig {
  database: {
    host: string;
    port: number;
    ssl?: boolean;
    options?: Record<string, unknown>;
  };
  cache: {
    type: 'redis' | 'memory' | 'disk';
    ttl: number;
    maxSize?: number;
  };
  features: {
    [K in 'auth' | 'logging' | 'metrics']?: boolean;
  };
}

function createManager<
  TConfig extends ComplexConfig,
  TMethods extends Record<string, (...args: any[]) => any> = {}
>(
  config: DeepReadonly<TConfig>,
  methods?: TMethods
): {
  config: TConfig;
  execute: <K extends keyof TMethods>(
    method: K,
    ...args: Parameters<TMethods[K]>
  ) => ReturnType<TMethods[K]>;
} {
  return {
    config: config as TConfig,
    execute: (method, ...args) => {
      if (methods && method in methods) {
        return methods[method](...args);
      }
      throw new Error(`Method ${String(method)} not found`);
    }
  };
}

const config: ComplexConfig = {
  database: { host: 'localhost', port: 5432 },
  cache: { type: 'redis', ttl: 3600 },
  features: { auth: true, logging: false }
};

const manager = createManager(config, {
  connect: () => Promise.resolve('connected'),
  disconnect: () => Promise.resolve()
});

const result = manager.execute('connect');