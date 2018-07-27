const { babelTypes } = require('../utils');
const methodTypeParse = require('./method-type-parse');
const argumentsParse = require('./arguments-parse');
const variableParse = require('./variable-parse');
/**
 * 组合方法体内的完整调用链
 * @param {Array} chain
 * @param {Array} variableMeta
 * @return {Array}
 */
function combinMethodCallChain(chain, variableMeta = []) {
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
          if (varChain[varChain.length - 1] === originChain[0]) {
            originChain.shift();
          }
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
module.exports = function (node) {
  const callDependencies = [];
  const variableMeta = variableParse(node);
  node.traverse({
    // 调用方法分析
    CallExpression: {
      enter(path) {
        const { arguments: argus, callee } = path.node;
        const async = path.parent.type === 'AwaitExpression';
        const generator = path.parent.type === 'YieldExpression';
        const arguments = argumentsParse(argus);
        const type = methodTypeParse({
          generator,
          async
        });
        const callFuncMeta = {
          chain: [],
          name: '',
          arguments,
          type
        };
        // 直接调用方式
        if (babelTypes.isIdentifier(callee)) {
          callFuncMeta.chain.push(callee.name);
          callFuncMeta.name = callee.name;
        } else {
          // 对象调用方式
          path.traverse({
            MemberExpression(path) {
              path.traverse({
                Identifier(path) {
                  callFuncMeta.chain.push(path.node.name);
                  callFuncMeta.name = path.node.name;
                },
                ThisExpression() {
                  callFuncMeta.chain.push('this');
                }
              });
              path.stop();
            }
          });
        }
        const { chain } = callFuncMeta;
        // 组合方法内的完整调用链
        callFuncMeta.chain = combinMethodCallChain(chain, variableMeta);
        callDependencies.push(callFuncMeta);
      }
    }
  });
  return callDependencies;
}