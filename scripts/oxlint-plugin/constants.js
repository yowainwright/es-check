export const DEFAULT_MAX_EXPRESSION_OPERATORS = 4;

export const DEFAULT_MAX_IF_OPERATORS = 0;

export const DEFAULT_MAX_TERNARY_OPERATORS = 2;

export const DEFAULT_MAX_COMPUTED_VALUE_OPERATORS = 1;

export const SKIP_KEYS = new Set(["parent", "loc", "range"]);

export const FUNCTION_NODE_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
]);

export const EXPRESSION_CONTAINER_NODE_TYPES = new Set([
  "ArrayExpression",
  "CallExpression",
  "ObjectExpression",
  "TaggedTemplateExpression",
  "TemplateLiteral",
]);

export const READABILITY_OPERATOR_NODE_TYPES = new Set([
  "ConditionalExpression",
  "LogicalExpression",
]);

export const IF_CONDITION_OPERATOR_NODE_TYPES = new Set([
  "ConditionalExpression",
  "LogicalExpression",
]);

export const COMPUTED_VALUE_OPERATOR_NODE_TYPES = new Set([
  "BinaryExpression",
  "ConditionalExpression",
  "LogicalExpression",
  "UnaryExpression",
]);

export const COMPARISON_OPERATORS = new Set([
  "!=",
  "!==",
  "<",
  "<=",
  "==",
  "===",
  ">",
  ">=",
  "in",
  "instanceof",
]);

export const LOOP_TYPES = new Set([
  "DoWhileStatement",
  "ForInStatement",
  "ForOfStatement",
  "ForStatement",
  "WhileStatement",
]);

export const SEARCH_METHODS = new Set(["filter", "find", "includes", "indexOf", "some"]);

export const ITERATION_METHODS = new Set([
  "every",
  "filter",
  "find",
  "flatMap",
  "forEach",
  "map",
  "reduce",
  "some",
]);

export const SIDE_EFFECT_FREE_ITERATION_METHODS = new Set([
  "every",
  "filter",
  "find",
  "flatMap",
  "map",
  "some",
]);

export const MUTATING_METHODS = new Set([
  "add",
  "clear",
  "copyWithin",
  "delete",
  "fill",
  "pop",
  "push",
  "reverse",
  "set",
  "shift",
  "sort",
  "splice",
  "unshift",
]);

export const ARRAY_MUTATING_METHODS = new Set([
  "copyWithin",
  "fill",
  "pop",
  "push",
  "reverse",
  "shift",
  "sort",
  "splice",
  "unshift",
]);

export const DEFAULT_EXECUTABLE_ENTRY_PATTERNS = [
  "src/index.js",
  "src/index.ts",
  "src/cli/index.js",
  "src/cli/index.ts",
];

export const DEFAULT_EXECUTABLE_RUNTIMES = ["bun", "node"];

export const DEFAULT_DIRECT_BIN_ENTRY_PATTERNS = [
  "app/*/index.js",
  "dist/cli/index.js",
  "dist/index.js",
  "src/cli/index.js",
  "src/cli/index.ts",
  "src/index.js",
  "src/index.ts",
  "*/dist/cli/index.js",
  "*/dist/index.js",
];

export const MAX_EXPRESSION_OPERATORS_META = {
  type: "suggestion",
  docs: {
    description: "Limit readable-complexity operators inside a single expression.",
    recommended: true,
  },
  schema: [
    {
      type: "object",
      properties: { max: { type: "integer", minimum: 1 } },
      additionalProperties: false,
    },
  ],
  messages: {
    tooMany:
      "Expression has {{count}} readability operators (max {{max}}). Extract named sub-expressions.",
  },
};

export const NO_QUADRATIC_PATTERNS_META = {
  type: "suggestion",
  docs: {
    description: "Flag nested loops, search-in-loop, and nested array iteration patterns.",
    recommended: true,
  },
  schema: [],
  messages: {
    nestedIteration:
      "Nested array iteration (.{{outer}}() containing .{{inner}}()) is likely O(n^2). Consider restructuring.",
    nestedLoop: "Nested loop detected. Consider using a Map or Set for lookups.",
    searchInLoop:
      "Array search method .{{method}}() inside a loop is likely O(n^2). Consider using a Map or Set.",
  },
};

export const HOIST_IF_OPERATORS_META = {
  type: "suggestion",
  docs: {
    description: "Prefer named boolean expressions before operator-heavy if statements.",
    recommended: true,
  },
  schema: [
    {
      type: "object",
      properties: { max: { type: "integer", minimum: 0 } },
      additionalProperties: false,
    },
  ],
  messages: {
    tooMany:
      "If condition has {{count}} readability operators (max {{max}}). Hoist it into a named boolean.",
  },
};

export const NO_HIDDEN_SIDE_EFFECTS_META = {
  type: "suggestion",
  docs: {
    description: "Flag side effects hidden inside expressions and side-effect-free callbacks.",
    recommended: true,
  },
  schema: [],
  messages: {
    callbackSideEffect:
      "Avoid side effects inside .{{method}}() callbacks. Extract the mutation or use a clearer control flow.",
    hiddenSideEffect:
      "Avoid side effects inside expressions. Move this mutation into its own statement.",
  },
};

export const NO_STANDALONE_ARRAY_MUTATIONS_META = {
  type: "suggestion",
  docs: {
    description: "Avoid standalone array mutations when a composable expression is clearer.",
    recommended: true,
  },
  schema: [],
  messages: {
    standaloneArrayMutation:
      "Avoid standalone .{{method}}() array mutation. Prefer a returned array expression or a named helper.",
  },
};

export const NO_COMPUTED_VALUES_META = {
  type: "suggestion",
  docs: {
    description:
      "Prefer named values before returning computed expressions or assigning computed object values.",
    recommended: true,
  },
  schema: [
    {
      type: "object",
      properties: { max: { type: "integer", minimum: 0 } },
      additionalProperties: false,
    },
  ],
  messages: {
    computedObjectValue:
      "Object value has {{count}} computed operators (max {{max}}). Extract it into a named value before building the object.",
    computedReturn:
      "Return value has {{count}} computed operators (max {{max}}). Extract it into a named value before returning.",
  },
};

export const PREFER_CONCAT_OBJECT_ASSIGN_META = {
  type: "suggestion",
  docs: {
    description:
      "Prefer explicit concat/Object.assign composition over array or object literal spread.",
    recommended: true,
  },
  schema: [],
  messages: {
    arraySpread: "Prefer Array#concat over array literal spread so array composition is explicit.",
    objectSpread:
      "Prefer Object.assign with an empty target over object literal spread so object composition is explicit.",
  },
};

export const NO_COMPLEX_TERNARIES_META = {
  type: "suggestion",
  docs: {
    description: "Keep ternaries simple enough to read without extracting branches.",
    recommended: true,
  },
  schema: [
    {
      type: "object",
      properties: { max: { type: "integer", minimum: 1 } },
      additionalProperties: false,
    },
  ],
  messages: {
    tooMany:
      "Ternary has {{count}} readability operators (max {{max}}). Extract named branches or use an if statement.",
    nested: "Nested ternary detected. Extract named branches or use an if statement.",
  },
};

export const REQUIRE_EXECUTABLE_SHEBANG_META = {
  type: "problem",
  docs: {
    description: "Require configured executable entry source files to start with a shebang.",
    recommended: true,
  },
  schema: [
    {
      type: "object",
      properties: {
        files: { type: "array", items: { type: "string" } },
        runtimes: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
  ],
  messages: {
    missingShebang:
      "{{file}} is configured as an executable entry source but has no Node/Bun shebang.",
  },
};

export const NO_DIRECT_NODE_BIN_SMOKE_META = {
  type: "problem",
  docs: {
    description:
      "Prefer smoke-testing installed package binaries instead of direct node entrypoint execution.",
    recommended: true,
  },
  schema: [
    {
      type: "object",
      properties: {
        entryPatterns: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
  ],
  messages: {
    directNodeBin:
      "Smoke tests should execute the installed package bin, not `node {{entry}}`, so bin shims and shebangs are exercised.",
  },
};
