const { ES_FEATURES, MAP_CONSTRUCTORS } = require("../constants");
const { ES_GLOBAL_MIN_VERSION } = require("../constants/es-features/globals");
const { checkMap } = require("./ast");

const FUNCTION_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
  "MethodDefinition",
]);

const FUNCTION_SCOPE_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

const GLOBAL_BUILTIN_NAMES = new Set(Object.keys(ES_GLOBAL_MIN_VERSION));

const DECLARATION_ID_PARENT_TYPES = new Set([
  "ClassDeclaration",
  "ClassExpression",
  "FunctionDeclaration",
  "FunctionExpression",
  "VariableDeclarator",
]);

const IMPORT_LOCAL_PARENT_TYPES = new Set([
  "ImportDefaultSpecifier",
  "ImportNamespaceSpecifier",
  "ImportSpecifier",
]);

const PROPERTY_KEY_PARENT_TYPES = new Set(["MethodDefinition", "Property", "PropertyDefinition"]);

const LABEL_PARENT_TYPES = new Set(["BreakStatement", "ContinueStatement", "LabeledStatement"]);

const RECEIVER_EXIT_TYPES = new Set([
  "ReturnStatement",
  "ThrowStatement",
  "BreakStatement",
  "ContinueStatement",
]);

const POSSIBLY_THROWING_TYPES = new Set([
  "CallExpression",
  "NewExpression",
  "MemberExpression",
  "AwaitExpression",
  "TaggedTemplateExpression",
  "BinaryExpression",
  "UnaryExpression",
  "AssignmentExpression",
  "UpdateExpression",
  "SpreadElement",
  "YieldExpression",
]);

const CHILD_KEYS = [
  "body",
  "declarations",
  "expression",
  "left",
  "right",
  "argument",
  "arguments",
  "callee",
  "object",
  "property",
  "properties",
  "elements",
  "params",
  "id",
  "init",
  "test",
  "consequent",
  "alternate",
  "cases",
  "discriminant",
  "block",
  "handler",
  "finalizer",
  "source",
  "specifiers",
  "declaration",
  "exported",
  "imported",
  "local",
  "key",
  "value",
  "superClass",
  "expressions",
];

function normalizeNodeType(nodeType) {
  if (nodeType === "ExportDeclaration") {
    return ["ExportNamedDeclaration", "ExportDefaultDeclaration", "ExportAllDeclaration"];
  }
  if (nodeType === "BigIntLiteral") {
    return ["Literal"];
  }
  return [nodeType];
}

function buildFeatureIndex(features) {
  return Object.entries(features).reduce((index, [name, { astInfo }]) => {
    const hasNodeType = Boolean(astInfo?.nodeType);
    if (!hasNodeType) return index;
    return addFeatureIndexEntries(index, name, astInfo);
  }, {});
}

const featuresByNodeType = buildFeatureIndex(ES_FEATURES);

function createScope(parent = null) {
  return {
    parent,
    names: new Set(),
    mapReceivers: new Set(),
    ownsThis: false,
    isFunction: false,
    receiverExits: null,
  };
}

function cloneScope(scope) {
  if (!scope) return null;
  const parent = cloneScope(scope.parent);
  const mapReceivers = new Set(scope.mapReceivers);
  return Object.assign({}, scope, { parent, mapReceivers });
}

function createThisScope(parent) {
  const scope = createScope(parent);
  scope.ownsThis = true;
  return scope;
}

function mergeReceiverScopes(scope, branches) {
  if (!scope) return;
  if (branches.length === 0) return;
  const counts = new Map();
  visitArray(branches, (branch) => countMapReceivers(branch, counts));
  const mapReceivers = new Set();
  counts.forEach((count, key) => {
    if (count === branches.length) mapReceivers.add(key);
  });
  scope.mapReceivers = mapReceivers;
  const parents = branches.map((branch) => branch.parent);
  mergeReceiverScopes(scope.parent, parents);
}

function countMapReceivers(scope, counts) {
  scope.mapReceivers.forEach((key) => {
    const count = counts.get(key) || 0;
    counts.set(key, count + 1);
  });
}

function visitArray(items, visitor) {
  if (!Array.isArray(items)) return;

  let index = 0;
  while (index < items.length) {
    visitor(items[index], index);
    index += 1;
  }
}

function visitChildNodes(node, visitor) {
  visitArray(CHILD_KEYS, (key) => {
    const child = node[key];
    if (!child) return;

    if (Array.isArray(child)) {
      visitArray(child, (item) => {
        if (item?.type) visitor(item);
      });
      return;
    }

    if (child.type) visitor(child);
  });
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

function isDeclared(scope, name) {
  let current = scope;
  while (current) {
    if (current.names.has(name)) return true;
    current = current.parent;
  }
  return false;
}

function addPatternNames(pattern, names) {
  if (!pattern) return;

  if (pattern.type === "Identifier") {
    names.add(pattern.name);
    return;
  }

  if (pattern.type === "RestElement") {
    addPatternNames(pattern.argument, names);
    return;
  }

  if (pattern.type === "AssignmentPattern") {
    addPatternNames(pattern.left, names);
    return;
  }

  if (pattern.type === "ArrayPattern") {
    visitArray(pattern.elements, (element) => {
      addPatternNames(element, names);
    });
    return;
  }

  if (pattern.type === "ObjectPattern") {
    visitArray(pattern.properties, (property) => {
      if (property.type === "RestElement") {
        addPatternNames(property.argument, names);
      } else {
        addPatternNames(property.value, names);
      }
    });
  }
}

function addVariableNames(node, names) {
  visitArray(node.declarations, (declaration) => {
    addPatternNames(declaration.id, names);
  });
}

function addImportNames(node, names) {
  visitArray(node.specifiers, (specifier) => {
    if (specifier.local?.name) names.add(specifier.local.name);
  });
}

function collectDirectLexicalDeclarations(statements, names) {
  visitArray(statements, (statement) => {
    if (statement.type === "ImportDeclaration") {
      addImportNames(statement, names);
      return;
    }

    if (statement.type === "VariableDeclaration") {
      if (statement.kind !== "var") addVariableNames(statement, names);
      return;
    }

    const isNamedFunction = statement.type === "FunctionDeclaration";
    const isNamedClass = statement.type === "ClassDeclaration";
    const hasName = Boolean(statement.id?.name);
    const shouldAddName = (isNamedFunction || isNamedClass) && hasName;
    if (shouldAddName) {
      names.add(statement.id.name);
    }
  });
}

function isNodeRecord(node) {
  const isObjectLike = Boolean(node);
  if (!isObjectLike) return false;
  const nodeType = typeof node;
  return nodeType === "object";
}

function collectHoistedDeclarations(node, names) {
  const isNotNode = !isNodeRecord(node);
  if (isNotNode) return;

  const isVarDeclaration = node.type === "VariableDeclaration";
  const isVarKind = node.kind === "var";
  const shouldAddVarNames = isVarDeclaration && isVarKind;
  if (shouldAddVarNames) {
    addVariableNames(node, names);
    return;
  }

  const isFunctionDeclaration = node.type === "FunctionDeclaration";
  const hasFunctionName = Boolean(node.id?.name);
  const shouldAddFunctionName = isFunctionDeclaration && hasFunctionName;
  if (shouldAddFunctionName) {
    names.add(node.id.name);
    return;
  }

  if (FUNCTION_SCOPE_TYPES.has(node.type)) return;

  visitChildNodes(node, (child) => {
    collectHoistedDeclarations(child, names);
  });
}

function createProgramScope(ast) {
  const scope = createThisScope(null);
  collectDirectLexicalDeclarations(ast.body, scope.names);
  collectHoistedDeclarations(ast, scope.names);
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

function addGlobalPatternNames(pattern, names) {
  const targetNames = new Set();
  addPatternNames(pattern, targetNames);

  targetNames.forEach((targetName) => {
    if (GLOBAL_BUILTIN_NAMES.has(targetName)) names.add(targetName);
  });
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

function createBlockScope(node, parentScope) {
  const scope = createScope(parentScope);
  collectDirectLexicalDeclarations(node.body, scope.names);
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

function isIdentifierReference(node, parent) {
  if (!parent) return true;

  if (isDeclarationIdentifier(node, parent)) return false;
  if (isImportLocalIdentifier(node, parent)) return false;
  if (parent.type === "MemberExpression") return isMemberExpressionReference(node, parent);
  if (isPropertyKeyIdentifier(node, parent)) return false;
  if (isLabelIdentifier(node, parent)) return false;

  return true;
}

function isDeclarationIdentifier(node, parent) {
  const parentType = String(parent.type);
  const hasDeclarationParent = DECLARATION_ID_PARENT_TYPES.has(parentType);
  const isIdentifier = parent.id === node;
  return hasDeclarationParent && isIdentifier;
}

function isImportLocalIdentifier(node, parent) {
  const parentType = String(parent.type);
  const hasImportParent = IMPORT_LOCAL_PARENT_TYPES.has(parentType);
  const isLocal = parent.local === node;
  const isImported = parent.imported === node;
  const isImportName = isLocal || isImported;
  return hasImportParent && isImportName;
}

function isMemberExpressionReference(node, parent) {
  const isObject = parent.object === node;
  if (isObject) return true;
  return Boolean(parent.computed);
}

function isPropertyKeyIdentifier(node, parent) {
  const parentType = String(parent.type);
  const hasPropertyParent = PROPERTY_KEY_PARENT_TYPES.has(parentType);
  if (!hasPropertyParent) return false;

  const isKey = parent.key === node;
  if (!isKey) return false;
  if (parent.computed) return false;

  const isProperty = parent.type === "Property";
  const isShorthand = Boolean(parent.shorthand);
  const isValue = parent.value === node;
  const isShorthandValue = isProperty && isShorthand && isValue;
  return !isShorthandValue;
}

function isLabelIdentifier(node, parent) {
  const parentType = String(parent.type);
  const hasLabelParent = LABEL_PARENT_TYPES.has(parentType);
  const isLabel = parent.label === node;
  return hasLabelParent && isLabel;
}

function getGlobalReferenceName(node, astInfo) {
  if (astInfo.name) {
    return getMatchingIdentifierName(node, astInfo.name);
  }

  const callee = node.callee;
  const calleeObject = callee?.object;
  const calleeProperty = callee?.property;

  if (astInfo.callee) {
    return getMatchingIdentifierName(callee, astInfo.callee);
  }

  if (!astInfo.object) return null;

  const matchingObjectName = getMatchingIdentifierName(calleeObject, astInfo.object);
  if (matchingObjectName) return matchingObjectName;

  const matchingCalleeName = getMatchingIdentifierName(callee, astInfo.object);
  if (matchingCalleeName) return matchingCalleeName;

  const nestedObjectName = getNestedObjectReferenceName(calleeObject, astInfo.object);
  if (nestedObjectName) return nestedObjectName;

  const hasMatchingProperty = calleeProperty?.name === astInfo.property;
  if (!hasMatchingProperty) return null;

  return getMatchingIdentifierName(calleeObject, astInfo.object);
}

function getMatchingIdentifierName(node, expectedName) {
  const isIdentifier = node?.type === "Identifier";
  if (!isIdentifier) return null;

  const hasExpectedName = node.name === expectedName;
  if (!hasExpectedName) return null;

  return expectedName;
}

function getNestedObjectReferenceName(node, expectedName) {
  const isMemberExpression = node?.type === "MemberExpression";
  if (!isMemberExpression) return null;

  const object = node.object;
  return getMatchingIdentifierName(object, expectedName);
}

function isShadowedGlobalReference(node, astInfo, context) {
  const name = getGlobalReferenceName(node, astInfo);
  const hasName = Boolean(name);
  if (!hasName) return false;

  const isBuiltin = GLOBAL_BUILTIN_NAMES.has(name);
  if (!isBuiltin) return false;

  return isDeclared(context.scope, name);
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

function isMapConstructorExpression(node, context) {
  const isNewExpression = node?.type === "NewExpression";
  const constructorName = node?.callee?.name;
  const isMapConstructor = MAP_CONSTRUCTORS.has(constructorName);
  const isMapConstructorCall = isNewExpression && isMapConstructor;
  if (!isMapConstructorCall) return false;

  return !isDeclared(context.scope, constructorName);
}

function getStaticReferenceKey(node) {
  if (!node) return null;

  if (node.type === "Identifier") return node.name;
  if (node.type === "ThisExpression") return "this";
  if (node.type !== "MemberExpression") return null;
  const objectKey = getStaticReferenceKey(node.object);
  const propertyName = getStaticPropertyKey(node, node.property);
  const hasStaticMemberPath = Boolean(objectKey && propertyName);
  if (!hasStaticMemberPath) return null;

  return `${objectKey}.${propertyName}`;
}

function getStaticPropertyKey(node, property) {
  if (node.computed) {
    const isLiteral = property?.type === "Literal";
    return isLiteral ? JSON.stringify(String(property.value)) : null;
  }
  if (property?.type === "PrivateIdentifier") return `#${property.name}`;
  return JSON.stringify(property?.name);
}

function getReceiverRootName(key) {
  const rootName = key.split(".")[0];
  if (rootName === "this") return null;
  return rootName;
}

function isKnownMapReceiver(key, context) {
  const rootName = getReceiverRootName(key);
  let scope = context.scope;

  while (scope) {
    if (scope.mapReceivers.has(key)) return true;
    const hasShadowingRoot = rootName && scope.names.has(rootName);
    if (hasShadowingRoot) return false;
    const hasThisBoundary = !rootName && scope.ownsThis;
    if (hasThisBoundary) return false;
    scope = scope.parent;
  }

  return false;
}

function isRequiredMapReceiverMatch(node, astInfo, context) {
  if (!astInfo.requireMapReceiver) return true;

  const receiver = node.callee?.object;
  if (isMapConstructorExpression(receiver, context)) return true;

  const receiverKey = getStaticReferenceKey(receiver);
  if (!receiverKey) return false;

  return isKnownMapReceiver(receiverKey, context);
}

function isCallableFeatureMatch(node, astInfo, context) {
  const hasMatch = checkMap(node, astInfo);
  if (!hasMatch) return false;
  if (!isRequiredMapReceiverMatch(node, astInfo, context)) return false;
  if (isShadowedGlobalReference(node, astInfo, context)) return false;
  return true;
}

function matchesFeature(node, astInfo, context = {}) {
  if (astInfo.childType) {
    return node.elements?.some((el) => el?.type === astInfo.childType) || false;
  }

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

function traverseFeatures(node, context, state) {
  if (!isNodeRecord(node)) return;
  recordTopLevelAssignment(node, context);
  maybeRecordGlobalReference(node, context, state);
  recordFeatureMatches(node, context, state);
  const isFunction = FUNCTION_TYPES.has(node.type);
  const newFunctionDepth = isFunction ? context.functionDepth + 1 : context.functionDepth;
  const traversal = getScopedTraversal(node) || getFlowTraversal(node) || traverseChildFeatures;
  return traversal(node, context, state, newFunctionDepth);
}

function recordFeatureMatches(node, context, state) {
  const candidates = featuresByNodeType[node.type];
  const matchContext = Object.assign({}, context, { isTopLevel: context.functionDepth === 0 });
  visitArray(candidates, ({ name, astInfo }) => {
    if (!state.remaining.has(name)) return;
    if (!matchesFeature(node, astInfo, matchContext)) return;
    state.foundFeatures[name] = true;
    state.remaining.delete(name);
  });
}

function getScopedTraversal(node) {
  if (FUNCTION_SCOPE_TYPES.has(node.type)) return traverseFunction;
  if (node.type === "BlockStatement") return traverseBlock;
  if (node.type === "StaticBlock") return traverseBlock;
  if (node.type === "CatchClause") return traverseCatch;
  if (node.type === "ClassBody") return traverseClassBody;
  if (node.type === "MethodDefinition") return traverseMethod;
  if (node.type === "Program") return traverseProgram;
  return null;
}

function getFlowTraversal(node) {
  if (isLogicalAssignment(node)) return traverseLogicalAssignment;
  if (node.type === "LogicalExpression") return traverseGuardedLogicalExpression;
  if (node.type === "ConditionalExpression") return traverseConditionalExpression;
  if (node.type === "IfStatement") return traverseIfStatement;
  if (node.type === "ForStatement") return traverseForStatement;
  if (node.type === "ForInStatement") return traverseForInOfStatement;
  if (node.type === "ForOfStatement") return traverseForInOfStatement;
  if (node.type === "WhileStatement") return traverseWhileStatement;
  if (node.type === "DoWhileStatement") return traverseDoWhileStatement;
  if (node.type === "SwitchStatement") return traverseSwitchStatement;
  if (node.type === "TryStatement") return traverseTryStatement;
  if (node.type === "LabeledStatement") return traverseLabeledStatement;
  return null;
}

function isLogicalAssignment(node) {
  const isAssignment = node.type === "AssignmentExpression";
  const isLogical = ["&&=", "||=", "??="].includes(node.operator);
  return isAssignment && isLogical;
}

function traverseLogicalAssignment(node, context, state, newFunctionDepth) {
  const childContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.left, childContext, state);
  const key = getStaticReferenceKey(node.left);
  const isMap = Boolean(key) && isKnownMapReceiver(key, context);
  const branch = createReceiverBranchContext(
    context,
    node,
    context.guardedGlobals,
    newFunctionDepth,
  );
  traverseFeatures(node.right, branch, state);
  recordReceiverPattern(node.left, node.right, branch);
  const skipsWrite = isMap && node.operator !== "&&=";
  if (skipsWrite) return;
  const paths = isMap ? [branch.scope] : [context.scope, branch.scope];
  mergeReceiverScopes(context.scope, paths);
}

function traverseChildFeatures(node, context, state, newFunctionDepth) {
  recordPossibleReceiverThrow(node, context);
  visitChildNodes(node, (child) => {
    const isTypeof = node.type === "UnaryExpression" && node.operator === "typeof";
    const isTypeofArgument = isTypeof && node.argument === child;
    const assignmentScope = getChildAssignmentScope(node, child, context);
    const typeofDepth = isTypeofArgument ? context.typeofDepth + 1 : context.typeofDepth;
    const childContext = createChildContext(
      context,
      node,
      context.guardedGlobals,
      newFunctionDepth,
    );
    Object.assign(childContext, { assignmentScope, typeofDepth });
    traverseFeatures(child, childContext, state);
  });
  recordPossibleReceiverThrow(node, context);
  recordMapReceiver(node, context);
  if (!RECEIVER_EXIT_TYPES.has(node.type)) return;
  recordReceiverCompletion(context, node.type, node.label?.name, context.scope);
  return false;
}

function traverseFunction(node, context, state, newFunctionDepth) {
  const functionScope = createFunctionScope(node, cloneScope(context.scope));
  functionScope.isFunction = true;
  functionScope.ownsThis = node.type !== "ArrowFunctionExpression";
  const isMethod = context.parent?.type === "MethodDefinition";
  if (isMethod) copyThisReceivers(functionScope, context.scope);
  const isConstructor = isMethod && context.parent.kind === "constructor";
  if (isConstructor) functionScope.receiverExits = new Set();
  const childContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  Object.assign(childContext, { scope: functionScope, typeofDepth: 0, reachable: true });
  childContext.receiverFlow = createReceiverFlow(functionScope);
  childContext.catchReceiverThrows = false;
  childContext.loopLabels = [];
  visitArray(node.params, (param) => traverseFeatures(param, childContext, state));
  const continues = traverseFeatures(node.body, childContext, state) !== false;
  recordFunctionReceiverExits(functionScope, childContext.receiverFlow, continues);
  return functionScope;
}

function traverseProgram(node, context, state, newFunctionDepth) {
  const childContext = createAssignmentChildContext(context, node, newFunctionDepth);
  return traverseStatements(node.body, childContext, state);
}

function traverseBlock(node, context, state, newFunctionDepth) {
  const scope = createBlockScope(node, context.scope);
  const childContext = createAssignmentChildContext(context, node, newFunctionDepth);
  childContext.scope = scope;
  return traverseStatements(node.body, childContext, state);
}

function traverseCatch(node, context, state, newFunctionDepth) {
  const scope = createCatchScope(node, context.scope);
  const childContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  childContext.scope = scope;
  return traverseFeatures(node.body, childContext, state);
}

function traverseStatements(statements, context, state) {
  let childContext = context;
  let continues = true;
  visitArray(statements, (statement) => {
    const result = traverseFeatures(statement, childContext, state);
    if (result !== false) return;
    continues = false;
    const scope = cloneScope(childContext.scope);
    childContext = Object.assign({}, childContext, { scope, reachable: false });
  });
  return continues;
}

function createReceiverFlow(scope) {
  return { scope, exits: new Map() };
}

function recordReceiverCompletion(context, type, label, scope) {
  if (context.reachable === false) return;
  const flow = context.receiverFlow;
  if (!flow) return;
  let target = scope;
  while (target.names !== flow.scope.names) target = target.parent;
  const key = `${type}:${label || ""}`;
  const existing = flow.exits.get(key);
  if (existing) {
    mergeReceiverScopes(existing.scope, [existing.scope, target]);
    return;
  }
  const snapshot = cloneScope(target);
  flow.exits.set(key, { type, label, scope: snapshot });
}

function recordPossibleReceiverThrow(node, context) {
  if (!context.catchReceiverThrows) return;
  const isReference = node.type === "Identifier" && isIdentifierReference(node, context.parent);
  const canThrow = isReference || POSSIBLY_THROWING_TYPES.has(node.type);
  if (!canThrow) return;
  recordReceiverCompletion(context, "ThrowStatement", null, context.scope);
}

function recordFunctionReceiverExits(scope, flow, continues) {
  if (!scope.receiverExits) return;
  flow.exits.forEach((exit) => {
    if (exit.type === "ReturnStatement") scope.receiverExits.add(exit.scope);
  });
  if (continues) scope.receiverExits.add(cloneScope(scope));
}

function traverseMethod(node, context, state, newFunctionDepth) {
  const childContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  return traverseFeatures(node.value, childContext, state);
}

function traverseClassBody(node, context, state, newFunctionDepth) {
  const classScope = createClassBodyScope(context.scope, context.parent);
  const classContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  classContext.scope = classScope;
  const instanceScope = createThisScope(cloneScope(classScope));
  const staticScope = createThisScope(classScope);
  const instanceContext = Object.assign({}, classContext, { scope: instanceScope });
  const staticContext = Object.assign({}, classContext, { scope: staticScope });
  visitArray(node.body, (element) => {
    if (element.computed) traverseFeatures(element.key, classContext, state);
  });
  traverseClassInitializers(node, instanceContext, staticContext, state);
  traverseClassConstructor(node, instanceContext, state);
  traverseClassMethods(node, instanceContext, staticContext, state);
}

function traverseClassMethods(node, instanceContext, staticContext, state) {
  visitArray(node.body, (element) => {
    if (element.kind === "constructor") return;
    const isMethod = element.type === "MethodDefinition";
    const methodContext = element.static ? staticContext : instanceContext;
    const isDeferred = isDeferredClassField(element);
    if (isDeferred) {
      const fieldContext = Object.assign({}, methodContext, { parent: element });
      traverseFeatures(element.value, fieldContext, state);
      return;
    }
    if (!isMethod) return;
    traverseFeatures(element, methodContext, state);
  });
}

function isDeferredClassField(node) {
  const isField = node.type === "PropertyDefinition";
  return isField && FUNCTION_SCOPE_TYPES.has(node.value?.type);
}

function traverseClassInitializers(node, instanceContext, staticContext, state) {
  visitArray(node.body, (element) => {
    const elementContext = element.static ? staticContext : instanceContext;
    if (element.type === "StaticBlock") {
      traverseFeatures(element, staticContext, state);
      return;
    }
    if (element.type !== "PropertyDefinition") return;
    recordFeatureMatches(element, elementContext, state);
    const valueContext = Object.assign({}, elementContext, { parent: element });
    if (!isDeferredClassField(element)) traverseFeatures(element.value, valueContext, state);
    recordClassFieldMapReceiver(element, valueContext);
  });
}

function traverseClassConstructor(node, context, state) {
  const constructor = node.body.find((element) => element.kind === "constructor");
  if (!constructor) return;
  const scope = traverseFeatures(constructor, context, state);
  const exits = Array.from(scope.receiverExits);
  mergeReceiverScopes(scope, exits);
  copyThisReceivers(context.scope, scope);
}

function copyThisReceivers(target, source) {
  const isThisKey = (key) => key === "this" || key.startsWith("this.");
  target.mapReceivers = new Set(Array.from(source.mapReceivers).filter(isThisKey));
}

function recordClassFieldMapReceiver(node, context) {
  const propertyName = getStaticPropertyKey(node, node.key);
  if (!propertyName) return;
  const key = `this.${propertyName}`;
  recordReceiverValue(key, node.value, context);
}

function getReceiverTrackingScope(key, context) {
  const rootName = getReceiverRootName(key);
  let scope = context.scope;
  while (scope.parent) {
    const ownsReceiver = rootName ? scope.names.has(rootName) : scope.ownsThis;
    if (ownsReceiver) return scope;
    scope = scope.parent;
  }
  return scope;
}

function clearReceiverDescendants(scope, key) {
  const prefix = `${key}.`;
  scope.mapReceivers.forEach((receiver) => {
    if (receiver.startsWith(prefix)) scope.mapReceivers.delete(receiver);
  });
}

function markMapReceiver(scope, key) {
  clearReceiverDescendants(scope, key);
  scope.mapReceivers.add(key);
}

function markNonMapReceiver(scope, key) {
  clearReceiverDescendants(scope, key);
  scope.mapReceivers.delete(key);
}

function recordReceiverValue(key, value, context) {
  const scope = getReceiverTrackingScope(key, context);
  if (isMapConstructorExpression(value, context)) {
    markMapReceiver(scope, key);
    return;
  }
  markNonMapReceiver(scope, key);
}

function recordMapReceiver(node, context) {
  if (node.type === "VariableDeclarator") {
    if (node.init) recordReceiverPattern(node.id, node.init, context);
    return;
  }
  if (node.type === "AssignmentExpression") {
    const value = node.operator === "=" ? node.right : null;
    recordReceiverPattern(node.left, value, context);
    return;
  }
  if (node.type === "UpdateExpression") recordReceiverPattern(node.argument, null, context);
  const isDelete = node.type === "UnaryExpression" && node.operator === "delete";
  if (isDelete) recordReceiverPattern(node.argument, null, context);
}

function recordReceiverPattern(node, value, context) {
  const key = getStaticReferenceKey(node);
  if (key) {
    recordReceiverValue(key, value, context);
    return;
  }
  if (node?.type === "RestElement") recordReceiverPattern(node.argument, null, context);
  if (node?.type === "AssignmentPattern") recordReceiverPattern(node.left, null, context);
  if (node?.type === "ArrayPattern") {
    visitArray(node.elements, (element) => recordReceiverPattern(element, null, context));
  }
  if (node?.type === "ObjectPattern") {
    visitArray(node.properties, (property) => {
      const target = property.type === "RestElement" ? property.argument : property.value;
      recordReceiverPattern(target, null, context);
    });
  }
}

function getChildAssignmentScope(node, child, context) {
  if (!context.assignmentScope) return null;
  if (isTransparentAssignmentContainer(node)) return context.assignmentScope;
  if (isTryAssignmentChild(node, child)) return context.assignmentScope;
  if (isSwitchAssignmentChild(node, child)) return context.assignmentScope;
  if (isDoWhileBody(node, child)) return context.assignmentScope;
  return null;
}

function isTransparentAssignmentContainer(node) {
  const transparentTypes = ["Program", "ExpressionStatement", "SequenceExpression"];
  return transparentTypes.includes(node.type);
}

function isTryAssignmentChild(node, child) {
  const isTry = node.type === "TryStatement";
  const isTryBlock = node.block === child;
  const isFinallyBlock = node.finalizer === child;
  const isTryBody = isTryBlock || isFinallyBlock;
  return isTry && isTryBody;
}

function isSwitchAssignmentChild(node, child) {
  if (node.type === "SwitchStatement") return isOnlyDefaultCase(node, child);
  if (node.type !== "SwitchCase") return false;

  const isDefault = node.test == null;
  const isConsequent = node.consequent.includes(child);
  return isDefault && isConsequent;
}

function isOnlyDefaultCase(node, child) {
  const [onlyCase] = node.cases;
  const hasOneCase = node.cases.length === 1;
  const isDefault = onlyCase?.test == null;
  const isChild = onlyCase === child;
  const isOnlyDefault = hasOneCase && isDefault;
  return isOnlyDefault && isChild;
}

function isDoWhileBody(node, child) {
  const isDoWhile = node.type === "DoWhileStatement";
  const isBody = node.body === child;
  return isDoWhile && isBody;
}

function recordTopLevelAssignment(node, context) {
  const isAssignment = node.type === "AssignmentExpression";
  if (!isAssignment) return;
  if (!context.assignmentScope) return;

  addAssignedGlobalName(node, context.assignmentScope.names);
}

function createChildContext(context, parent, guardedGlobals, newFunctionDepth) {
  return Object.assign({}, context, {
    functionDepth: newFunctionDepth,
    parent,
    assignmentScope: null,
    guardedGlobals,
  });
}

function createAssignmentChildContext(context, parent, newFunctionDepth) {
  const childContext = createChildContext(
    context,
    parent,
    context.guardedGlobals,
    newFunctionDepth,
  );
  childContext.assignmentScope = context.assignmentScope;
  return childContext;
}

function createReceiverBranchContext(context, parent, guardedGlobals, newFunctionDepth) {
  const branchContext = createChildContext(context, parent, guardedGlobals, newFunctionDepth);
  branchContext.scope = cloneScope(context.scope);
  return branchContext;
}

function traverseGuardedLogicalExpression(node, context, state, newFunctionDepth) {
  const leftContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.left, leftContext, state);
  const guardedNames = getLogicalRightGuardNames(node);
  const guardedGlobals = mergeGuardedGlobals(context.guardedGlobals, guardedNames);
  const rightContext = createReceiverBranchContext(context, node, guardedGlobals, newFunctionDepth);
  traverseFeatures(node.right, rightContext, state);
  mergeReceiverScopes(context.scope, [context.scope, rightContext.scope]);
}

function getLogicalRightGuardNames(node) {
  if (node.operator === "??") return new Set();
  if (node.operator === "&&") return collectTrueBranchTypeofNames(node.left);
  return collectFalseBranchTypeofNames(node.left);
}

function traverseConditionalExpression(node, context, state, newFunctionDepth) {
  return traverseIfStatement(node, context, state, newFunctionDepth);
}

function traverseIfStatement(node, context, state, newFunctionDepth) {
  const testContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.test, testContext, state);
  const consequentNames = collectTrueBranchTypeofNames(node.test);
  const alternateNames = collectFalseBranchTypeofNames(node.test);
  const consequent = traverseReceiverBranch(node.consequent, node, context, state, consequentNames);
  const alternate = traverseReceiverBranch(node.alternate, node, context, state, alternateNames);
  const branches = [consequent, alternate];
  const continuing = branches.filter((branch) => branch.continues);
  const incoming = continuing.length > 0 ? continuing : branches;
  mergeReceiverScopes(
    context.scope,
    incoming.map((branch) => branch.scope),
  );
  return continuing.length > 0;
}

function traverseReceiverBranch(node, parent, context, state, guardNames) {
  const guardedGlobals = mergeGuardedGlobals(context.guardedGlobals, guardNames);
  const childContext = createReceiverBranchContext(
    context,
    parent,
    guardedGlobals,
    context.functionDepth,
  );
  const continues = traverseFeatures(node, childContext, state) !== false;
  return { scope: childContext.scope, continues };
}

function traverseForStatement(node, context, state, depth) {
  const guards = context.guardedGlobals;
  const loopScope = createLoopScope(node, context.scope);
  const loopContext = createAssignmentChildContext(context, node, depth);
  loopContext.scope = loopScope;
  traverseFeatures(node.init, loopContext, state);
  const childContext = createChildContext(loopContext, node, guards, depth);
  traverseFeatures(node.test, childContext, state);
  return traverseConditionalLoop(node, childContext, state, node.update);
}

function traverseForInOfStatement(node, context, state, newFunctionDepth) {
  const loopScope = createLoopScope(node, context.scope);
  const loopContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  loopContext.scope = loopScope;
  traverseFeatures(node.right, loopContext, state);
  const iteration = createReceiverFlowContext(loopContext, node);
  traverseFeatures(node.left, iteration, state);
  recordIterationReceiver(node.left, iteration);
  const continues = traverseFeatures(node.body, iteration, state) !== false;
  const paths = getLoopReceiverPaths(iteration, continues, context.loopLabels);
  const incoming = [loopScope].concat(paths.breaks, paths.iterations);
  return finishReceiverFlow(loopContext, iteration.receiverFlow, incoming);
}

function recordIterationReceiver(node, context) {
  if (node.type !== "VariableDeclaration") {
    recordReceiverPattern(node, null, context);
    return;
  }
  visitArray(node.declarations, (declaration) => {
    recordReceiverPattern(declaration.id, null, context);
  });
}

function traverseWhileStatement(node, context, state, newFunctionDepth) {
  const testContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.test, testContext, state);
  return traverseConditionalLoop(node, testContext, state, node.test);
}

function traverseDoWhileStatement(node, context, state) {
  const iteration = createReceiverFlowContext(context, node);
  iteration.assignmentScope = context.assignmentScope;
  const continues = traverseFeatures(node.body, iteration, state) !== false;
  const paths = getLoopReceiverPaths(iteration, continues, context.loopLabels);
  const tested = traverseLoopUpdate(node.test, iteration, paths.iterations, state);
  const conditionExits = isAlwaysTrue(node.test) ? [] : tested;
  const incoming = paths.breaks.concat(conditionExits);
  return finishReceiverFlow(context, iteration.receiverFlow, incoming);
}

function createReceiverFlowContext(context, node) {
  const branch = createReceiverBranchContext(
    context,
    node,
    context.guardedGlobals,
    context.functionDepth,
  );
  branch.receiverFlow = createReceiverFlow(branch.scope);
  branch.loopLabels = [];
  return branch;
}

function consumeReceiverExits(flow, type, labels = [], allowUnlabeled = true) {
  const scopes = new Set();
  flow.exits.forEach((exit, key) => {
    const matchesType = exit.type === type;
    const matchesLabel = labels.includes(exit.label) || (allowUnlabeled && !exit.label);
    const matches = matchesType && matchesLabel;
    if (!matches) return;
    scopes.add(exit.scope);
    flow.exits.delete(key);
  });
  return Array.from(scopes);
}

function finishReceiverFlow(context, flow, incoming) {
  flow.exits.forEach(({ type, label, scope }) => {
    recordReceiverCompletion(context, type, label, scope);
  });
  mergeReceiverScopes(context.scope, incoming);
  return incoming.length > 0;
}

function getLoopReceiverPaths(context, continues, labels) {
  const flow = context.receiverFlow;
  const breaks = consumeReceiverExits(flow, "BreakStatement", labels);
  const resumed = consumeReceiverExits(flow, "ContinueStatement", labels);
  const normal = continues ? [context.scope] : [];
  const iterations = normal.concat(resumed);
  return { breaks, iterations };
}

function traverseConditionalLoop(node, context, state, update) {
  const iteration = createReceiverFlowContext(context, node);
  const continues = traverseFeatures(node.body, iteration, state) !== false;
  const paths = getLoopReceiverPaths(iteration, continues, context.loopLabels);
  const updated = traverseLoopUpdate(update, iteration, paths.iterations, state);
  const canFinish = Boolean(node.test) && !isAlwaysTrue(node.test);
  const conditionExits = canFinish ? [context.scope].concat(updated) : [];
  const incoming = paths.breaks.concat(conditionExits);
  return finishReceiverFlow(context, iteration.receiverFlow, incoming);
}

function traverseLoopUpdate(node, context, incoming, state) {
  const updateContext = createReceiverBranchContext(
    context,
    node,
    context.guardedGlobals,
    context.functionDepth,
  );
  mergeReceiverScopes(updateContext.scope, incoming);
  if (incoming.length === 0) updateContext.reachable = false;
  traverseFeatures(node, updateContext, state);
  if (incoming.length === 0) return [];
  return [updateContext.scope];
}

function isAlwaysTrue(node) {
  const isLiteral = node?.type === "Literal";
  const alwaysTrue = isLiteral && node.value === true;
  return alwaysTrue;
}

function traverseLabeledStatement(node, context, state) {
  const branch = createReceiverFlowContext(context, node);
  branch.loopLabels = (context.loopLabels || []).concat(node.label.name);
  branch.assignmentScope = context.assignmentScope;
  const continues = traverseFeatures(node.body, branch, state) !== false;
  const breaks = consumeReceiverExits(
    branch.receiverFlow,
    "BreakStatement",
    [node.label.name],
    false,
  );
  const normal = continues ? [branch.scope] : [];
  return finishReceiverFlow(context, branch.receiverFlow, normal.concat(breaks));
}

function traverseSwitchStatement(node, context, state, newFunctionDepth) {
  const testContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.discriminant, testContext, state);
  const scope = createSwitchScope(node, context.scope);
  const switchContext = Object.assign({}, testContext, { scope });
  switchContext.receiverFlow = createReceiverFlow(scope);
  const branches = new Set();
  let fallthrough = null;
  visitArray(node.cases, (switchCase, index) => {
    const branch = traverseSwitchCase(switchCase, node, switchContext, state, fallthrough, context);
    const isExit = branch.continues && index === node.cases.length - 1;
    if (isExit) branches.add(branch.scope);
    fallthrough = branch.continues ? branch.scope : null;
  });
  const hasDefault = node.cases.some((switchCase) => switchCase.test === null);
  if (!hasDefault) branches.add(scope);
  const exits = Array.from(branches);
  const breaks = consumeReceiverExits(switchContext.receiverFlow, "BreakStatement");
  return finishReceiverFlow(
    testContext,
    switchContext.receiverFlow,
    exits.concat(breaks).map((branch) => branch.parent),
  );
}

function traverseSwitchCase(node, parent, context, state, fallthrough, outerContext) {
  const branch = createReceiverBranchContext(
    context,
    parent,
    context.guardedGlobals,
    context.functionDepth,
  );
  if (fallthrough) mergeReceiverScopes(branch.scope, [branch.scope, fallthrough]);
  if (isOnlyDefaultCase(parent, node)) branch.assignmentScope = outerContext.assignmentScope;
  traverseFeatures(node.test, branch, state);
  branch.continues = traverseStatements(node.consequent, branch, state);
  return branch;
}

function traverseTryStatement(node, context, state) {
  const branch = createReceiverFlowContext(context, node);
  branch.assignmentScope = context.assignmentScope;
  branch.catchReceiverThrows = true;
  const continues = traverseFeatures(node.block, branch, state) !== false;
  const normal = continues ? [cloneScope(branch.scope)] : [];
  const caught = traverseReceiverHandler(node, branch, state);
  const incoming = normal.concat(caught);
  if (node.finalizer) return traverseReceiverFinalizer(node, context, branch, incoming, state);
  return finishReceiverFlow(context, branch.receiverFlow, incoming);
}

function traverseReceiverHandler(node, context, state) {
  if (!node.handler) return [];
  const thrown = consumeReceiverExits(context.receiverFlow, "ThrowStatement");
  const handler = createReceiverBranchContext(
    context,
    node,
    context.guardedGlobals,
    context.functionDepth,
  );
  mergeReceiverScopes(handler.scope, thrown);
  if (thrown.length === 0) handler.reachable = false;
  const continues = traverseFeatures(node.handler, handler, state) !== false;
  const canContinue = continues && thrown.length > 0;
  if (!canContinue) return [];
  return [handler.scope];
}

function traverseReceiverFinalizer(node, context, branch, incoming, state) {
  const flow = branch.receiverFlow;
  const exits = Array.from(flow.exits.values());
  const groups = groupFinalizerReceivers(branch.scope, incoming, exits);
  const receiverState = getFinalizerReceiverState(node, branch, groups, state);
  flow.exits.clear();
  const normal = groups.flatMap((group) =>
    finalizeReceiverPaths(node, branch, group, receiverState),
  );
  return finishReceiverFlow(context, flow, normal);
}

function groupFinalizerReceivers(scope, incoming, exits) {
  const normal = cloneScope(scope);
  mergeReceiverScopes(normal, incoming);
  const paths =
    incoming.length > 0 ? [{ scope: normal, type: null, label: null }].concat(exits) : exits;
  const groups = new Map();
  paths.forEach((path) => {
    const key = JSON.stringify(getReceiverScopeState(path.scope));
    const existing = groups.get(key);
    if (existing) {
      existing.completions.add(path);
      return;
    }
    const completions = new Set([path]);
    groups.set(key, { scope: path.scope, completions });
  });
  return Array.from(groups.values());
}

function getReceiverScopeState(scope) {
  if (!scope) return null;
  const receivers = Array.from(scope.mapReceivers).sort();
  const names = Array.from(scope.names).sort();
  const parent = getReceiverScopeState(scope.parent);
  return [receivers, names, scope.ownsThis, parent];
}

function getFinalizerReceiverState(node, context, groups, state) {
  if (groups.length === 1) return state;
  const analysis = createReceiverFlowContext(context, node);
  analysis.assignmentScope = context.assignmentScope;
  const scopes = groups.map((group) => group.scope);
  mergeReceiverScopes(analysis.scope, scopes);
  const hasFeatures = state.remaining.size > 0 || state.remainingGlobals.size > 0;
  if (hasFeatures) traverseFeatures(node.finalizer, analysis, state);
  return {
    remaining: new Set(),
    remainingGlobals: new Set(),
    foundFeatures: {},
    receiverCache: state.receiverCache,
  };
}

function finalizeReceiverPaths(node, context, group, state) {
  const result = traverseFinalizerGroup(node, context, group, state);
  forwardFinalizerExits(context, result);
  if (!result.continues) return [];
  let normal = false;
  group.completions.forEach(({ type, label }) => {
    if (type) recordReceiverCompletion(context, type, label, result.scope);
    else normal = true;
  });
  return normal ? [result.scope] : [];
}

function traverseFinalizerGroup(node, context, group, state) {
  const branch = createReceiverFlowContext(context, node);
  branch.assignmentScope = context.assignmentScope;
  mergeReceiverScopes(branch.scope, [group.scope]);
  const cache = getFinalizerCache(node.finalizer, state);
  const key = JSON.stringify(getReceiverScopeState(branch.scope));
  const cached = cache?.get(key);
  if (cached) return restoreFinalizerResult(branch.scope, cached);
  const continues = traverseFeatures(node.finalizer, branch, state) !== false;
  const exits = Array.from(branch.receiverFlow.exits.values());
  const result = { scope: branch.scope, continues, exits };
  if (cache) cache.set(key, result);
  return result;
}

function getFinalizerCache(node, state) {
  const hasFeatures = state.remaining.size > 0 || state.remainingGlobals.size > 0;
  if (hasFeatures) return null;
  if (!state.receiverCache.has(node)) state.receiverCache.set(node, new Map());
  return state.receiverCache.get(node);
}

function restoreFinalizerResult(scope, cached) {
  mergeReceiverScopes(scope, [cached.scope]);
  const exits = cached.exits.map((exit) => {
    const snapshot = cloneScope(scope);
    mergeReceiverScopes(snapshot, [exit.scope]);
    return Object.assign({}, exit, { scope: snapshot });
  });
  return { scope, continues: cached.continues, exits };
}

function forwardFinalizerExits(context, result) {
  result.exits.forEach(({ type, label, scope }) => {
    recordReceiverCompletion(context, type, label, scope);
  });
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

function addTypeofComparisonName(node, branchValue, names) {
  const comparison = getTypeofComparison(node);
  if (!comparison) return false;

  const guardedBranch = getTypeofComparisonGuardBranch(comparison);
  if (guardedBranch === branchValue) {
    names.add(comparison.name);
  }
  return true;
}

function getTypeofComparisonGuardBranch(comparison) {
  const isEqual = comparison.operator === "===" || comparison.operator === "==";
  const isUndefined = comparison.value === "undefined";
  if (isUndefined) return !isEqual;
  return isEqual;
}

function getTypeofComparison(node) {
  if (node.type !== "BinaryExpression") return null;
  if (!isTypeofComparisonOperator(node.operator)) return null;

  const leftComparison = getTypeofComparisonSide(node.left, node.right);
  if (leftComparison) {
    return Object.assign({}, leftComparison, { operator: node.operator });
  }

  const rightComparison = getTypeofComparisonSide(node.right, node.left);
  if (!rightComparison) return null;
  return Object.assign({}, rightComparison, { operator: node.operator });
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

function isFalseLiteral(node) {
  const isLiteral = node?.type === "Literal";
  const isFalse = node?.value === false;
  return isLiteral && isFalse;
}

function shouldSkipBranchGuard(node, branchValue) {
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

function detectFeaturesFromAST(ast) {
  const foundFeatures = Object.create(null);
  visitArray(Object.keys(ES_FEATURES), (key) => {
    foundFeatures[key] = false;
  });
  visitArray(Object.keys(ES_GLOBAL_MIN_VERSION), (key) => {
    if (foundFeatures[key] === undefined) foundFeatures[key] = false;
  });

  const remaining = new Set(Object.keys(ES_FEATURES));
  const remainingGlobals = new Set(Object.keys(ES_GLOBAL_MIN_VERSION));
  const scope = createProgramScope(ast);
  traverseFeatures(
    ast,
    {
      scope,
      functionDepth: 0,
      parent: null,
      assignmentScope: scope,
      typeofDepth: 0,
      guardedGlobals: new Set(),
    },
    { foundFeatures, remaining, remainingGlobals, receiverCache: new WeakMap() },
  );

  return foundFeatures;
}

module.exports = {
  normalizeNodeType,
  buildFeatureIndex,
  matchesFeature,
  detectFeaturesFromAST,
  getGlobalReferenceName,
  isIdentifierReference,
};
