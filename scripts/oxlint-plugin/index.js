import {
  ARRAY_MUTATING_METHODS,
  COMPUTED_VALUE_OPERATOR_NODE_TYPES,
  COMPARISON_OPERATORS,
  DEFAULT_DIRECT_BIN_ENTRY_PATTERNS,
  DEFAULT_EXECUTABLE_ENTRY_PATTERNS,
  DEFAULT_EXECUTABLE_RUNTIMES,
  DEFAULT_MAX_COMPUTED_VALUE_OPERATORS,
  DEFAULT_MAX_EXPRESSION_OPERATORS,
  DEFAULT_MAX_IF_OPERATORS,
  DEFAULT_MAX_TERNARY_OPERATORS,
  EXPRESSION_CONTAINER_NODE_TYPES,
  FUNCTION_NODE_TYPES,
  HOIST_IF_OPERATORS_META,
  IF_CONDITION_OPERATOR_NODE_TYPES,
  ITERATION_METHODS,
  LOOP_TYPES,
  MAX_EXPRESSION_OPERATORS_META,
  MUTATING_METHODS,
  NO_DIRECT_NODE_BIN_SMOKE_META,
  NO_COMPLEX_TERNARIES_META,
  NO_COMPUTED_VALUES_META,
  NO_HIDDEN_SIDE_EFFECTS_META,
  NO_QUADRATIC_PATTERNS_META,
  NO_STANDALONE_ARRAY_MUTATIONS_META,
  PREFER_CONCAT_OBJECT_ASSIGN_META,
  READABILITY_OPERATOR_NODE_TYPES,
  SEARCH_METHODS,
  SIDE_EFFECT_FREE_ITERATION_METHODS,
  SKIP_KEYS,
  REQUIRE_EXECUTABLE_SHEBANG_META,
} from "./constants.js";

function defineRule(meta, create) {
  return { meta, create };
}

function isRecord(value) {
  const isObjectLike = !!value && typeof value === "object";
  return isObjectLike;
}

function hasType(node, type) {
  return node.type === type;
}

function isFunctionBoundary(node, root) {
  if (node === root) return false;
  return FUNCTION_NODE_TYPES.has(String(node.type));
}

function isFunctionNode(node) {
  if (!isRecord(node)) return false;
  return FUNCTION_NODE_TYPES.has(String(node.type));
}

function isJsxNode(node) {
  if (!isRecord(node)) return false;
  return String(node.type).startsWith("JSX");
}

function isExpressionContainer(node) {
  if (!isRecord(node)) return false;
  return EXPRESSION_CONTAINER_NODE_TYPES.has(String(node.type));
}

function isSkippedExpressionRoot(expression) {
  const shouldSkip =
    isFunctionNode(expression) || isExpressionContainer(expression) || isJsxNode(expression);
  return shouldSkip;
}

function getOperatorWeight(node) {
  if (READABILITY_OPERATOR_NODE_TYPES.has(String(node.type))) return 1;
  const isComparisonExpression =
    node.type === "BinaryExpression" && COMPARISON_OPERATORS.has(String(node.operator));
  if (isComparisonExpression) return 1;

  const isNegationExpression = node.type === "UnaryExpression" && node.operator === "!";
  if (isNegationExpression) return 1;
  return 0;
}

function getIfConditionOperatorWeight(node) {
  if (IF_CONDITION_OPERATOR_NODE_TYPES.has(String(node.type))) return 1;
  return 0;
}

function getComputedValueOperatorWeight(node) {
  if (COMPUTED_VALUE_OPERATOR_NODE_TYPES.has(String(node.type))) return 1;
  return 0;
}

function countChildOperators(child, root) {
  if (Array.isArray(child)) {
    return child.reduce((sum, item) => sum + countChildOperators(item, root), 0);
  }
  if (!isRecord(child)) return 0;
  return countOperatorNode(child, root);
}

function countOperatorNode(node, root) {
  if (isFunctionBoundary(node, root)) return 0;
  const isNestedContainer = node !== root && (isExpressionContainer(node) || isJsxNode(node));
  if (isNestedContainer) return 0;
  const childCount = Object.entries(node).reduce((sum, [key, child]) => {
    if (SKIP_KEYS.has(key)) return sum;
    return sum + countChildOperators(child, root);
  }, 0);
  return getOperatorWeight(node) + childCount;
}

function countIfConditionOperatorNode(node, root) {
  if (isFunctionBoundary(node, root)) return 0;
  const childCount = Object.entries(node).reduce((sum, [key, child]) => {
    if (SKIP_KEYS.has(key)) return sum;
    return sum + countIfConditionChildOperators(child, root);
  }, 0);
  return getIfConditionOperatorWeight(node) + childCount;
}

function countIfConditionChildOperators(child, root) {
  if (Array.isArray(child)) {
    return child.reduce((sum, item) => sum + countIfConditionChildOperators(item, root), 0);
  }
  if (!isRecord(child)) return 0;
  return countIfConditionOperatorNode(child, root);
}

function countComputedValueOperatorNode(node, root) {
  if (isFunctionBoundary(node, root)) return 0;
  const childCount = Object.entries(node).reduce((sum, [key, child]) => {
    if (SKIP_KEYS.has(key)) return sum;
    return sum + countComputedValueChildOperators(child, root);
  }, 0);
  return getComputedValueOperatorWeight(node) + childCount;
}

function countComputedValueChildOperators(child, root) {
  if (Array.isArray(child)) {
    return child.reduce((sum, item) => sum + countComputedValueChildOperators(item, root), 0);
  }
  if (!isRecord(child)) return 0;
  return countComputedValueOperatorNode(child, root);
}

export function countExpressionOperators(expression) {
  if (!isRecord(expression)) return 0;
  if (isSkippedExpressionRoot(expression)) return 0;
  return countOperatorNode(expression, expression);
}

export function countIfConditionOperators(expression) {
  if (!isRecord(expression)) return 0;
  return countIfConditionOperatorNode(expression, expression);
}

export function countComputedValueOperators(expression) {
  if (!isRecord(expression)) return 0;
  if (isFunctionNode(expression)) return 0;
  if (isJsxNode(expression)) return 0;
  return countComputedValueOperatorNode(expression, expression);
}

export function isMethodCall(node, methodSet) {
  if (!isRecord(node)) return false;
  if (!hasType(node, "CallExpression")) return false;
  const call = node;
  if (call.callee?.type !== "MemberExpression") return false;
  if (call.callee.property?.type !== "Identifier") return false;
  return methodSet.has(call.callee.property.name ?? "");
}

function containsCallWithin(node, methodSet, root) {
  if (isFunctionBoundary(node, root)) return false;
  if (isMethodCall(node, methodSet)) return true;
  return Object.entries(node).some(([key, child]) => {
    if (SKIP_KEYS.has(key)) return false;
    return childContainsCall(child, methodSet, root);
  });
}

function childContainsCall(child, methodSet, root) {
  if (Array.isArray(child)) {
    const childNodes = child.filter(isRecord);
    return childNodes.some((item) => containsCallWithin(item, methodSet, root));
  }
  if (!isRecord(child)) return false;
  return containsCallWithin(child, methodSet, root);
}

export function containsCallTo(node, methodSet) {
  if (!isRecord(node)) return false;
  return containsCallWithin(node, methodSet, node);
}

export function getMethodName(node) {
  const call = node;
  return call.callee?.property?.name ?? null;
}

export function getCallbackBody(node) {
  const call = node;
  const callback = call.arguments?.[0];
  if (!callback) return null;
  const isArrow = callback.type === "ArrowFunctionExpression";
  const isFunction = callback.type === "FunctionExpression";
  const isSupportedCallback = isArrow || isFunction;
  if (!isSupportedCallback) return null;
  return callback.body ?? null;
}

function getConfiguredNumber(context, key, fallback) {
  const [options] = context.options ?? [];
  if (!isRecord(options)) return fallback;
  if (typeof options[key] !== "number") return fallback;
  return options[key];
}

function getConfiguredMax(context, fallback) {
  return getConfiguredNumber(context, "max", fallback);
}

function getConfiguredStringArray(context, key, fallback) {
  const [options] = context.options ?? [];
  if (!isRecord(options)) return fallback;
  const value = options[key];
  if (!Array.isArray(value)) return fallback;
  const strings = value.filter((item) => typeof item === "string");
  return strings.length ? strings : fallback;
}

function normalizePath(path) {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

function getContextFilename(context) {
  if (typeof context.filename === "string") return context.filename;
  if (typeof context.getFilename !== "function") return "";
  try {
    return context.getFilename();
  } catch {
    return "";
  }
}

function getContextCwd(context) {
  if (typeof context.cwd === "string") return context.cwd;
  if (typeof context.getCwd !== "function") return "";
  try {
    return context.getCwd();
  } catch {
    return "";
  }
}

function getRelativeFilename(context) {
  const filename = normalizePath(getContextFilename(context));
  const cwd = normalizePath(getContextCwd(context));
  if (!filename) return "";
  if (!cwd) return filename;
  const prefix = `${cwd}/`;
  return filename.startsWith(prefix) ? filename.slice(prefix.length) : filename;
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
}

function patternToRegex(pattern) {
  const normalized = normalizePath(pattern);
  const source = escapeRegex(normalized)
    .replace(/\\\*\\\*/g, ".*")
    .replace(/\\\*/g, "[^/]*");
  return new RegExp(`(^|/)${source}$`);
}

function matchesPathPattern(path, pattern) {
  const normalizedPath = normalizePath(path);
  const normalizedPattern = normalizePath(pattern);
  if (normalizedPattern.includes("*"))
    return patternToRegex(normalizedPattern).test(normalizedPath);
  const isExactMatch = normalizedPath === normalizedPattern;
  const isNestedMatch = normalizedPath.endsWith(`/${normalizedPattern}`);
  return isExactMatch || isNestedMatch;
}

function matchesAnyPathPattern(path, patterns) {
  return patterns.some((pattern) => matchesPathPattern(path, pattern));
}

function getSourceText(context) {
  const sourceCode = context.sourceCode;
  if (!isRecord(sourceCode)) return "";
  if (typeof sourceCode.text !== "string") return "";
  return sourceCode.text;
}

function getFirstLine(text) {
  return text.split(/\r?\n/, 1)[0] ?? "";
}

function isRuntimeShebang(line, runtime) {
  if (!line.startsWith("#!")) return false;
  const command = line.slice(2).trim();
  if (command === runtime) return true;
  if (command.startsWith(`${runtime} `)) return true;
  if (command === `/usr/bin/env ${runtime}`) return true;
  if (command.startsWith(`/usr/bin/env ${runtime} `)) return true;
  if (command === `/usr/bin/env -S ${runtime}`) return true;
  return command.startsWith(`/usr/bin/env -S ${runtime} `);
}

function hasAllowedShebang(text, runtimes) {
  const firstLine = getFirstLine(text);
  return runtimes.some((runtime) => isRuntimeShebang(firstLine, runtime));
}

function createRequireExecutableShebang(context) {
  const files = getConfiguredStringArray(context, "files", DEFAULT_EXECUTABLE_ENTRY_PATTERNS);
  const runtimes = getConfiguredStringArray(context, "runtimes", DEFAULT_EXECUTABLE_RUNTIMES);
  return {
    Program(node) {
      const filename = getRelativeFilename(context);
      if (!filename) return;
      if (!matchesAnyPathPattern(filename, files)) return;
      if (hasAllowedShebang(getSourceText(context), runtimes)) return;
      context.report({
        node,
        messageId: "missingShebang",
        data: { file: filename },
      });
    },
  };
}

function getTemplateQuasiValue(quasi) {
  const value = quasi.value;
  if (!isRecord(value)) return "";
  if (typeof value.cooked === "string") return value.cooked;
  if (typeof value.raw === "string") return value.raw;
  return "";
}

function getStringValue(node) {
  if (!isRecord(node)) return null;
  if (node.type === "Literal") {
    if (typeof node.value !== "string") return null;
    return node.value;
  }
  if (node.type !== "TemplateLiteral") return null;
  const expressions = node.expressions ?? [];
  if (expressions.length) return null;
  const quasis = node.quasis ?? [];
  return quasis.map(getTemplateQuasiValue).join("");
}

function getCalleeName(node) {
  const callee = node.callee;
  if (!isRecord(callee)) return null;
  if (callee.type === "Identifier") return callee.name ?? null;
  if (callee.type !== "MemberExpression") return null;
  const property = callee.property;
  if (!isRecord(property)) return null;
  if (property.type !== "Identifier") return null;
  return property.name ?? null;
}

const SHELL_COMMAND_FUNCTIONS = new Set(["exec", "execSync"]);
const ARG_COMMAND_FUNCTIONS = new Set(["execFile", "execFileSync", "spawn", "spawnSync"]);

function stripCommandQuotes(value) {
  return value.replace(/^["']|["']$/g, "");
}

function isNodeCommand(value) {
  const isBareNode = value === "node";
  const isPathNode = value.endsWith("/node");
  return isBareNode || isPathNode;
}

function isDirectBinEntry(value, patterns) {
  const unquoted = normalizePath(stripCommandQuotes(value));
  const withoutPrefix = unquoted.replace(/^\.\//, "");
  return matchesAnyPathPattern(withoutPrefix, patterns);
}

function findDirectBinEntry(args, patterns) {
  const unquotedArgs = args.map(stripCommandQuotes);
  return unquotedArgs.find((arg) => {
    if (arg.startsWith("-")) return false;
    return isDirectBinEntry(arg, patterns);
  });
}

function getArrayStringValues(node) {
  if (!isRecord(node)) return [];
  if (node.type !== "ArrayExpression") return [];
  const elements = node.elements ?? [];
  return elements.map(getStringValue).filter((value) => typeof value === "string");
}

function getDirectNodeEntryFromCommand(command, patterns) {
  const parts = command.trim().split(/\s+/).map(stripCommandQuotes);
  const commandName = parts[0] ?? "";
  if (!isNodeCommand(commandName)) return null;
  return findDirectBinEntry(parts.slice(1), patterns) ?? null;
}

function getDirectNodeEntryFromCall(node, patterns) {
  const calleeName = getCalleeName(node);
  const commandFunctionName = calleeName ?? "";
  const args = node.arguments ?? [];
  const firstArg = getStringValue(args[0]);
  if (!firstArg) return null;
  if (SHELL_COMMAND_FUNCTIONS.has(commandFunctionName)) {
    return getDirectNodeEntryFromCommand(firstArg, patterns);
  }
  if (!ARG_COMMAND_FUNCTIONS.has(commandFunctionName)) return null;
  if (!isNodeCommand(firstArg)) return null;
  return findDirectBinEntry(getArrayStringValues(args[1]), patterns) ?? null;
}

function createNoDirectNodeBinSmoke(context) {
  const patterns = getConfiguredStringArray(
    context,
    "entryPatterns",
    DEFAULT_DIRECT_BIN_ENTRY_PATTERNS,
  );
  return {
    CallExpression(node) {
      const entry = getDirectNodeEntryFromCall(node, patterns);
      if (!entry) return;
      context.report({
        node,
        messageId: "directNodeBin",
        data: { entry },
      });
    },
  };
}

function createExpressionCheck(context) {
  const max = getConfiguredMax(context, DEFAULT_MAX_EXPRESSION_OPERATORS);
  const checked = new WeakSet();
  return (expression) => {
    if (!isRecord(expression)) return;
    if (isSkippedExpressionRoot(expression)) return;
    if (checked.has(expression)) return;
    checked.add(expression);
    const count = countExpressionOperators(expression);
    if (count <= max) return;
    context.report({
      node: expression,
      messageId: "tooMany",
      data: { count, max },
    });
  };
}

function createMaxExpressionOperators(context) {
  const checkExpression = createExpressionCheck(context);
  return {
    ArrowFunctionExpression(node) {
      const body = node.body;
      const hasBlockBody = isRecord(body) && body.type === "BlockStatement";
      if (hasBlockBody) return;
      checkExpression(body);
    },
    AssignmentExpression(node) {
      checkExpression(node.right);
    },
    CallExpression(node) {
      const args = node.arguments ?? [];
      args.filter((arg) => !isFunctionNode(arg)).forEach(checkExpression);
    },
    ConditionalExpression(node) {
      checkExpression(node);
    },
    DoWhileStatement(node) {
      checkExpression(node.test);
    },
    ForStatement(node) {
      checkExpression(node.test);
    },
    IfStatement(node) {
      checkExpression(node.test);
    },
    ReturnStatement(node) {
      checkExpression(node.argument);
    },
    VariableDeclarator(node) {
      checkExpression(node.init);
    },
    WhileStatement(node) {
      checkExpression(node.test);
    },
  };
}

function createHoistIfOperators(context) {
  const max = getConfiguredMax(context, DEFAULT_MAX_IF_OPERATORS);
  return {
    IfStatement(node) {
      const count = countIfConditionOperators(node.test);
      if (count <= max) return;
      context.report({
        node: node.test,
        messageId: "tooMany",
        data: { count, max },
      });
    },
  };
}

function isExpressionStatement(node) {
  const isExpression = isRecord(node) && node.type === "ExpressionStatement";
  return isExpression;
}

function isForUpdateExpression(node) {
  if (!isRecord(node)) return false;
  const isForUpdate = node.type === "ForStatement" && isRecord(node.update);
  return isForUpdate;
}

function getSideEffectParent(node) {
  const parent = node.parent;
  if (!isRecord(parent)) return parent;
  if (parent.type !== "ChainExpression") return parent;
  return parent.parent;
}

function isStandaloneSideEffect(node) {
  const parent = getSideEffectParent(node);
  if (isExpressionStatement(parent)) return true;
  const isForUpdateSideEffect = isForUpdateExpression(parent) && parent.update === node;
  return isForUpdateSideEffect;
}

function isAssignmentSideEffect(node) {
  const isAssignment = node.type === "AssignmentExpression";
  const isUpdate = node.type === "UpdateExpression";
  return isAssignment || isUpdate;
}

function isMutatingMethodCall(node) {
  return isMethodCall(node, MUTATING_METHODS);
}

function isArrayMutatingMethodCall(node) {
  return isMethodCall(node, ARRAY_MUTATING_METHODS);
}

function getMemberObject(node) {
  if (!isRecord(node)) return null;
  const callee = node.callee;
  if (!isRecord(callee)) return null;
  if (callee.type !== "MemberExpression") return null;
  return callee.object ?? null;
}

function isFreshMutationTarget(target) {
  if (!isRecord(target)) return false;
  if (target.type === "ArrayExpression") return true;
  if (target.type === "ObjectExpression") return true;
  return target.type === "CallExpression";
}

function isFreshMutatingMethodCall(node) {
  if (!isMutatingMethodCall(node)) return false;
  return isFreshMutationTarget(getMemberObject(node));
}

function isSideEffectNode(node) {
  if (!isRecord(node)) return false;
  if (isAssignmentSideEffect(node)) return true;
  if (isFreshMutatingMethodCall(node)) return false;
  return isMutatingMethodCall(node);
}

function childContainsSideEffect(child, root) {
  if (Array.isArray(child)) {
    const childNodes = child.filter(isRecord);
    return childNodes.some((item) => containsSideEffect(item, root));
  }
  if (!isRecord(child)) return false;
  return containsSideEffect(child, root);
}

function containsSideEffect(node, root = node) {
  if (isFunctionBoundary(node, root)) return false;
  if (isSideEffectNode(node)) return true;
  return Object.entries(node).some(([key, child]) => {
    if (SKIP_KEYS.has(key)) return false;
    return childContainsSideEffect(child, root);
  });
}

function reportHiddenSideEffect(context, node) {
  if (isStandaloneSideEffect(node)) return;
  context.report({ node, messageId: "hiddenSideEffect" });
}

function checkCallbackSideEffects(context, node) {
  if (!isMethodCall(node, SIDE_EFFECT_FREE_ITERATION_METHODS)) return false;
  const body = getCallbackBody(node);
  if (!isRecord(body)) return false;
  if (!containsSideEffect(body)) return false;
  context.report({
    node,
    messageId: "callbackSideEffect",
    data: { method: getMethodName(node) ?? "unknown" },
  });
  return true;
}

function createNoHiddenSideEffects(context) {
  return {
    AssignmentExpression(node) {
      reportHiddenSideEffect(context, node);
    },
    CallExpression(node) {
      checkCallbackSideEffects(context, node);
      if (!isMutatingMethodCall(node)) return;
      if (isFreshMutatingMethodCall(node)) return;
      reportHiddenSideEffect(context, node);
    },
    UpdateExpression(node) {
      reportHiddenSideEffect(context, node);
    },
  };
}

function createNoStandaloneArrayMutations(context) {
  return {
    CallExpression(node) {
      if (!isArrayMutatingMethodCall(node)) return;
      if (isFreshMutatingMethodCall(node)) return;
      if (!isStandaloneSideEffect(node)) return;
      context.report({
        node,
        messageId: "standaloneArrayMutation",
        data: { method: getMethodName(node) ?? "unknown" },
      });
    },
  };
}

function reportComputedValue(context, node, messageId, max) {
  if (!isRecord(node)) return;
  const count = countComputedValueOperators(node);
  if (count <= max) return;
  context.report({ node, messageId, data: { count, max } });
}

function isComputedReturnSkipped(argument) {
  if (!isRecord(argument)) return true;
  if (argument.type === "ObjectExpression") return true;
  if (isFunctionNode(argument)) return true;
  return isJsxNode(argument);
}

function createNoComputedValues(context) {
  const max = getConfiguredMax(context, DEFAULT_MAX_COMPUTED_VALUE_OPERATORS);
  return {
    Property(node) {
      const value = node.value;
      if (!isRecord(value)) return;
      if (isFunctionNode(value)) return;
      if (isJsxNode(value)) return;
      reportComputedValue(context, value, "computedObjectValue", max);
    },
    ReturnStatement(node) {
      const argument = node.argument;
      if (isComputedReturnSkipped(argument)) return;
      reportComputedValue(context, argument, "computedReturn", max);
    },
  };
}

function reportSpreadElements(context, nodes, messageId) {
  nodes
    .filter((node) => isRecord(node) && node.type === "SpreadElement")
    .forEach((node) => {
      context.report({ node, messageId });
    });
}

function createPreferConcatObjectAssign(context) {
  return {
    ArrayExpression(node) {
      reportSpreadElements(context, node.elements ?? [], "arraySpread");
    },
    ObjectExpression(node) {
      reportSpreadElements(context, node.properties ?? [], "objectSpread");
    },
  };
}

function childContainsTernary(child) {
  if (Array.isArray(child)) {
    const childNodes = child.filter(isRecord);
    return childNodes.some(containsTernary);
  }
  if (!isRecord(child)) return false;
  return containsTernary(child);
}

function containsTernary(node) {
  if (node.type === "ConditionalExpression") return true;
  return Object.entries(node).some(([key, child]) => {
    if (SKIP_KEYS.has(key)) return false;
    return childContainsTernary(child);
  });
}

function hasNestedTernary(node) {
  return [node.test, node.consequent, node.alternate].some(childContainsTernary);
}

function createNoComplexTernaries(context) {
  const max = getConfiguredMax(context, DEFAULT_MAX_TERNARY_OPERATORS);
  return {
    ConditionalExpression(node) {
      if (hasNestedTernary(node)) {
        context.report({ node, messageId: "nested" });
        return;
      }

      const count = countExpressionOperators(node);
      if (count <= max) return;
      context.report({
        node,
        messageId: "tooMany",
        data: { count, max },
      });
    },
  };
}

export function enterLoop(loopStack, context, node) {
  if (loopStack.length > 0) {
    context.report({ node, messageId: "nestedLoop" });
  }
  return loopStack.concat(node);
}

export function checkSearchInLoop(loopStack, context, node) {
  if (loopStack.length === 0) return;
  if (!isMethodCall(node, SEARCH_METHODS)) return;
  context.report({
    node,
    messageId: "searchInLoop",
    data: { method: getMethodName(node) ?? "unknown" },
  });
}

export function checkNestedIteration(context, node) {
  if (!isMethodCall(node, ITERATION_METHODS)) return false;
  const body = getCallbackBody(node);
  if (!body) return false;
  if (!containsCallTo(body, ITERATION_METHODS)) return false;

  const innerMatch = Array.from(ITERATION_METHODS).find((method) =>
    containsCallTo(body, new Set([method])),
  );
  if (!innerMatch) return false;
  context.report({
    node,
    messageId: "nestedIteration",
    data: { outer: getMethodName(node) ?? "unknown", inner: innerMatch },
  });
  return true;
}

function createLoopVisitors(context, getLoopStack, setLoopStack) {
  return Object.fromEntries(
    Array.from(LOOP_TYPES).flatMap((type) => [
      [
        type,
        (node) => {
          setLoopStack(enterLoop(getLoopStack(), context, node));
        },
      ],
      [
        `${type}:exit`,
        () => {
          setLoopStack(getLoopStack().slice(0, -1));
        },
      ],
    ]),
  );
}

function createNoQuadraticPatterns(context) {
  let loopStack = [];
  const loopVisitors = createLoopVisitors(
    context,
    () => loopStack,
    (nextLoopStack) => {
      loopStack = nextLoopStack;
    },
  );

  return Object.assign({}, loopVisitors, {
    CallExpression(node) {
      if (checkNestedIteration(context, node)) return;
      checkSearchInLoop(loopStack, context, node);
    },
  });
}

export const maxExpressionOperators = defineRule(
  MAX_EXPRESSION_OPERATORS_META,
  createMaxExpressionOperators,
);

export const noQuadraticPatterns = defineRule(
  NO_QUADRATIC_PATTERNS_META,
  createNoQuadraticPatterns,
);

export const hoistIfOperators = defineRule(HOIST_IF_OPERATORS_META, createHoistIfOperators);

export const noHiddenSideEffects = defineRule(
  NO_HIDDEN_SIDE_EFFECTS_META,
  createNoHiddenSideEffects,
);

export const noStandaloneArrayMutations = defineRule(
  NO_STANDALONE_ARRAY_MUTATIONS_META,
  createNoStandaloneArrayMutations,
);

export const noComputedValues = defineRule(NO_COMPUTED_VALUES_META, createNoComputedValues);

export const noComplexTernaries = defineRule(NO_COMPLEX_TERNARIES_META, createNoComplexTernaries);

export const preferConcatObjectAssign = defineRule(
  PREFER_CONCAT_OBJECT_ASSIGN_META,
  createPreferConcatObjectAssign,
);

export const requireExecutableShebang = defineRule(
  REQUIRE_EXECUTABLE_SHEBANG_META,
  createRequireExecutableShebang,
);

export const noDirectNodeBinSmoke = defineRule(
  NO_DIRECT_NODE_BIN_SMOKE_META,
  createNoDirectNodeBinSmoke,
);

const plugin = {
  rules: {
    "hoist-if-operators": hoistIfOperators,
    "max-expression-operators": maxExpressionOperators,
    "no-complex-ternaries": noComplexTernaries,
    "no-computed-values": noComputedValues,
    "no-hidden-side-effects": noHiddenSideEffects,
    "no-quadratic-patterns": noQuadraticPatterns,
    "no-standalone-array-mutations": noStandaloneArrayMutations,
    "prefer-concat-object-assign": preferConcatObjectAssign,
    "require-executable-shebang": requireExecutableShebang,
    "no-direct-node-bin-smoke": noDirectNodeBinSmoke,
  },
};

export default plugin;
