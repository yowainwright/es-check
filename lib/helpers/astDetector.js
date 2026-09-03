const { ES_FEATURES } = require("../constants");
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
  return { parent, names: new Set() };
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
  const scope = createScope();
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

function isCallableFeatureMatch(node, astInfo, context) {
  const hasMatch = checkMap(node, astInfo);
  if (!hasMatch) return false;
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
  const isNotNode = !isNodeRecord(node);
  if (isNotNode) return;

  const hasNoRemainingFeatures = state.remaining.size === 0;
  const hasNoRemainingGlobals = state.remainingGlobals.size === 0;
  const hasNoRemainingChecks = hasNoRemainingFeatures && hasNoRemainingGlobals;
  if (hasNoRemainingChecks) return;

  recordTopLevelAssignment(node, context);
  maybeRecordGlobalReference(node, context, state);

  const { scope, functionDepth, parent } = context;
  const isFunction = FUNCTION_TYPES.has(node.type);
  const newFunctionDepth = isFunction ? functionDepth + 1 : functionDepth;

  const shouldCheckFeatureMatches = state.remaining.size > 0;
  const candidates = shouldCheckFeatureMatches ? featuresByNodeType[node.type] : null;
  if (candidates) {
    const matchContext = {
      isTopLevel: functionDepth === 0,
      parent,
      scope,
    };

    visitArray(candidates, ({ name, astInfo }) => {
      if (!state.remaining.has(name)) return;
      if (matchesFeature(node, astInfo, matchContext)) {
        state.foundFeatures[name] = true;
        state.remaining.delete(name);
      }
    });
  }

  if (FUNCTION_SCOPE_TYPES.has(node.type)) {
    const functionScope = createFunctionScope(node, scope);
    visitArray(node.params, (param) => {
      traverseFeatures(
        param,
        {
          scope: functionScope,
          functionDepth: newFunctionDepth,
          parent: node,
          assignmentScope: null,
          typeofDepth: 0,
          guardedGlobals: context.guardedGlobals,
        },
        state,
      );
    });
    traverseFeatures(
      node.body,
      {
        scope: functionScope,
        functionDepth: newFunctionDepth,
        parent: node,
        assignmentScope: null,
        typeofDepth: 0,
        guardedGlobals: context.guardedGlobals,
      },
      state,
    );
    return;
  }

  if (node.type === "BlockStatement") {
    const blockScope = createBlockScope(node, scope);
    visitArray(node.body, (child) => {
      traverseFeatures(
        child,
        {
          scope: blockScope,
          functionDepth: newFunctionDepth,
          parent: node,
          assignmentScope: context.assignmentScope,
          typeofDepth: context.typeofDepth,
          guardedGlobals: context.guardedGlobals,
        },
        state,
      );
    });
    return;
  }

  if (node.type === "CatchClause") {
    const catchScope = createCatchScope(node, scope);
    traverseFeatures(
      node.body,
      {
        scope: catchScope,
        functionDepth: newFunctionDepth,
        parent: node,
        assignmentScope: null,
        typeofDepth: context.typeofDepth,
        guardedGlobals: context.guardedGlobals,
      },
      state,
    );
    return;
  }

  const isGuardedLogicalExpression = isGuardedLogicalOperator(node);
  if (isGuardedLogicalExpression) {
    traverseGuardedLogicalExpression(node, context, state, newFunctionDepth);
    return;
  }

  if (node.type === "ConditionalExpression") {
    traverseConditionalExpression(node, context, state, newFunctionDepth);
    return;
  }

  if (node.type === "IfStatement") {
    traverseIfStatement(node, context, state, newFunctionDepth);
    return;
  }

  if (node.type === "ForStatement") {
    traverseForStatement(node, context, state, newFunctionDepth);
    return;
  }

  visitChildNodes(node, (child) => {
    const isUnary = node.type === "UnaryExpression";
    const isTypeof = node.operator === "typeof";
    const isArgument = node.argument === child;
    const isTypeofArgument = isUnary && isTypeof && isArgument;
    const assignmentScope = getChildAssignmentScope(node, child, context);
    const typeofDepth = isTypeofArgument ? context.typeofDepth + 1 : context.typeofDepth;
    traverseFeatures(
      child,
      {
        scope,
        functionDepth: newFunctionDepth,
        parent: node,
        assignmentScope,
        typeofDepth,
        guardedGlobals: context.guardedGlobals,
      },
      state,
    );
  });
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
  return {
    scope: context.scope,
    functionDepth: newFunctionDepth,
    parent,
    assignmentScope: null,
    typeofDepth: context.typeofDepth,
    guardedGlobals,
  };
}

function createAssignmentChildContext(context, parent, newFunctionDepth) {
  return {
    scope: context.scope,
    functionDepth: newFunctionDepth,
    parent,
    assignmentScope: context.assignmentScope,
    typeofDepth: context.typeofDepth,
    guardedGlobals: context.guardedGlobals,
  };
}

function isGuardedLogicalOperator(node) {
  const isLogical = node.type === "LogicalExpression";
  const isGuardOperator = node.operator === "&&" || node.operator === "||";
  return isLogical && isGuardOperator;
}

function traverseGuardedLogicalExpression(node, context, state, newFunctionDepth) {
  const leftContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.left, leftContext, state);

  const guardedNames = getLogicalRightGuardNames(node);
  const guardedGlobals = mergeGuardedGlobals(context.guardedGlobals, guardedNames);
  const rightContext = createChildContext(context, node, guardedGlobals, newFunctionDepth);
  traverseFeatures(node.right, rightContext, state);
}

function getLogicalRightGuardNames(node) {
  const isAndOperator = node.operator === "&&";
  if (isAndOperator) return collectTrueBranchTypeofNames(node.left);

  return collectFalseBranchTypeofNames(node.left);
}

function traverseConditionalExpression(node, context, state, newFunctionDepth) {
  const testContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.test, testContext, state);

  const consequentGlobals = collectTrueBranchTypeofNames(node.test);
  const guardedGlobals = mergeGuardedGlobals(context.guardedGlobals, consequentGlobals);
  const consequentContext = createChildContext(context, node, guardedGlobals, newFunctionDepth);
  traverseFeatures(node.consequent, consequentContext, state);

  const alternateGlobals = collectFalseBranchTypeofNames(node.test);
  const alternateGuardedGlobals = mergeGuardedGlobals(context.guardedGlobals, alternateGlobals);
  const alternateContext = createChildContext(
    context,
    node,
    alternateGuardedGlobals,
    newFunctionDepth,
  );
  traverseFeatures(node.alternate, alternateContext, state);
}

function traverseIfStatement(node, context, state, newFunctionDepth) {
  const testContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.test, testContext, state);

  const consequentGlobals = collectTrueBranchTypeofNames(node.test);
  const guardedGlobals = mergeGuardedGlobals(context.guardedGlobals, consequentGlobals);
  const consequentContext = createChildContext(context, node, guardedGlobals, newFunctionDepth);
  traverseFeatures(node.consequent, consequentContext, state);

  if (!node.alternate) return;
  const alternateGlobals = collectFalseBranchTypeofNames(node.test);
  const alternateGuardedGlobals = mergeGuardedGlobals(context.guardedGlobals, alternateGlobals);
  const alternateContext = createChildContext(
    context,
    node,
    alternateGuardedGlobals,
    newFunctionDepth,
  );
  traverseFeatures(node.alternate, alternateContext, state);
}

function traverseForStatement(node, context, state, newFunctionDepth) {
  const initContext = createAssignmentChildContext(context, node, newFunctionDepth);
  traverseFeatures(node.init, initContext, state);

  const childContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.test, childContext, state);
  traverseFeatures(node.update, childContext, state);
  traverseFeatures(node.body, childContext, state);
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

  const target = getTypeofArgumentTarget(typeofNode.argument);
  if (!target) return null;
  return { name: target, value: valueNode.value };
}

function getTypeofArgumentTarget(argument) {
  const target = argument?.type === "MemberExpression" ? argument.object : argument;
  const targetName = target?.type === "Identifier" ? target.name : null;
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

  const isOr = node.operator === "||";
  const isNullish = node.operator === "??";
  const isTruthyOr = isOr && branchValue;
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
    { foundFeatures, remaining, remainingGlobals },
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
