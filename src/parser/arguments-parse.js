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
    MemberExpression: pickCode,
    Identifier: pickName,
    NumericLiteral: pickValue,
    BooleanLiteral: pickValue,
    StringLiteral: pickValue,
    NullLiteral: pickNull
  };
  argumentNode.forEach(node => {
    const map = argusMap[node.type];
    if (!map) {
      throw Error(`invalid arguments type: ${node.type}`)
    }
    argus.push(map(node))
  });
  return argus;
};