const {
  ARRAY_CONSTRUCTOR_FUNCTIONS,
  ARRAY_LIKE_NAMES,
  ARRAY_METHODS,
  COMMON_NON_ARRAY_NAMES,
  COMMON_NON_SET_NAMES,
  SET_LIKE_NAMES,
} = require("../../constants");
const {
  FUNCTION_SCOPE_TYPES,
  DECLARATION_ID_PARENT_TYPES,
  IMPORT_LOCAL_PARENT_TYPES,
  PROPERTY_KEY_PARENT_TYPES,
  LABEL_PARENT_TYPES,
  CHILD_KEYS,
} = require("./constants");

function checkMap(node, astInfo) {
  const callee = node.callee;
  const calleeObject = callee?.object;
  const calleeObjectName = calleeObject?.name;
  const calleePropertyName = getStaticPropertyName(callee);

  const hasKindMismatch = astInfo.kind && node.kind !== astInfo.kind;
  const hasOperatorMismatch = astInfo.operator && node.operator !== astInfo.operator;
  const hasCalleeMismatch = astInfo.callee && (!callee || callee.name !== astInfo.callee);

  const hasCalleeObject = calleeObjectName === astInfo.object;
  const hasCalleeIdentifier = callee?.type === "Identifier" && callee?.name === astInfo.object;
  const hasPropertyMismatch = astInfo.property && calleePropertyName !== astInfo.property;
  const hasPropertyMatch = calleePropertyName === astInfo.property;
  const shouldExclude = astInfo.excludeObjects?.includes(calleeObjectName);

  const needsObjectAndProperty = astInfo.object && astInfo.property;
  const hasObjectAndPropertyMismatch =
    needsObjectAndProperty && !(hasCalleeObject && hasPropertyMatch);

  const hasObjectPropertyMismatch =
    !needsObjectAndProperty && astInfo.object && hasCalleeObject && hasPropertyMismatch;
  const needsObjectOnly = !needsObjectAndProperty && astInfo.object;
  const hasNoCalleeObjectMatch = !hasCalleeObject && !hasCalleeIdentifier;
  const hasObjectButNoMatch = needsObjectOnly && hasNoCalleeObjectMatch;
  const hasPropertyWithoutMatch = astInfo.property && !astInfo.object && !hasPropertyMatch;
  const hasPropertyWithExclusion =
    astInfo.property && !astInfo.object && hasPropertyMatch && shouldExclude;

  const hasOptionsCauseMismatch = astInfo.hasOptionsCause && !hasOptionsCause(node);

  const callerType = calleeObject?.type;
  const hasExcludedCallerType = astInfo.excludeCallerTypes?.includes(callerType);

  const hasNumericArgMismatch = astInfo.requireNumericArg && !hasNumericArgument(node);

  const hasArrayLikeCallMismatch = astInfo.requireArrayLikeCall && !isArrayLikeCall(node);

  const hasSetLikeCallMismatch = astInfo.requireSetLikeCall && !isSetLikeCall(node);

  const mismatchChecks = [
    hasKindMismatch || hasOperatorMismatch || hasCalleeMismatch || hasObjectPropertyMismatch,
    hasObjectButNoMatch ||
      hasPropertyWithoutMatch ||
      hasPropertyWithExclusion ||
      hasObjectAndPropertyMismatch,
    hasOptionsCauseMismatch ||
      hasExcludedCallerType ||
      hasNumericArgMismatch ||
      hasArrayLikeCallMismatch,
    hasSetLikeCallMismatch,
  ];
  const hasMismatch = mismatchChecks.includes(true);

  if (hasMismatch) return false;

  return true;
}

function createThisScope(parent) {
  const scope = createScope(parent);
  scope.ownsThis = true;
  return scope;
}

function createScope(parent = null) {
  return {
    parent,
    names: new Set(),
    receiverTypes: new Map(),
    ownsThis: false,
    isFunction: false,
    receiverExits: null,
  };
}

function isDeclared(scope, name) {
  let current = scope;
  while (current) {
    if (current.names.has(name)) return true;
    current = current.parent;
  }
  return false;
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

function addVariableNames(node, names) {
  visitArray(node.declarations, (declaration) => {
    addPatternNames(declaration.id, names);
  });
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

function isNodeRecord(node) {
  const isObjectLike = Boolean(node);
  if (!isObjectLike) return false;
  const nodeType = typeof node;
  return nodeType === "object";
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
  if (property?.type === "PrivateIdentifier") return `#${property.name}`;
  const name = getStaticPropertyName(node, property);
  if (name == null) return null;
  return JSON.stringify(name);
}

function getStaticPropertyName(node, property = node?.property) {
  if (property?.type === "PrivateIdentifier") return null;
  if (!node?.computed) return property?.name;
  const isLiteral = property?.type === "Literal";
  if (!isLiteral) return null;
  return String(property.value);
}

function getReceiverRootName(key) {
  const rootName = key.split(".")[0];
  if (rootName === "this") return null;
  return rootName;
}

function isDeferredClassField(node) {
  const isField = node.type === "PropertyDefinition";
  return isField && FUNCTION_SCOPE_TYPES.has(node.value?.type);
}

function copyThisReceivers(target, source) {
  const isThisKey = ([key]) => key === "this" || key.startsWith("this.");
  target.receiverTypes = new Map(Array.from(source.receiverTypes).filter(isThisKey));
}

function getChildAssignmentScope(node, child, context) {
  if (!context.assignmentScope) return null;
  if (isTransparentAssignmentContainer(node)) return context.assignmentScope;
  if (isTryAssignmentChild(node, child)) return context.assignmentScope;
  if (isSwitchAssignmentChild(node, child)) return context.assignmentScope;
  if (isDoWhileBody(node, child)) return context.assignmentScope;
  return null;
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

function cloneScope(scope) {
  if (!scope) return null;
  const parent = cloneScope(scope.parent);
  const receiverTypes = new Map(scope.receiverTypes);
  return Object.assign({}, scope, { parent, receiverTypes });
}

function createChildContext(context, parent, guardedGlobals, newFunctionDepth) {
  return Object.assign({}, context, {
    functionDepth: newFunctionDepth,
    parent,
    assignmentScope: null,
    guardedGlobals,
  });
}

function isAlwaysTrue(node) {
  const isLiteral = node?.type === "Literal";
  const alwaysTrue = isLiteral && node.value === true;
  return alwaysTrue;
}

function getReceiverScopeState(scope) {
  if (!scope) return null;
  const receivers = Array.from(scope.receiverTypes).sort();
  const names = Array.from(scope.names).sort();
  const parent = getReceiverScopeState(scope.parent);
  return [receivers, names, scope.ownsThis, parent];
}

function visitArray(items, visitor) {
  if (!Array.isArray(items)) return;

  let index = 0;
  while (index < items.length) {
    visitor(items[index], index);
    index += 1;
  }
}

function isOnlyDefaultCase(node, child) {
  const [onlyCase] = node.cases;
  const hasOneCase = node.cases.length === 1;
  const isDefault = onlyCase?.test == null;
  const isChild = onlyCase === child;
  const isOnlyDefault = hasOneCase && isDefault;
  return isOnlyDefault && isChild;
}

function hasOptionsCause(node) {
  const args = node.arguments;
  const hasTooFewArgs = !args || args.length < 2;
  if (hasTooFewArgs) return false;

  const optionsArg = args[1];
  if (optionsArg?.type !== "ObjectExpression") return false;

  return optionsArg.properties?.some(isCauseProperty);
}

function isCauseProperty(prop) {
  const isProperty = prop.type === "Property";
  const hasIdentifierKey = prop.key?.type === "Identifier";
  const isCauseKey = prop.key?.name === "cause";
  const hasCauseProperty = isProperty && hasIdentifierKey && isCauseKey;
  return hasCauseProperty;
}

function hasNumericArgument(node) {
  const args = node.arguments;
  const hasArgs = args && args.length === 1;
  if (!hasArgs) return false;

  const arg = args[0];
  const isNumericLiteral = arg.type === "Literal" && typeof arg.value === "number";

  const isUnaryExpression = arg.type === "UnaryExpression";
  const isNegationOperator = arg.operator === "-";
  const hasNumericLiteralArgument =
    arg.argument?.type === "Literal" && typeof arg.argument.value === "number";
  const isNegativeNumeric = isUnaryExpression && isNegationOperator && hasNumericLiteralArgument;

  return isNumericLiteral || isNegativeNumeric;
}

function isArrayLikeCall(node) {
  const callee = node.callee;
  const calleeObject = callee?.object;
  const hasCalleeObject = calleeObject != null;

  if (!hasCalleeObject) return false;

  const isArrayExpr = isArrayExpression(calleeObject);
  const isArrayIdent = isArrayLikeIdentifier(calleeObject);
  const isArrayConstr = isArrayConstructorCall(calleeObject);
  const isArray = isArrayExpr || isArrayIdent || isArrayConstr;

  return isArray;
}

function isArrayExpression(calleeObject) {
  return calleeObject.type === "ArrayExpression";
}

function isArrayLikeIdentifier(calleeObject) {
  const isIdentifier = calleeObject.type === "Identifier";
  if (!isIdentifier) return false;

  const objectName = calleeObject.name.toLowerCase();

  const isCommonNonArrayName = COMMON_NON_ARRAY_NAMES.has(objectName);
  if (isCommonNonArrayName) return false;

  return ARRAY_LIKE_NAMES.has(objectName);
}

function isArrayConstructorCall(calleeObject) {
  const isCallExpression = calleeObject.type === "CallExpression";
  if (!isCallExpression) return false;

  const innerCallee = calleeObject.callee;
  const isIdentifierCallee = innerCallee?.type === "Identifier";
  const isMemberExpressionCallee = innerCallee?.type === "MemberExpression";

  if (isIdentifierCallee) {
    const functionName = innerCallee.name;
    return ARRAY_CONSTRUCTOR_FUNCTIONS.has(functionName);
  }

  if (isMemberExpressionCallee) {
    const innerProperty = innerCallee.property;
    const hasPropertyName = innerProperty?.name;
    const isArrayMethod = hasPropertyName && ARRAY_METHODS.has(innerProperty.name);
    return isArrayMethod;
  }

  return false;
}

function isSetLikeCall(node) {
  const calleeObject = node.callee?.object;
  if (!calleeObject) return false;

  return isSetConstructorCall(calleeObject) || isSetLikeIdentifier(calleeObject);
}

function isSetConstructorCall(calleeObject) {
  const isNewSet = calleeObject.type === "NewExpression" && calleeObject.callee?.name === "Set";
  if (isNewSet) {
    return true;
  }
  return false;
}

function isSetLikeIdentifier(calleeObject) {
  if (calleeObject.type !== "Identifier") return false;
  const name = calleeObject.name.toLowerCase();
  if (COMMON_NON_SET_NAMES.has(name)) return false;
  const hasKnownSetName = SET_LIKE_NAMES.has(name);
  const hasSetPrefix = name.startsWith("set");
  const hasSetSuffix = name.endsWith("set");
  const isSetLike = hasKnownSetName || hasSetPrefix || hasSetSuffix;
  return isSetLike;
}

function addImportNames(node, names) {
  visitArray(node.specifiers, (specifier) => {
    if (specifier.local?.name) names.add(specifier.local.name);
  });
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

function getNestedObjectReferenceName(node, expectedName) {
  const isMemberExpression = node?.type === "MemberExpression";
  if (!isMemberExpression) return null;

  const object = node.object;
  return getMatchingIdentifierName(object, expectedName);
}

function getMatchingIdentifierName(node, expectedName) {
  const isIdentifier = node?.type === "Identifier";
  if (!isIdentifier) return null;

  const hasExpectedName = node.name === expectedName;
  if (!hasExpectedName) return null;

  return expectedName;
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

function isDoWhileBody(node, child) {
  const isDoWhile = node.type === "DoWhileStatement";
  const isBody = node.body === child;
  return isDoWhile && isBody;
}

module.exports = {
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
  createChildContext,
  createReceiverBranchContext,
  getChildAssignmentScope,
  cloneScope,
  copyThisReceivers,
  createAssignmentChildContext,
  isDeferredClassField,
  getStaticPropertyKey,
  isAlwaysTrue,
  getReceiverScopeState,
  isOnlyDefaultCase,
};
