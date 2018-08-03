const babel = require('babel-core');
const { transformToCode } = require('../utils');
function pickCode(node) {
  return transformToCode(node);
}
function pickName(node) {
  return node.name;
}
function pickValue(node) {
  return node.value;
}
function pickNull() {
  return null;
}
function pickReg(node) {
  return node.extra.raw;
}
function pickTemplate(node) {
  let tpl = '';
  babel.traverse(node, {
    noScope: true,
    TemplateElement(path) {
      tpl += path.node.value.raw;
    }
  });
  return tpl;
}
module.exports = function (argumentNode) {
  let argus = [];
  if (!Array.isArray(argumentNode)) {
    return argus;
  }
  const argusMap = {
    ArrayExpression: pickCode,
    ObjectExpression: pickCode,
    AwaitExpression: pickCode,
    FunctionExpression: pickCode,
    ArrowFunctionExpression: pickCode,
    SpreadElement: pickCode,
    ConditionalExpression: pickCode,
    BinaryExpression: pickCode,
    LogicalExpression: pickCode,
    MemberExpression: pickCode,
    CallExpression: pickCode,
    Identifier: pickName,
    NumericLiteral: pickValue,
    BooleanLiteral: pickValue,
    StringLiteral: pickValue,
    NullLiteral: pickNull,
    RegExpLiteral: pickReg,
    TemplateLiteral: pickTemplate
  };
  argumentNode.forEach(node => {
    const map = argusMap[node.type];
    if (!map) {
      console.log(node)
      throw Error(`invalid arguments type: ${node.type}`)
    }
    argus.push(map(node))
  });
  return argus;
};