const assert = require('assert');
const babel = require('babel-core');
function pickObjectPattern(node) {
  const param = {};
  node.properties.forEach(pro => {
    param[pro.key.name] = ''
  });
  return param;
}
function pickIdentifier(node) {
  const param = node.name;
  return param;
}
function pickAssignmentPattern(node) {
  const param = node.left.name;
  return param;
}
function pickArrayPattern() {
  const param = [];
  return param;
}
function paramsParse(paramNode) {
  assert(Array.isArray(paramNode));
  const params = [];
  const { types: babelTypes } = babel;
  paramNode.forEach(node => {
    const { type } = node;
    if (babelTypes.isObjectPattern(type)) {
      params.push(pickObjectPattern(node));
    } else if (babelTypes.isIdentifier(type)) {
      params.push(pickIdentifier(node));
    } else if (babelTypes.isAssignmentPattern(type)) {
      params.push(pickAssignmentPattern(node));
    } else if (babelTypes.isArrayPattern(type)) {
      params.push(pickArrayPattern());
    }
  });
  return params;
}
module.exports = paramsParse;