export type RuleMessageData = Record<string, string | number | boolean | bigint | null | undefined>;

export type UntypedNode = Record<string, unknown>;

export type ASTNode = UntypedNode & {
  type?: string;
};

export interface RuleReport {
  node: unknown;
  messageId: string;
  data?: RuleMessageData;
}

export interface RuleContext {
  options?: unknown[];
  cwd?: string;
  filename?: string;
  sourceCode?: {
    text?: string;
  };
  getCwd?: () => string;
  getFilename?: () => string;
  report(report: RuleReport): void;
}

export type RuleListener = Record<string, ((node: ASTNode) => void) | undefined>;

export type RuleCreator = (context: RuleContext) => RuleListener;

export interface RuleMeta {
  type: "problem" | "suggestion" | "layout";
  docs?: {
    description?: string;
    recommended?: boolean;
  };
  schema?: unknown;
  messages: Record<string, string>;
}

export interface RuleModule {
  meta: RuleMeta;
  create: RuleCreator;
}

export interface OxlintPlugin {
  rules: Record<string, RuleModule>;
}

export type MethodNameSet = Set<string>;

export interface CallExpressionShape {
  callee?: {
    type?: string;
    property?: {
      type?: string;
      name?: string;
    };
  };
  arguments?: unknown[];
}

export interface FunctionShape {
  type?: string;
  body?: unknown;
}

export interface NodeWithArgument {
  argument?: unknown;
}

export interface NodeWithArguments {
  arguments?: unknown[];
}

export interface NodeWithBody {
  body?: unknown;
}

export interface NodeWithInit {
  init?: unknown;
}

export interface NodeWithRight {
  right?: unknown;
}

export interface NodeWithTest {
  test?: unknown;
}
