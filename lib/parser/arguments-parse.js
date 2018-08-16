const babel = require('babel-core');
const { transformToCode, combinMethodCallChain } = require('../utils');
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
// function pickReg(node) {
//   return node.extra.raw;
// }
function pickMemberExpression(node, isCombinArguments, variableMeta) {
  const arguCode = pickCode(node);
  if (isCombinArguments) {
    const callArray = arguCode.split('.');
    const combineArguCode = combinMethodCallChain(callArray, variableMeta).join('.');
    return combineArguCode;
  }
  return arguCode;
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
function pickUnaryExpression(node) {
  let str = ''
  if (node.prefix) {
    str = `${node.operator} ${node.argument.name}`
  } else {
    str = `${node.argument.name}${node.operator}`
  }
  return str;
}
module.exports = function (argumentNode, isCombinArguments, variableMeta) {
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
    MemberExpression: pickMemberExpression,
    CallExpression: pickCode,
    Identifier: pickName,
    NumericLiteral: pickValue,
    BooleanLiteral: pickValue,
    StringLiteral: pickValue,
    NullLiteral: pickNull,
    RegExpLiteral: pickCode,
    TemplateLiteral: pickTemplate,
    UnaryExpression: pickUnaryExpression
  };
  argumentNode.forEach(node => {
    const map = argusMap[node.type];
    if (map) {
      argus.push({
        type: node.type,
        value: map(node, isCombinArguments, variableMeta)
      });
    } else {
      // console.warn(`\n unhandled arguments type: ${node.type}`)
    }
  });
  return argus;
};