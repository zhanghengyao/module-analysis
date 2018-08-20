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
  // 获取方法体内调用函数的名称、入参、类型相关信息
  const argumentsVisitor = {
    // 调用函数分析
    CallExpression(path) {
      const { arguments: argus } = path.node;
      const async = path.parent.type === 'AwaitExpression';
      const generator = path.parent.type === 'YieldExpression';
      const arguments = argumentsParse(argus, isCombinArguments, variableMeta);
      
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
  };
  node.traverse(argumentsVisitor);
  // 查找方法内调用函数的调用链
  const calleeVisitor = {
    // 调用函数分析
    CallExpression(path) {
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
        const callVisitor = {
          Identifier(path) {
            callMeta.chain.push(path.node.name);
          },
          ThisExpression() {
            callMeta.chain.push('this');
          }
        };
        path.traverse(callVisitor);
      }
      const { chain } = callMeta;
      // 组合调用函数在方法体内的完整调用链
      callMeta.chain = combinMethodCallChain(chain, variableMeta);
    }
  };
  node.traverse(calleeVisitor);
  return callDependencies;
}