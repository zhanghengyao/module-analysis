const { babelTypes, getPropertyName, combinMethodCallChain } = require('../utils');
const methodTypeParse = require('./method-type-parse');
const argumentsParse = require('./arguments-parse');
const variableParse = require('./variable-parse');

/*
  * TODO 以下情况有 BUG
  * 方法体内存在相同的调用方法会导致调用链分析错误:
  * this.article.sort();
  * this.people.sort().select();
  */
module.exports = function (node, isCombinArguments) {
  const callDependencies = [];
  const variableMeta = variableParse(node);
  let isPush = true;
  // 获取方法体内调用函数的名称、入参、类型相关信息
  // node.traverse({
  //   // 调用函数分析
  //   CallExpression(path) {
  //     const { arguments: argus } = path.node;
  //     const async = path.parent.type === 'AwaitExpression';
  //     const generator = path.parent.type === 'YieldExpression';
  //     const arguments = argumentsParse(argus, isCombinArguments, variableMeta);
      
  //     const type = methodTypeParse({
  //       generator,
  //       async
  //     });
  //     let methodName = getPropertyName(path);
  //     const callFuncMeta = {
  //       chain: [],
  //       name: methodName,
  //       arguments,
  //       type
  //     };
  //     callDependencies.push(callFuncMeta);
  //     path.node.arguments = [];
  //   }
  // });
  // 查找方法内调用函数的调用链
  node.traverse({
    // 调用函数分析
    CallExpression(path) {
      // 获取方法体内调用函数的名称、入参、类型相关信息
      const { arguments: argus, callee } = path.node;
      const async = path.parent.type === 'AwaitExpression';
      const generator = path.parent.type === 'YieldExpression';
      const arguments = argumentsParse(argus, isCombinArguments, variableMeta);
      const type = methodTypeParse({
        generator,
        async
      });
      const methodName = getPropertyName(path);
      // 调用链
      const chain = [];
      // 直接调用方式
      if (babelTypes.isIdentifier(callee)) {
        chain.push(callee.name);
      } else {
        // 对象调用方式
        const chainVisitor = {
          Identifier(path) {
            if (isPush) {
              chain.push(path.node.name);
              if (path.node.name === methodName) {
                isPush = false;
                path.stop();
              }
            }
          },
          ThisExpression() {
            chain.push('this');
          }
        };
        path.traverse(chainVisitor);
      }
      // 组合调用函数在方法体内的完整调用链
      const newChain = combinMethodCallChain(chain, variableMeta);
      const callFuncMeta = {
        chain: newChain,
        name: methodName,
        arguments,
        type
      };
      callDependencies.push(callFuncMeta);
    }
  });
  // console.log(callDependencies);
  return callDependencies;
}