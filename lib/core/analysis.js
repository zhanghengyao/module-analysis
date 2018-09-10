
const { branchParse, methodTypeParse, paramsParse, callDependenciesParse } = require('../parser');
const { babel, babelTypes, isModule, isExports } = require('../utils');

function methodMeta (path, obj, setName, isCombinArgumentsDep, isObjectProperty) {
  let node = path.node;
  let leadingComments = null;
  if (isObjectProperty) {
    node = path.node.value;
    leadingComments = path.node.leadingComments;
  }
  const {
    kind = 'method',
    key = {},
    id = {},
    params,
    generator,
    async,
    computed
  } = node;
  if (!leadingComments) {
    leadingComments = node.leadingComments;
  }
  // 非 method
  if (kind !== 'method') {
    return;
  }
  // [xxx](){}
  if (computed) {
    return;
  }
  const type = methodTypeParse({ generator, async });
  const args = paramsParse(params);
  const branch = branchParse(path);
  const callDependencies = callDependenciesParse(path, isCombinArgumentsDep);
  let comments = [];
  if (leadingComments) {
    comments = leadingComments.map(comment => comment.value);
  }
  const functionMeta = {
    kind,
    type,
    params: args,
    branch,
    callDependencies,
    // TODO 目前只支持 classMethod 获取 comments
    comments
  };
  let methodName = key.name || id && id.name;
  if (setName) {
    methodName = setName;
  }
  if (methodName) {
    obj[methodName] = functionMeta;
  }
}
function exportsMeta (ast, defaultName, isCombinArgumentsDep) {
  const obj = {};
  const visitor = {
    'FunctionExpression|ArrowFunctionExpression'(path) {
      methodMeta(path, obj, defaultName, isCombinArgumentsDep);
      path.stop();
    }
  };
  ast.traverse(visitor);
  return obj;
}
function moduleMeta (ast, defaultName, isCombinArgumentsDep, keys) {
  const obj = {};
  const visitor = {
    ObjectProperty(path) {
      const { key, value } = path.node;
      const keyStr = key.name || key.value;
      if(keys.indexOf(keyStr) !== -1) {
        if (babelTypes.isFunctionExpression(value) || babelTypes.isArrowFunctionExpression(value)) {
          methodMeta(path, obj, keyStr, isCombinArgumentsDep, true);
        }
      }
    },
    ObjectMethod(path) {
      const { key } = path.node;
      const keyStr = key.name || key.value;
      if(keys.indexOf(keyStr) !== -1) {
        methodMeta(path, obj, defaultName, isCombinArgumentsDep);
      }
    }
  };
  ast.traverse(visitor);
  return obj;
}
exports.exportMode = function exportMode(ast) {
  const mode = {
    module: false,
    exports: false
  };
  const visitor = {
    AssignmentExpression(path) {
      if (isModule(path)) {
        mode.module = true;
        path.stop();
      }
      if (isExports(path)) {
        mode.exports = true;
      }
    }
  };
  babel.traverse(ast, visitor);
  return mode;
}

exports.classAnalysis = function classAnalysis(ast, isCombinArgumentsDep) {
  const classObj = {};
  const visitor = {
    ClassMethod(path) {
      methodMeta(path, classObj, null, isCombinArgumentsDep);
    }
  };
  babel.traverse(ast, visitor);
  return classObj;
}
exports.moduleAnalysis = function moduleAnalysis(ast, isCombinArgumentsDep) {
  const defaultName = isCombinArgumentsDep ? 'default' : null;
  const { right } = ast.node;
  if(babelTypes.isObjectExpression(right)) {
    const { properties } = right;
    const keys = properties.map(p => {
      return p.key.name || p.key.value;
    });
    return moduleMeta(ast, defaultName, isCombinArgumentsDep, keys);
  } else if (babelTypes.isFunctionExpression(right)
  || babelTypes.isArrowFunctionExpression(right)) {
    return exportsMeta(ast, 'default', isCombinArgumentsDep);
  }
}
exports.exportsAnalysis = function exportsAnalysis(ast, isCombinArgumentsDep) {
  const { property } = ast.node.left;
  if (!property) {
    console.log(ast.node)
  }
  const { name } = property;
  return exportsMeta(ast, name, isCombinArgumentsDep);
}