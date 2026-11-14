const { ES_FEATURES, ES_GLOBAL_MIN_VERSION } = require("../../../constants/es");
const {
  FUNCTION_TYPES,
  FUNCTION_SCOPE_TYPES,
  RECEIVER_EXIT_TYPES,
  POSSIBLY_THROWING_TYPES,
} = require("../constants");
const {
  visitArray,
  createThisScope,
  getGlobalReferenceName,
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
} = require("../utils");
const {
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
} = require("./utils");

const featuresByNodeType = buildFeatureIndex(ES_FEATURES);

function detectFeaturesFromAST(ast, sourceCode, featureReceivers) {
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
    {
      foundFeatures,
      remaining,
      remainingGlobals,
      receiverCache: new WeakMap(),
      sourceCode,
      featureReceivers,
    },
  );

  return foundFeatures;
}

function detectInstalledPropertiesFromAST(ast) {
  const paths = new Set();
  const scope = createProgramScope(ast);
  ast.body.every((node) => collectInstalledPropertyPaths(node, paths, scope));
  return paths;
}

function detectResourceManagementFromAST(ast, features = new Set()) {
  const isDeclaration = ast.type === "VariableDeclaration";
  if (isDeclaration) {
    if (ast.kind === "using") features.add("UsingDeclarations");
    if (ast.kind === "await using") features.add("AwaitUsingDeclarations");
  }
  visitChildNodes(ast, (child) => detectResourceManagementFromAST(child, features));
  return features;
}

function traverseLogicalAssignment(node, context, state, newFunctionDepth) {
  const childContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.left, childContext, state);
  const kind = getReceiverType(node.left, context);
  const branch = createReceiverBranchContext(
    context,
    node,
    context.guardedGlobals,
    newFunctionDepth,
  );
  traverseFeatures(node.right, branch, state);
  recordReceiverPattern(node.left, node.right, branch);
  const paths = getLogicalAssignmentScopes(node.operator, kind, context.scope, branch.scope);
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
  recordReceiver(node, context);
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
  recordJSONReviverContext(node, context, functionScope);
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
  traverseFeatures(node.param, childContext, state);
  return traverseFeatures(node.body, childContext, state);
}

function traverseAssignmentPattern(node, context, state, newFunctionDepth) {
  const branch = traverseReceiverBranch(node.right, node, context, state, new Set());
  mergeReceiverScopes(context.scope, [context.scope, branch.scope]);
  const childContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.left, childContext, state);
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
    recordClassFieldReceiver(element, valueContext);
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

function traverseGuardedLogicalExpression(node, context, state, newFunctionDepth) {
  const leftContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseFeatures(node.left, leftContext, state);
  const guardedNames = getLogicalRightGuardNames(node);
  const guardedGlobals = mergeGuardedGlobals(context.guardedGlobals, guardedNames);
  const rightContext = createReceiverBranchContext(context, node, guardedGlobals, newFunctionDepth);
  traverseFeatures(node.right, rightContext, state);
  mergeReceiverScopes(context.scope, [context.scope, rightContext.scope]);
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
  traverseLoopTest(node.test, childContext, state);
  return traverseConditionalLoop(node, childContext, state);
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

function traverseWhileStatement(node, context, state, newFunctionDepth) {
  const testContext = createChildContext(context, node, context.guardedGlobals, newFunctionDepth);
  traverseLoopTest(node.test, testContext, state);
  return traverseConditionalLoop(node, testContext, state);
}

function traverseDoWhileStatement(node, context, state) {
  const iteration = createReceiverFlowContext(context, node);
  iteration.assignmentScope = context.assignmentScope;
  const continues = traverseFeatures(node.body, iteration, state) !== false;
  const paths = getLoopReceiverPaths(iteration, continues, context.loopLabels);
  const tested = traverseLoopUpdate(node, iteration, paths.iterations, state);
  const conditionExits = isAlwaysTrue(node.test) ? [] : tested;
  const incoming = paths.breaks.concat(conditionExits);
  return finishReceiverFlow(context, iteration.receiverFlow, incoming);
}

function traverseConditionalLoop(node, context, state) {
  const iteration = createReceiverFlowContext(context, node);
  const continues = traverseFeatures(node.body, iteration, state) !== false;
  const paths = getLoopReceiverPaths(iteration, continues, context.loopLabels);
  const updated = traverseLoopUpdate(node, iteration, paths.iterations, state);
  const canFinish = Boolean(node.test) && !isAlwaysTrue(node.test);
  const conditionExits = canFinish ? [context.scope].concat(updated) : [];
  const incoming = paths.breaks.concat(conditionExits);
  return finishReceiverFlow(context, iteration.receiverFlow, incoming);
}

function traverseLoopUpdate(node, context, incoming, state) {
  const updateContext = createReceiverBranchContext(
    context,
    context.parent,
    context.guardedGlobals,
    context.functionDepth,
  );
  mergeReceiverScopes(updateContext.scope, incoming);
  if (incoming.length === 0) updateContext.reachable = false;
  traverseFeatures(node.update, updateContext, state);
  traverseLoopTest(node.test, updateContext, state);
  if (incoming.length === 0) return [];
  return [updateContext.scope];
}

function traverseLoopTest(node, context, state) {
  if (!node) return;
  const cache = getReceiverCache(node, state);
  const key = getLoopTestKey(context, state);
  let result = cache.get(key);
  if (!result) {
    result = analyzeLoopTest(node, context, state);
    cache.set(key, result);
  }
  const restored = restoreFinalizerResult(context.scope, result);
  forwardFinalizerExits(context, restored);
}

function analyzeLoopTest(node, context, state) {
  const branch = createReceiverFlowContext(context, context.parent);
  branch.assignmentScope = context.assignmentScope;
  const continues = traverseFeatures(node, branch, state) !== false;
  const exits = Array.from(branch.receiverFlow.exits.values());
  return { scope: branch.scope, continues, exits };
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
  if (node.type === "AssignmentPattern") return traverseAssignmentPattern;
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

function recordFeatureMatches(node, context, state) {
  const candidates = featuresByNodeType[node.type];
  const isTopLevel = context.functionDepth === 0;
  const sourceCode = state.sourceCode;
  const matchContext = Object.assign({}, context, { isTopLevel, sourceCode });
  visitArray(candidates, ({ name, astInfo }) => {
    if (!state.remaining.has(name)) return;
    if (!matchesFeature(node, astInfo, matchContext)) return;
    state.foundFeatures[name] = true;
    if (recordFeatureReceiver(node, name, astInfo, context, state)) return;
    state.remaining.delete(name);
  });
}

function recordFeatureReceiver(node, name, astInfo, context, state) {
  if (!state.featureReceivers) return false;
  if (node.type !== "CallExpression") return false;
  const isInstanceMethod = !astInfo.object && Boolean(astInfo.property);
  if (!isInstanceMethod) return false;
  const receivers = state.featureReceivers.get(name) || new Set();
  const kind = getReceiverType(node.callee?.object, context);
  visitArray([].concat(kind), (receiver) => {
    receivers.add(receiver);
  });
  state.featureReceivers.set(name, receivers);
  return true;
}

function isLogicalAssignment(node) {
  const isAssignment = node.type === "AssignmentExpression";
  const isLogical = ["&&=", "||=", "??="].includes(node.operator);
  return isAssignment && isLogical;
}

function getLogicalAssignmentScopes(operator, kind, before, assigned) {
  if (!kind) return [before, assigned];
  if (operator === "??=") return [before];
  if (kind === "string") return [before, assigned];
  const isEmpty = kind === "emptyString";
  const writesTruthy = operator === "&&=" && !isEmpty;
  const writesFalsy = operator === "||=" && isEmpty;
  const writes = writesTruthy || writesFalsy;
  if (writes) return [assigned];
  return [before];
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

function recordClassFieldReceiver(node, context) {
  const propertyName = getStaticPropertyKey(node, node.key);
  if (!propertyName) return;
  const key = `this.${propertyName}`;
  recordReceiverValue(key, node.value, context);
}

function recordReceiver(node, context) {
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

function recordTopLevelAssignment(node, context) {
  const isAssignment = node.type === "AssignmentExpression";
  if (!isAssignment) return;
  if (!context.assignmentScope) return;

  addAssignedGlobalName(node, context.assignmentScope.names);
}

function getLogicalRightGuardNames(node) {
  if (node.operator === "??") return new Set();
  if (node.operator === "&&") return collectTrueBranchTypeofNames(node.left);
  return collectFalseBranchTypeofNames(node.left);
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

function recordReceiverPattern(node, value, context) {
  const key = getStaticReferenceKey(node);
  if (key) {
    recordReceiverValue(key, value, context);
    return;
  }
  if (node?.type === "MemberExpression") {
    clearDynamicReceiverDescendants(node.object, context);
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

function recordReceiverValue(key, value, context) {
  const scope = getReceiverTrackingScope(key, context);
  const kind = getReceiverType(value, context);
  if (kind) {
    markReceiver(scope, key, kind);
    return;
  }
  clearReceiver(scope, key);
}

function markReceiver(scope, key, kind) {
  clearReceiverDescendants(scope, key);
  scope.receiverTypes.set(key, kind);
}

function clearReceiver(scope, key) {
  clearReceiverDescendants(scope, key);
  scope.receiverTypes.delete(key);
}

function clearDynamicReceiverDescendants(node, context) {
  const key = getStaticReferenceKey(node);
  if (key) {
    const scope = getReceiverTrackingScope(key, context);
    clearReceiverDescendants(scope, key);
    return;
  }
  if (node?.type === "MemberExpression") clearDynamicReceiverDescendants(node.object, context);
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
  scope.receiverTypes.forEach((_kind, receiver) => {
    if (receiver.startsWith(prefix)) scope.receiverTypes.delete(receiver);
  });
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

function createReceiverFlow(scope) {
  return { scope, exits: new Map() };
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

function getLoopTestKey(context, state) {
  const scope = getReceiverScopeState(context.scope);
  const guards = Array.from(context.guardedGlobals).sort();
  const hasFeatures = state.remaining.size > 0 || state.remainingGlobals.size > 0;
  const isReachable = context.reachable !== false;
  const catchesThrows = Boolean(context.catchReceiverThrows);
  const tracksAssignments = Boolean(context.assignmentScope);
  return JSON.stringify([
    scope,
    guards,
    hasFeatures,
    isReachable,
    catchesThrows,
    tracksAssignments,
  ]);
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

function getFinalizerCache(node, state) {
  const hasFeatures = state.remaining.size > 0 || state.remainingGlobals.size > 0;
  if (hasFeatures) return null;
  return getReceiverCache(node, state);
}

function getReceiverCache(node, state) {
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

module.exports = {
  normalizeNodeType,
  buildFeatureIndex,
  matchesFeature,
  detectFeaturesFromAST,
  detectInstalledPropertiesFromAST,
  detectResourceManagementFromAST,
  getGlobalReferenceName,
  isIdentifierReference,
};
