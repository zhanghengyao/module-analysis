const babel = require('babel-core');
const generate = require('babel-generator');
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
  const noteRet = node.leadingComments
  .map(notes => {
    const note = notes.value
    .split('\n')
    .map(s => s.trim().replace(/^\*+/, '').trim())
    if (note[0] === '') {
      return note.splice(1).join('，');
    }
    return note.join('，');
  })
  .join('');
  return noteRet
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
    // console.warn(`\n unhandled call method type: ${callee.type}`);
  }
  return methodName;
}
/**
 * 组合方法体内的完整调用链
 * @param {Array} chain
 * @param {Array} variableMeta
 * @return {Array}
 */
exports.combinMethodCallChain = function combinMethodCallChain(chain, variableMeta = []) {
  // 非数组直接返回
  if (!Array.isArray(chain)) {
    return chain;
  }
  let originChain = [];
  let chainStart = chain[0];
  // 以 this 开始的调用链直接返回
  if (chainStart === 'this') {
    return chain;
  }
  const loop = function () {
    variableMeta.forEach(variable => {
      const { map = [], type } = variable.left;
      const { chain: varChain } = variable.right;
      for (let i = 0; i < map.length; i++) {
        const { key, value } = map[i] || {};
        if (value === chainStart) {
          /*
          * *****************************
          * 变量使用别名时，替换回真实变量名
          * *****************************
          * example:
          * const { name: englishName } = person;
          * 调用链：
          * ✔ 正确--> person.name
          * ✖ 错误--> person.englishName
          */
          if (key !== value) {
            originChain.shift();
            originChain.unshift(key);
          }
          /*
          * ****************************************
          * 合并的两个数组尾和头相同时，去掉一项，避免重复
          * ****************************************
          * example:
          * varChain = [2,5,3];
          * originChain = [3,6,7];
          * 合并结果：
          * ✔ 正确--> [2,5,3,6,7]
          * ✖ 错误--> [2,5,3,3,6,7]
          */
          if (varChain[varChain.length - 1] === originChain[0]) {
            originChain.shift();
          }
          /*
          * *****************************
          * 使用解构赋值时，去除重复变量
          * *****************************
          * example:
          * const { sport } = person.skills;
          * sport.playFootball();
          * 调用链：
          * ✔ 正确--> person.skills.sport.playFootball
          * ✖ 错误--> person.skills.sport.sport.playFootball
          */      
          if (type === 'ObjectPattern' && originChain[0] !== key) {
            originChain = [...varChain, key, ...originChain];
          } else {
            originChain = [...varChain, ...originChain];
          }
          /*
          * 递规调用需要满足两个条件：
          * 1、合并的最新调用链头不等于合并前的调用链头
          * 2、调用链头不等于 this
          */
          if (originChain[0] !== chainStart && originChain[0] !== 'this') {
            chainStart = originChain[0];
            loop();
          }
          break;
        }
      }
    });
  }
  loop();
  /*
  * 去掉非调用链的变量
  * example:
  * const { sport: playFootball } = person.skills;
  * playFootball()
  * ✔ 正确--> person.skills.sport
  * ✖ 错误--> person.skills.sport.playFootball
  */
  if (originChain.length > 0) {
    // originChain 有值就一定包含 chain 的第一个元素,所以需要去掉
    chain.shift();
  }
  originChain = [...originChain, ...chain];
  return originChain;
}
exports.babelTypes = babel.types;
exports.babel = babel;