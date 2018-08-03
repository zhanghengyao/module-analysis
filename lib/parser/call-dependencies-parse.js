const { babelTypes, getPropertyName } = require('../utils');
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
/*
  * TODO 以下情况有 BUG
  * 方法体内存在相同的调用方法会导致调用链分析错误:
  * this.article.sort();
  * this.people.sort().select();
  */
module.exports = function (node) {
  const callDependencies = [];
  const variableMeta = variableParse(node);
  // 获取方法体内调用函数的名称、入参、类型相关信息
  node.traverse({
    // 调用函数分析
    CallExpression: {
      enter(path) {
        const { arguments: argus } = path.node;
        const async = path.parent.type === 'AwaitExpression';
        const generator = path.parent.type === 'YieldExpression';
        const arguments = argumentsParse(argus);
        
        const type = methodTypeParse({
          generator,
          async
        });
        let methodName = getPropertyName(path);
        const callFuncMeta = {
          chain: [],
          name: methodName,
          arguments,
          type
        };
        callDependencies.push(callFuncMeta);
        path.node.arguments = [];
      }
    }
  });
  // 查找方法内调用函数的调用链
  node.traverse({
    // 调用函数分析
    CallExpression: {
      enter(path) {
        const { callee } = path.node;
        // path.node.arguments = [];
        const callMeta = callDependencies.find(obj => obj.name === getPropertyName(path));
        if (!callMeta) {
          return;
        }
        // 直接调用方式
        if (babelTypes.isIdentifier(callee)) {
          callMeta.chain.push(callee.name);
        } else {
          // 对象调用方式
          path.traverse({
            MemberExpression(path) {
              path.traverse({
                Identifier(path) {
                  callMeta.chain.push(path.node.name);
                },
                ThisExpression() {
                  callMeta.chain.push('this');
                }
              });
              path.stop();
            }
          });
        }
        const { chain } = callMeta;
        // 组合调用函数在方法体内的完整调用链
        callMeta.chain = combinMethodCallChain(chain, variableMeta);
      }
    }
  });
  // console.log(callDependencies);
  return callDependencies;
}