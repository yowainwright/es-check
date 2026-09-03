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
  collectTopLevelAssignedGlobalNames(ast.body, scope.names);
  return scope;
}

function collectTopLevelAssignedGlobalNames(statements, names) {
  visitArray(statements, (statement) => {
    const expression = statement.type === "ExpressionStatement" ? statement.expression : null;
    addAssignedGlobalName(expression, names);
  });
}

function addAssignedGlobalName(expression, names) {
  const isAssignment = expression?.type === "AssignmentExpression";
  const target = isAssignment ? expression.left : null;
  const targetName = target?.type === "Identifier" ? target.name : null;
  const isGlobalTarget = targetName && GLOBAL_BUILTIN_NAMES.has(targetName);
  if (isGlobalTarget) names.add(targetName);
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
        typeofDepth: context.typeofDepth,
        guardedGlobals: context.guardedGlobals,
      },
      state,
    );
    return;
  }

  const isAndExpression = node.type === "LogicalExpression" && node.operator === "&&";
  if (isAndExpression) {
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

  visitChildNodes(node, (child) => {
    const isUnary = node.type === "UnaryExpression";
    const isTypeof = node.operator === "typeof";
    const isArgument = node.argument === child;
    const isTypeofArgument = isUnary && isTypeof && isArgument;
    const typeofDepth = isTypeofArgument ? context.typeofDepth + 1 : context.typeofDepth;
    traverseFeatures(
      child,
      {
        scope,
        functionDepth: newFunctionDepth,
        parent: node,
        typeofDepth,
        guardedGlobals: context.guardedGlobals,
      },
      state,
    );
  });
}

function createChildContext(context, parent, guardedGlobals, newFunctionDepth) {
  return {
    scope: context.scope,
    functionDepth: newFunctionDepth,
    parent,
    typeofDepth: context.typeofDepth,
    guardedGlobals,
  };
}

function traverseGuardedLogicalExpression(node, context, state, newFunctionDepth) {
  const leftContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.left, leftContext, state);

  const guardedGlobals = mergeGuardedGlobals(context.guardedGlobals, collectTypeofNames(node.left));
  const rightContext = createChildContext(context, node, guardedGlobals, newFunctionDepth);
  traverseFeatures(node.right, rightContext, state);
}

function traverseConditionalExpression(node, context, state, newFunctionDepth) {
  const testContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.test, testContext, state);

  const guardedGlobals = mergeGuardedGlobals(context.guardedGlobals, collectTypeofNames(node.test));
  const consequentContext = createChildContext(context, node, guardedGlobals, newFunctionDepth);
  traverseFeatures(node.consequent, consequentContext, state);

  const alternateContext = createChildContext(
    context,
    node,
    context.guardedGlobals,
    newFunctionDepth,
  );
  traverseFeatures(node.alternate, alternateContext, state);
}

function traverseIfStatement(node, context, state, newFunctionDepth) {
  const testContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.test, testContext, state);

  const guardedGlobals = mergeGuardedGlobals(context.guardedGlobals, collectTypeofNames(node.test));
  const consequentContext = createChildContext(context, node, guardedGlobals, newFunctionDepth);
  traverseFeatures(node.consequent, consequentContext, state);

  if (!node.alternate) return;
  const alternateContext = createChildContext(
    context,
    node,
    context.guardedGlobals,
    newFunctionDepth,
  );
  traverseFeatures(node.alternate, alternateContext, state);
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

function collectTypeofNames(node) {
  const names = new Set();
  collectTypeofNamesFromNode(node, names);
  return names;
}

function collectTypeofNamesFromNode(node, names) {
  const isNotNode = !isNodeRecord(node);
  if (isNotNode) return;
  if (FUNCTION_SCOPE_TYPES.has(node.type)) return;

  const isTypeof = node.type === "UnaryExpression" && node.operator === "typeof";
  if (isTypeof) {
    addTypeofArgumentName(node.argument, names);
    return;
  }

  visitChildNodes(node, (child) => {
    collectTypeofNamesFromNode(child, names);
  });
}

function addTypeofArgumentName(argument, names) {
  const target = argument?.type === "MemberExpression" ? argument.object : argument;
  const targetName = target?.type === "Identifier" ? target.name : null;
  const isGlobalTarget = targetName && GLOBAL_BUILTIN_NAMES.has(targetName);
  if (isGlobalTarget) names.add(targetName);
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
