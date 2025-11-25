const { ES_FEATURES } = require("../constants");
const { checkMap } = require("./ast");

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

function matchesFeature(node, astInfo) {
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

  if (astInfo.operator && node.operator !== astInfo.operator) {
    return false;
  }

  if (astInfo.property === "superClass") {
    return node.superClass !== null;
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
  const stack = [ast];

  while (stack.length > 0 && remaining.size > 0) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;

    const candidates = featuresByNodeType[node.type];
    if (candidates) {
      for (const { name, astInfo } of candidates) {
        if (!remaining.has(name)) continue;
        if (matchesFeature(node, astInfo)) {
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
          if (child[i]) stack.push(child[i]);
        }
      } else if (child.type) {
        stack.push(child);
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
