const { ES_FEATURES } = require("../constants");
const { checkMap } = require("./ast");

const FUNCTION_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
  "MethodDefinition",
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
];

function normalizeNodeType(nodeType) {
  if (nodeType === "ExportDeclaration") {
    return [
      "ExportNamedDeclaration",
      "ExportDefaultDeclaration",
      "ExportAllDeclaration",
    ];
  }
  if (nodeType === "BigIntLiteral") {
    return ["Literal"];
  }
  return [nodeType];
}

function buildFeatureIndex(features) {
  const index = {};
  for (const [name, { astInfo }] of Object.entries(features)) {
    if (!astInfo?.nodeType) continue;
    const types = normalizeNodeType(astInfo.nodeType);
    for (const t of types) {
      (index[t] ||= []).push({ name, astInfo });
    }
  }
  return index;
}

const featuresByNodeType = buildFeatureIndex(ES_FEATURES);

function matchesFeature(node, astInfo, context = {}) {
  if (astInfo.childType) {
    return node.elements?.some((el) => el?.type === astInfo.childType) || false;
  }

  if (astInfo.name && node.type === "Identifier") {
    return node.name === astInfo.name;
  }

  if (astInfo.nodeType === "BigIntLiteral") {
    return node.bigint !== undefined;
  }

  if (astInfo.kind && node.kind !== astInfo.kind) {
    return false;
  }

  const hasOperatorMismatch =
    (astInfo.operator && node.operator !== astInfo.operator) ||
    (astInfo.operators && !astInfo.operators.includes(node.operator));

  if (hasOperatorMismatch) {
    return false;
  }

  if (astInfo.property === "superClass") {
    return node.superClass !== null;
  }

  if (astInfo.topLevel && node.type === "AwaitExpression") {
    return context.isTopLevel === true;
  }

  if (astInfo.leftIsPrivate && node.type === "BinaryExpression") {
    return node.left?.type === "PrivateIdentifier";
  }

  // OptionalCatchBinding: only match catch {} without param (ES2019+), not catch (e) {}
  if (astInfo.noParam) {
    return node.type === "CatchClause" && node.param == null;
  }

  if (node.type === "CallExpression" || node.type === "NewExpression") {
    return checkMap(node, astInfo);
  }

  return true;
}

function detectFeaturesFromAST(ast) {
  const foundFeatures = Object.create(null);
  for (const key of Object.keys(ES_FEATURES)) {
    foundFeatures[key] = false;
  }

  const remaining = new Set(Object.keys(ES_FEATURES));
  const stack = [{ node: ast, functionDepth: 0 }];

  while (stack.length > 0 && remaining.size > 0) {
    const { node, functionDepth } = stack.pop();
    if (!node || typeof node !== "object") continue;

    const isFunction = FUNCTION_TYPES.has(node.type);
    const newFunctionDepth = isFunction ? functionDepth + 1 : functionDepth;

    const candidates = featuresByNodeType[node.type];
    if (candidates) {
      const context = { isTopLevel: functionDepth === 0 };
      for (const { name, astInfo } of candidates) {
        if (!remaining.has(name)) continue;
        if (matchesFeature(node, astInfo, context)) {
          foundFeatures[name] = true;
          remaining.delete(name);
        }
      }
    }

    for (const key of CHILD_KEYS) {
      const child = node[key];
      if (!child) continue;
      if (Array.isArray(child)) {
        for (let i = child.length - 1; i >= 0; i--) {
          if (child[i])
            stack.push({ node: child[i], functionDepth: newFunctionDepth });
        }
      } else if (child.type) {
        stack.push({ node: child, functionDepth: newFunctionDepth });
      }
    }
  }

  return foundFeatures;
}

module.exports = {
  normalizeNodeType,
  buildFeatureIndex,
  matchesFeature,
  detectFeaturesFromAST,
};
