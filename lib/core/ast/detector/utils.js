const { tokenizer } = require("acorn");
const { LATEST_PARSER_VERSION } = require("../../../constants/es");
const {
  FUNCTION_SCOPE_TYPES,
  GLOBAL_BUILTIN_NAMES,
  REGEXP_MODIFIER_PREFIXES,
  ITERATOR_RETURNING_HELPERS,
  ITERATOR_FACTORIES,
  ITERABLE_RECEIVER_TYPES,
  JSON_PARSE_AST_INFO,
  STRING_RECEIVER_TYPES,
  MAP_RECEIVER_TYPES,
  ARRAY_RETURNING_METHODS,
  TYPED_ARRAY_RETURNING_METHODS,
  TYPED_ARRAY_RECEIVER_TYPES,
} = require("../constants");
const {
  checkMap,
  getStaticPropertyName,
  visitArray,
  createThisScope,
  collectDirectLexicalDeclarations,
  collectHoistedDeclarations,
  addPatternNames,
  createScope,
  addVariableNames,
  getGlobalReferenceName,
  isDeclared,
  isIdentifierReference,
  getReceiverRootName,
  getStaticReferenceKey,
  isNodeRecord,
  visitChildNodes,
} = require("../utils");

function buildFeatureIndex(features) {
  return Object.entries(features).reduce((index, [name, { astInfo }]) => {
    const hasNodeType = Boolean(astInfo?.nodeType);
    if (!hasNodeType) return index;
    return addFeatureIndexEntries(index, name, astInfo);
  }, {});
}

function mergeReceiverScopes(scope, branches) {
  if (!scope) return;
  if (branches.length === 0) return;
  const counts = new Map();
  visitArray(branches, (branch) => countReceivers(branch, counts));
  const receiverTypes = new Map();
  counts.forEach(({ kind, count }, key) => {
    if (count === branches.length) receiverTypes.set(key, kind);
  });
  scope.receiverTypes = receiverTypes;
  const parents = branches.map((branch) => branch.parent);
  mergeReceiverScopes(scope.parent, parents);
}

function createProgramScope(ast) {
  const scope = createThisScope(null);
  collectDirectLexicalDeclarations(ast.body, scope.names);
  collectHoistedDeclarations(ast, scope.names);
  recordGeneratorDeclarations(ast.body, scope);
  return scope;
}

function addAssignedGlobalName(expression, names) {
  if (expression?.type === "SequenceExpression") {
    visitArray(expression.expressions, (item) => {
      addAssignedGlobalName(item, names);
    });
    return;
  }

  const isAssignment = expression?.type === "AssignmentExpression" && expression.operator === "=";
  if (!isAssignment) return;

  addGlobalPatternNames(expression.left, names);
}

function createFunctionScope(node, parentScope) {
  const scope = createScope(parentScope);

  const isNamedFunctionExpression = node.type === "FunctionExpression";
  const hasName = Boolean(node.id?.name);
  const shouldAddName = isNamedFunctionExpression && hasName;
  if (shouldAddName) {
    scope.names.add(node.id.name);
  }

  visitArray(node.params, (param) => {
    addPatternNames(param, scope.names);
  });

  collectHoistedDeclarations(node.body, scope.names);
  return scope;
}

function createCatchScope(node, parentScope) {
  const scope = createScope(parentScope);
  addPatternNames(node.param, scope.names);
  return scope;
}

function createClassBodyScope(parentScope, classNode) {
  const scope = createScope(parentScope);
  if (classNode.id?.name) scope.names.add(classNode.id.name);
  return scope;
}

function createLoopScope(node, parentScope) {
  const scope = createScope(parentScope);
  const declaration = node.init || node.left;
  const isLexicalDeclaration =
    declaration?.type === "VariableDeclaration" && declaration.kind !== "var";
  if (isLexicalDeclaration) addVariableNames(declaration, scope.names);
  return scope;
}

function createSwitchScope(node, parentScope) {
  const scope = createScope(parentScope);
  visitArray(node.cases, (switchCase) => {
    collectDirectLexicalDeclarations(switchCase.consequent, scope.names);
  });
  return scope;
}

function matchesFeature(node, astInfo, context = {}) {
  if (astInfo.jsonParseSource) return hasJSONParseSource(node, context);
  if (astInfo.importAttributes) return hasImportAttributes(node, context.sourceCode);
  if (astInfo.importOptions) return hasImportOptions(node, context.sourceCode);
  if (astInfo.regexpModifiers) return hasRegExpModifiers(node);
  const isStaticMember = node.type === "MemberExpression" && astInfo.object;
  if (isStaticMember) {
    const path = getMemberPath(node, context.scope);
    return path === `${astInfo.object}.${astInfo.property}`;
  }
  if (astInfo.childType) {
    const children = node.elements || node.properties;
    return children?.some((child) => child?.type === astInfo.childType) || false;
  }

  if (astInfo.await) return node.await === true;
  if (astInfo.flags) return node.regex?.flags.includes(astInfo.flags) || false;

  if (astInfo.name) return isNamedIdentifierMatch(node, astInfo, context);

  if (astInfo.nodeType === "BigIntLiteral") {
    return node.bigint !== undefined;
  }

  const hasWrongKind = astInfo.kind && node.kind !== astInfo.kind;
  if (hasWrongKind) {
    return false;
  }

  if (hasOperatorMismatch(node, astInfo)) {
    return false;
  }

  if (astInfo.property === "superClass") {
    return node.superClass !== null;
  }

  if (astInfo.topLevel) {
    return isTopLevelAwaitMatch(node, astInfo, context);
  }

  if (astInfo.leftIsPrivate) {
    return isPrivateBrandCheckMatch(node, astInfo);
  }

  if (astInfo.noParam) {
    return isOptionalCatchBindingMatch(node, astInfo);
  }

  if (isCallableNode(node)) {
    return isCallableFeatureMatch(node, astInfo, context);
  }

  return true;
}

function recordJSONReviverContext(node, context, scope) {
  const call = context.parent;
  if (call?.arguments?.[1] !== node) return;
  if (!isNativeJSONParseCall(call, context)) return;
  const parameter = node.params[2];
  const binding = parameter?.type === "AssignmentPattern" ? parameter.left : parameter;
  if (binding?.type !== "Identifier") return;
  scope.receiverTypes.set(binding.name, "jsonContext");
}

function maybeRecordGlobalReference(node, context, state) {
  const isIdentifier = node.type === "Identifier";
  if (!isIdentifier) return;
  if (context.typeofDepth > 0) return;

  const name = node.name;
  const isKnownGlobal = state.remainingGlobals.has(name);
  if (!isKnownGlobal) return;
  if (context.guardedGlobals.has(name)) return;

  if (!isIdentifierReference(node, context.parent)) return;
  if (isDeclared(context.scope, name)) return;

  state.foundFeatures[name] = true;
  state.remainingGlobals.delete(name);
}

function mergeGuardedGlobals(existing, names) {
  if (names.size === 0) return existing;
  const merged = new Set(existing);
  names.forEach((name) => {
    merged.add(name);
  });
  return merged;
}

function collectTrueBranchTypeofNames(node) {
  const names = new Set();
  collectBranchTypeofNames(node, true, names);
  return names;
}

function collectFalseBranchTypeofNames(node) {
  const names = new Set();
  collectBranchTypeofNames(node, false, names);
  return names;
}

function collectInstalledPropertyPaths(node, paths, scope) {
  if (node.type === "FunctionDeclaration") return true;
  if (node.type === "EmptyStatement") return true;
  if (node.type === "BlockStatement") {
    const blockScope = createBlockScope(node, scope);
    return node.body.every((child) => collectInstalledPropertyPaths(child, paths, blockScope));
  }
  if (node.directive) return true;
  const expression = node.type === "ExpressionStatement" ? node.expression : node;
  const path = getDirectInstallPath(expression, scope) || getGuardedInstallPath(expression, scope);
  if (!path) return false;
  paths.add(path);
  return true;
}

function createBlockScope(node, parentScope) {
  const scope = createScope(parentScope);
  collectDirectLexicalDeclarations(node.body, scope.names);
  recordGeneratorDeclarations(node.body, scope);
  return scope;
}

function normalizeNodeType(nodeType) {
  if (Array.isArray(nodeType)) return nodeType;
  if (nodeType === "ExportDeclaration") {
    return ["ExportNamedDeclaration", "ExportDefaultDeclaration", "ExportAllDeclaration"];
  }
  if (nodeType === "BigIntLiteral") {
    return ["Literal"];
  }
  return [nodeType];
}

function getReceiverType(node, context) {
  if (!node) return null;
  if (node.type === "ArrayExpression") return "array";
  const isString = node.type === "Literal" && typeof node.value === "string";
  if (isString) return getStringReceiverType(node.value);
  const isGenerator = node.generator && !node.async;
  if (isGenerator) return "generatorFunction";
  if (node.type === "NewExpression") return getConstructorReceiverType(node, context);
  if (node.type === "CallExpression") return getCallReceiverType(node, context);
  if (node.type === "ChainExpression") return getReceiverType(node.expression, context);
  const key = getStaticReferenceKey(node);
  if (!key) return null;
  return getKnownReceiverType(key, context);
}

function countReceivers(scope, counts) {
  scope.receiverTypes.forEach((kind, key) => {
    const previous = counts.get(key);
    const mergedKind = getMergedReceiverType(previous?.kind, kind);
    if (mergedKind) {
      previous.kind = mergedKind;
      previous.count += 1;
      return;
    }
    counts.set(key, { kind, count: 1 });
  });
}

function getMergedReceiverType(before, after) {
  if (before === after) return before;
  const bothMaps = MAP_RECEIVER_TYPES.has(before) && MAP_RECEIVER_TYPES.has(after);
  if (bothMaps) return "mapLike";
  const bothTypedArrays =
    matchesReceiverTypes(before, TYPED_ARRAY_RECEIVER_TYPES) &&
    matchesReceiverTypes(after, TYPED_ARRAY_RECEIVER_TYPES);
  if (!bothTypedArrays) return null;
  const kinds = [].concat(before, after);
  return Array.from(new Set(kinds)).sort();
}

function addFeatureIndexEntries(index, name, astInfo) {
  const entry = { name, astInfo };
  const types = normalizeNodeType(astInfo.nodeType);

  visitArray(types, (type) => {
    const existing = index[type] || [];
    index[type] = existing.concat(entry);
  });

  return index;
}

function addGlobalPatternNames(pattern, names) {
  const targetNames = new Set();
  addPatternNames(pattern, targetNames);

  targetNames.forEach((targetName) => {
    if (GLOBAL_BUILTIN_NAMES.has(targetName)) names.add(targetName);
  });
}

function isNamedIdentifierMatch(node, astInfo, context) {
  const hasName = Boolean(astInfo.name);
  const isIdentifier = node.type === "Identifier";
  const shouldCheckIdentifier = hasName && isIdentifier;
  if (!shouldCheckIdentifier) return false;

  if (!isIdentifierReference(node, context.parent)) return false;
  if (isShadowedGlobalReference(node, astInfo, context)) return false;

  return node.name === astInfo.name;
}

function hasOperatorMismatch(node, astInfo) {
  const expectsOperator = Boolean(astInfo.operator);
  const hasOperatorMismatch = expectsOperator && node.operator !== astInfo.operator;
  if (hasOperatorMismatch) return true;

  const expectsOperators = Boolean(astInfo.operators);
  if (!expectsOperators) return false;

  const hasAllowedOperator = astInfo.operators.includes(node.operator);
  return !hasAllowedOperator;
}

function isTopLevelAwaitMatch(node, astInfo, context) {
  const isTopLevelFeature = Boolean(astInfo.topLevel);
  const isAwaitExpression = node.type === "AwaitExpression";
  const shouldCheckTopLevel = isTopLevelFeature && isAwaitExpression;
  if (!shouldCheckTopLevel) return false;

  return context.isTopLevel === true;
}

function isPrivateBrandCheckMatch(node, astInfo) {
  const checksPrivateLeft = Boolean(astInfo.leftIsPrivate);
  const isBinaryExpression = node.type === "BinaryExpression";
  const shouldCheckPrivateLeft = checksPrivateLeft && isBinaryExpression;
  if (!shouldCheckPrivateLeft) return false;

  return node.left?.type === "PrivateIdentifier";
}

function isOptionalCatchBindingMatch(node, astInfo) {
  const checksNoParam = Boolean(astInfo.noParam);
  if (!checksNoParam) return false;

  const isCatchClause = node.type === "CatchClause";
  if (!isCatchClause) return false;

  const hasNoParam = node.param == null;
  return hasNoParam;
}

function isCallableNode(node) {
  const isCallExpression = node.type === "CallExpression";
  const isNewExpression = node.type === "NewExpression";
  return isCallExpression || isNewExpression;
}

function isCallableFeatureMatch(node, astInfo, context) {
  const hasMatch = checkMap(node, astInfo);
  if (!hasMatch) return false;
  const excluded = astInfo.excludeReceiverTypes;
  const hasExcludedReceiver = excluded?.includes(getReceiverType(node.callee?.object, context));
  if (hasExcludedReceiver) return false;
  if (!isRequiredReceiverMatch(node, astInfo, context)) return false;
  if (isShadowedGlobalReference(node, astInfo, context)) return false;
  return true;
}

function isRequiredReceiverMatch(node, astInfo, context) {
  const needsMap = astInfo.requireMapReceiver;
  const needsIterator = astInfo.requireIteratorReceiver;
  const needsBytes = astInfo.requireUint8ArrayReceiver;
  const needsDate = astInfo.requireDateReceiver;
  const needsReceiver = needsMap || needsIterator || needsBytes || needsDate;
  if (!needsReceiver) return true;
  const kind = getReceiverType(node.callee?.object, context);
  if (needsMap) return MAP_RECEIVER_TYPES.has(kind);
  if (needsIterator) return kind === "iterator";
  if (needsDate) return kind === "date";
  return kind === "uint8Array";
}

function recordGeneratorDeclarations(statements, scope) {
  visitArray(statements, (statement) => {
    const declaration = statement.declaration || statement;
    if (declaration.type !== "FunctionDeclaration") return;
    const name = declaration.id?.name;
    if (!name) return;
    const isGenerator = declaration.generator && !declaration.async;
    if (isGenerator) scope.receiverTypes.set(name, "generatorFunction");
    else scope.receiverTypes.delete(name);
  });
}

function hasJSONParseSource(node, context) {
  if (node.type === "CallExpression") return hasSourceReviver(node, context);
  if (node.type === "MemberExpression") {
    if (getStaticPropertyName(node) !== "source") return false;
    return getReceiverType(node.object, context) === "jsonContext";
  }
  if (!isSourceDestructuring(node)) return false;
  const value = context.parent?.init || context.parent?.right;
  return getReceiverType(value, context) === "jsonContext";
}

function getCallReceiverType(node, context) {
  const callee = node.callee;
  if (getReceiverType(callee, context) === "generatorFunction") return "iterator";
  const builtin = getBuiltinCallReceiverType(node, context);
  if (builtin) return builtin;
  if (callee?.type !== "MemberExpression") return null;
  const method = getStaticPropertyName(callee);
  const staticKind = getStaticFactoryType(callee.object?.name, method, context);
  if (staticKind) return staticKind;
  const kind = getReceiverType(callee.object, context);
  const isIterable =
    matchesReceiverTypes(kind, ITERABLE_RECEIVER_TYPES) ||
    STRING_RECEIVER_TYPES.has(kind) ||
    kind === "iterator";
  const isSymbolIterator = isIterable && isIteratorSymbolCall(callee, context);
  if (isSymbolIterator) return "iterator";
  return getMethodResultType(kind, method);
}

function getKnownReceiverType(key, context) {
  const rootName = getReceiverRootName(key);
  let scope = context.scope;

  while (scope) {
    if (scope.receiverTypes.has(key)) return scope.receiverTypes.get(key);
    const hasShadowingRoot = rootName && scope.names.has(rootName);
    if (hasShadowingRoot) return null;
    const hasThisBoundary = !rootName && scope.ownsThis;
    if (hasThisBoundary) return null;
    scope = scope.parent;
  }

  return null;
}

function getConstructorReceiverType(node, context) {
  const name = node.callee?.name;
  const isShadowed = !name || isDeclared(context.scope, name);
  if (isShadowed) return null;
  if (name === "Map") return "map";
  if (name === "WeakMap") return "weakMap";
  if (name === "Set") return "set";
  if (name === "Date") return "date";
  if (name === "Array") return "array";
  if (name === "Uint8Array") return "uint8Array";
  if (name === "String") return "boxedString";
  const isTypedArray = GLOBAL_BUILTIN_NAMES.has(name) && name.endsWith("Array");
  if (isTypedArray) return name;
  return null;
}

function getBuiltinCallReceiverType(node, context) {
  const name = node.callee?.name;
  const isShadowed = !name || isDeclared(context.scope, name);
  if (isShadowed) return null;
  if (name === "Array") return "array";
  if (name !== "String") return null;
  const argument = node.arguments[0];
  if (!argument) return "emptyString";
  const isLiteralString = argument.type === "Literal" && typeof argument.value === "string";
  if (isLiteralString) return getStringReceiverType(argument.value);
  return "string";
}

function getStringReceiverType(value) {
  if (value === "") return "emptyString";
  return "nonemptyString";
}

function getStaticFactoryType(name, method, context) {
  const isShadowed = !name || isDeclared(context.scope, name);
  if (isShadowed) return null;
  const isIteratorFactory = ["from", "concat", "zip", "zipKeyed"].includes(method);
  const isStaticIterator = name === "Iterator" && isIteratorFactory;
  if (isStaticIterator) return "iterator";
  const isByteFactory = method === "fromBase64" || method === "fromHex";
  const createsBytes = name === "Uint8Array" && isByteFactory;
  if (createsBytes) return "uint8Array";
  const isArrayFactory = method === "from" || method === "of";
  if (!isArrayFactory) return null;
  if (name === "Array") return "array";
  if (name === "Uint8Array") return "uint8Array";
  const isTypedArray = GLOBAL_BUILTIN_NAMES.has(name) && name.endsWith("Array");
  if (isTypedArray) return name;
  return null;
}

function isIteratorSymbolCall(callee, context) {
  if (!callee.computed) return false;
  const property = callee.property;
  if (property?.type !== "MemberExpression") return false;
  if (property.object?.name !== "Symbol") return false;
  if (getStaticPropertyName(property) !== "iterator") return false;
  return !isDeclared(context.scope, "Symbol");
}

function getMethodResultType(kind, method) {
  if (kind === "iterator") {
    if (ITERATOR_RETURNING_HELPERS.has(method)) return "iterator";
    if (method === "toArray") return "array";
    return null;
  }
  const isIterable = matchesReceiverTypes(kind, ITERABLE_RECEIVER_TYPES);
  const isFactory = isIterable && ITERATOR_FACTORIES.has(method);
  if (isFactory) return "iterator";
  const isMatchAll = STRING_RECEIVER_TYPES.has(kind) && method === "matchAll";
  if (isMatchAll) return "iterator";
  const returnsArray = kind === "array" && ARRAY_RETURNING_METHODS.has(method);
  if (returnsArray) return "array";
  const isTypedArray = matchesReceiverTypes(kind, TYPED_ARRAY_RECEIVER_TYPES);
  const returnsTypedArray = isTypedArray && TYPED_ARRAY_RETURNING_METHODS.has(method);
  if (returnsTypedArray) return kind;
  return null;
}

function matchesReceiverTypes(kind, types) {
  if (!Array.isArray(kind)) return types.has(kind);
  return kind.every((receiver) => types.has(receiver));
}

function hasSourceReviver(node, context) {
  if (!isNativeJSONParseCall(node, context)) return false;
  const reviver = node.arguments[1];
  if (!FUNCTION_SCOPE_TYPES.has(reviver?.type)) return false;
  return isSourceDestructuring(reviver.params[2]);
}

function isSourceDestructuring(parameter) {
  const pattern = parameter?.type === "AssignmentPattern" ? parameter.left : parameter;
  if (pattern?.type !== "ObjectPattern") return false;
  return pattern.properties.some((property) => {
    const name = getStaticPropertyName(property, property.key) ?? property.key?.value;
    return name === "source";
  });
}

function isNativeJSONParseCall(node, context) {
  if (node.type !== "CallExpression") return false;
  if (!checkMap(node, JSON_PARSE_AST_INFO)) return false;
  return !isShadowedGlobalReference(node, JSON_PARSE_AST_INFO, context);
}

function isShadowedGlobalReference(node, astInfo, context) {
  const name = getGlobalReferenceName(node, astInfo);
  const hasName = Boolean(name);
  if (!hasName) return false;

  const isBuiltin = GLOBAL_BUILTIN_NAMES.has(name);
  if (!isBuiltin) return false;

  return isDeclared(context.scope, name);
}

function hasImportAttributes(node, sourceCode) {
  if (node.type === "ImportExpression") {
    const properties = node.options?.properties || [];
    return properties.some((property) => {
      const name = getStaticPropertyName(property, property.key) ?? property.key?.value;
      return name === "with";
    });
  }
  if (node.attributes?.length > 0) return true;
  if (!node.source) return false;
  const token = getImportSuffixToken(node, sourceCode);
  return token?.value === "with";
}

function hasImportOptions(node, sourceCode) {
  if (node.options) return true;
  const token = getImportSuffixToken(node, sourceCode);
  return token?.type.label === ",";
}

function getImportSuffixToken(node, sourceCode) {
  if (sourceCode === undefined) return null;
  const suffix = sourceCode.slice(node.source.end, node.end);
  const tokens = tokenizer(suffix, { ecmaVersion: LATEST_PARSER_VERSION });
  let token = tokens.getToken();
  while (token.type.label === ")") token = tokens.getToken();
  return token;
}

function hasRegExpModifiers(node) {
  const pattern = node.regex?.pattern || "";
  let inClass = false;
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "\\") {
      index += 1;
      continue;
    }
    if (character === "[") inClass = true;
    if (character === "]") inClass = false;
    if (inClass) continue;
    const startsGroup = pattern.startsWith("(?", index);
    const isModifier = REGEXP_MODIFIER_PREFIXES.has(pattern[index + 2]);
    const hasModifierGroup = startsGroup && isModifier;
    if (hasModifierGroup) return true;
  }
  return false;
}

function collectBranchTypeofNames(node, branchValue, names) {
  const isNotNode = !isNodeRecord(node);
  if (isNotNode) return;
  if (FUNCTION_SCOPE_TYPES.has(node.type)) return;

  const isUnaryNot = node.type === "UnaryExpression" && node.operator === "!";
  if (isUnaryNot) {
    collectBranchTypeofNames(node.argument, !branchValue, names);
    return;
  }
  if (addTypeofComparisonName(node, branchValue, names)) return;
  if (node.type === "ConditionalExpression") {
    collectConditionalTypeofNames(node, branchValue, names);
    return;
  }
  if (shouldSkipBranchGuard(node, branchValue)) return;

  visitChildNodes(node, (child) => {
    collectBranchTypeofNames(child, branchValue, names);
  });
}

function collectConditionalTypeofNames(node, branchValue, names) {
  if (!branchValue) return;

  if (isFalseLiteral(node.alternate)) {
    collectBranchTypeofNames(node.consequent, true, names);
    return;
  }

  if (isFalseLiteral(node.consequent)) {
    collectBranchTypeofNames(node.alternate, true, names);
  }
}

function addTypeofComparisonName(node, branchValue, names) {
  const comparison = getTypeofComparison(node);
  if (!comparison) return false;

  const guardedBranch = getTypeofComparisonGuardBranch(comparison);
  if (guardedBranch === branchValue) {
    names.add(comparison.name);
  }
  return true;
}

function getTypeofComparison(node) {
  if (node.type !== "BinaryExpression") return null;

  const leftComparison = getTypeofComparisonSide(node.left, node.right);
  if (leftComparison) {
    return normalizeTypeofComparison(leftComparison, node.operator);
  }

  const rightComparison = getTypeofComparisonSide(node.right, node.left);
  if (rightComparison) {
    return normalizeTypeofComparison(rightComparison, node.operator, true);
  }
  return getBooleanTypeofComparison(node);
}

function getBooleanTypeofComparison(node) {
  if (!isTypeofComparisonOperator(node.operator)) return null;

  const isLeftBoolean = typeof node.left.value === "boolean";
  const valueNode = isLeftBoolean ? node.left : node.right;
  const expression = isLeftBoolean ? node.right : node.left;
  const isBoolean = valueNode.type === "Literal" && typeof valueNode.value === "boolean";
  if (!isBoolean) return null;

  const comparison = getTypeofComparison(expression);
  if (!comparison) return null;
  const isEqual = node.operator === "===" || node.operator === "==";
  const preservesPolarity = isEqual === valueNode.value;
  const guardedBranch = getTypeofComparisonGuardBranch(comparison) === preservesPolarity;
  const operator = guardedBranch ? "!==" : "===";
  return { name: comparison.name, value: "undefined", operator };
}

function getTypeofComparisonGuardBranch(comparison) {
  const isEqual = comparison.operator === "===" || comparison.operator === "==";
  const isUndefined = comparison.value === "undefined";
  if (isUndefined) return !isEqual;
  return isEqual;
}

function normalizeTypeofComparison(comparison, operator, isReversed = false) {
  if (isTypeofComparisonOperator(operator)) {
    return Object.assign({}, comparison, { operator });
  }

  const isRelational = operator === "<" || operator === ">";
  const isMinifiedGuard = isRelational && comparison.value === "u";
  if (!isMinifiedGuard) return null;

  const isUndefined = (operator === ">") !== isReversed;
  const normalizedOperator = isUndefined ? "===" : "!==";
  return Object.assign({}, comparison, { value: "undefined", operator: normalizedOperator });
}

function isTypeofComparisonOperator(operator) {
  const comparisonOperators = ["==", "===", "!=", "!=="];
  return comparisonOperators.includes(operator);
}

function getTypeofComparisonSide(typeofNode, valueNode) {
  const isTypeof = typeofNode.type === "UnaryExpression" && typeofNode.operator === "typeof";
  const isString = valueNode?.type === "Literal" && typeof valueNode.value === "string";
  const isInvalidComparison = !isTypeof || !isString;
  if (isInvalidComparison) return null;

  const target = getTypeofIdentifierTarget(typeofNode.argument);
  if (!target) return null;
  return { name: target, value: valueNode.value };
}

function getTypeofIdentifierTarget(argument) {
  const targetName = argument?.type === "Identifier" ? argument.name : null;
  if (!targetName) return null;

  const isGlobalTarget = GLOBAL_BUILTIN_NAMES.has(targetName);
  if (!isGlobalTarget) return null;
  return targetName;
}

function isFalseLiteral(node) {
  const isLiteral = node?.type === "Literal";
  const isFalse = node?.value === false;
  return isLiteral && isFalse;
}

function shouldSkipBranchGuard(node, branchValue) {
  if (node.type === "BinaryExpression") return true;
  const isLogical = node.type === "LogicalExpression";
  if (!isLogical) return false;

  const isAnd = node.operator === "&&";
  const isOr = node.operator === "||";
  const isNullish = node.operator === "??";
  const isFalsyAnd = isAnd && !branchValue;
  const isTruthyOr = isOr && branchValue;
  if (isFalsyAnd) return true;
  if (isTruthyOr) return true;
  if (isNullish) return true;
  return false;
}

function getGuardedInstallPath(node, scope) {
  if (node.type === "LogicalExpression") {
    if (node.operator !== "||") return null;
    const guard = getMemberPath(node.left, scope);
    const install = getDirectInstallPath(node.right, scope);
    const matchesGuard = guard === install;
    return matchesGuard ? install : null;
  }
  if (node.type !== "IfStatement") return null;
  if (node.alternate) return null;
  const isMissingCheck = node.test.type === "UnaryExpression" && node.test.operator === "!";
  if (!isMissingCheck) return null;
  const guard = getMemberPath(node.test.argument, scope);
  const statement = getSingleInstallStatement(node.consequent);
  if (statement?.type !== "ExpressionStatement") return null;
  const install = getDirectInstallPath(statement.expression, scope);
  const matchesGuard = guard === install;
  return matchesGuard ? install : null;
}

function getDirectInstallPath(node, scope) {
  return getAssignedPropertyPath(node, scope) || getDefinedPropertyPath(node, scope);
}

function getAssignedPropertyPath(node, scope) {
  const isAssignment = node.type === "AssignmentExpression" && node.operator === "=";
  const isPropertyAssignment = isAssignment && node.left.type === "MemberExpression";
  const hasImplementation = FUNCTION_SCOPE_TYPES.has(node.right?.type);
  const isMethodAssignment = isPropertyAssignment && hasImplementation;
  return isMethodAssignment ? getMemberPath(node.left, scope) : null;
}

function getDefinedPropertyPath(node, scope) {
  const isCall = node.type === "CallExpression";
  const isDefineProperty = isCall && getMemberPath(node.callee, scope) === "Object.defineProperty";
  if (!isDefineProperty) return null;

  const [target, key, descriptor] = node.arguments;
  if (!hasMethodDescriptor(descriptor)) return null;
  const targetPath = getMemberPath(target, scope);
  const hasStringKey = key?.type === "Literal" && typeof key.value === "string";
  const hasPropertyName = hasStringKey && !key.value.includes(".");
  const hasStaticTarget = Boolean(targetPath) && hasPropertyName;
  return hasStaticTarget ? `${targetPath}.${key.value}` : null;
}

function getMemberPath(node, scope) {
  if (node?.type === "Identifier") {
    if (isDeclared(scope, node.name)) return null;
    return node.name;
  }
  if (node?.type !== "MemberExpression") return null;

  const objectPath = getMemberPath(node.object, scope);
  const propertyName = getStaticPropertyName(node);
  const hasPropertyName = Boolean(propertyName) && !propertyName.includes(".");
  const hasStaticPath = Boolean(objectPath) && hasPropertyName;
  return hasStaticPath ? `${objectPath}.${propertyName}` : null;
}

function hasMethodDescriptor(node) {
  if (node?.type !== "ObjectExpression") return false;
  const hasStaticProperties = node.properties.every(isStaticDescriptorProperty);
  if (!hasStaticProperties) return false;
  return node.properties.some(isDescriptorValue);
}

function isDescriptorValue(property) {
  const name = getStaticPropertyName(property, property.key) ?? property.key?.value;
  return name === "value";
}

function isStaticDescriptorProperty(property) {
  if (property.type !== "Property") return false;
  if (property.kind !== "init") return false;
  const name = getStaticPropertyName(property, property.key) ?? property.key?.value;
  const isFlag = ["enumerable", "configurable", "writable"].includes(name);
  const isBoolean = typeof property.value.value === "boolean";
  if (isFlag) return isBoolean;
  if (name !== "value") return false;
  return FUNCTION_SCOPE_TYPES.has(property.value.type);
}

function getSingleInstallStatement(node) {
  if (node.type !== "BlockStatement") return node;
  if (node.body.length !== 1) return null;
  return node.body[0];
}

module.exports = {
  maybeRecordGlobalReference,
  matchesFeature,
  getReceiverType,
  mergeReceiverScopes,
  createFunctionScope,
  recordJSONReviverContext,
  createBlockScope,
  createCatchScope,
  createClassBodyScope,
  addAssignedGlobalName,
  mergeGuardedGlobals,
  collectTrueBranchTypeofNames,
  collectFalseBranchTypeofNames,
  createLoopScope,
  createSwitchScope,
  createProgramScope,
  collectInstalledPropertyPaths,
  normalizeNodeType,
  buildFeatureIndex,
};
