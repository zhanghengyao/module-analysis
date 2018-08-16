
const { branchParse, methodTypeParse, paramsParse, callDependenciesParse } = require('../parser');
const { babel, babelTypes } = require('../utils');
function methodMeta (path, obj, setName, isCombinArgumentsDep) {
  const { kind = 'method', key = {}, id = {}, params, generator, async } = path.node;
  if (kind !== 'method') {
    return;
  }
  const type = methodTypeParse({ generator, async });
  const args = paramsParse(params);
  const branch = branchParse(path);
  const callDependencies = callDependenciesParse(path, isCombinArgumentsDep);
  const functionMeta = {
    kind,
    type,
    params: args,
    branch,
    callDependencies
  };
  let methodName = key.name || id && id.name;
  if (setName) {
    methodName = setName;
  }
  methodName = methodName || 'default';
  obj[methodName] = functionMeta;
}
function exportsMeta (ast, defaultName, isCombinArgumentsDep) {
  const obj = {};
  ast.traverse({
    FunctionExpression(path) {
      methodMeta(path, obj, defaultName, isCombinArgumentsDep);
      path.stop();
    },
    ArrowFunctionExpression(path) {
      methodMeta(path, obj, defaultName, isCombinArgumentsDep);
      path.stop();
    }
  });
  return obj;
}
exports.exportMode = function exportMode(ast) {
  const mode = {
    module: false,
    exports: false
  };
  babel.traverse(ast, {
    AssignmentExpression(path) {
      const { object = {}, property = {} } = path.node.left;
      if (object.name === 'module' && property.name === 'exports') {
        mode.module = true;
      }
      if (object.name === 'exports' && babelTypes.isIdentifier(property)) {
        mode.exports = true;
      }
    }
  });
  return mode;
}
exports.isModule = function isModule(ast) {
  const { object = {}, property = {} } = ast.node.left || {};
  return object.name === 'module' && property.name === 'exports';
}
exports.isExports = function isExports(ast) {
  const { object = {}, property = {} } = ast.node.left || {};
  return object.name === 'exports' && babelTypes.isIdentifier(property);
}
exports.classAnalysis = function classAnalysis(ast, isCombinArgumentsDep) {
  const classObj = {};
  babel.traverse(ast, {
    ClassMethod: {
      enter(path) {
        methodMeta(path, classObj, isCombinArgumentsDep);
      }
    }
  });
  return classObj;
}
exports.moduleAnalysis = function moduleAnalysis(ast, isCombinArgumentsDep) {
  return exportsMeta(ast, 'default', isCombinArgumentsDep);
}
exports.exportsAnalysis = function exportsAnalysis(ast, isCombinArgumentsDep) {
  const { property } = ast.node.left;
  if (!property) {
    console.log(ast.node)
  }
  const { name } = property;
  return exportsMeta(ast, name, isCombinArgumentsDep);
}