const fs = require('fs');
const babel = require('babel-core');
const generate = require('babel-generator');
/**
 * 加载文件
 * @param {string} filePath 文件路径
 * @return {Promise}
 */
exports.loadFile = function loadFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}
/**
 * 将 ast 转换成代码字符串
 * @param {object} ast
 * @return {String}
 */
exports.transformToCode = function transformToCode(ast) {
  const generateObj = generate.default(ast) || {};
  const { code = '' } = generateObj;
  return code;
}
/**
 * 获取 node 注释
 * @param {object} node
 * @return {String}
 */
exports.getNodeNotes = function getNodeNotes(node) {
  if (!node || !node.leadingComments) {
    return '';
  }
  return node.leadingComments
  .map(notes => notes.value)
  .join('');
}
exports.getPropertyName = function getPropertyName(path) {
  let methodName = '';
  if (!babel.types.isCallExpression(path)) {
    return methodName;
  }
  const { callee } = path.node;
  if (babel.types.isIdentifier(callee)) {
    methodName = callee.name;
  } else if (babel.types.isMemberExpression(callee)) {
    methodName = callee.property.name;
  } else {
    throw Error(`invalid call method type: ${callee.type}`);
  }
  return methodName;
}
exports.babelTypes = babel.types;
exports.babel = babel;