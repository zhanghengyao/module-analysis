const { branchParse, methodTypeParse, paramsParse, argumentsParse, callDependenciesParse } = require('../parser');
const { babel, loadFile } = require('../utils');
const analysis = require('./analysis');

function moduleAnalysis(codeString) {
  let moduleMetaData = {};
  const { ast } = babel.transform(codeString);
  let isModule = false;
  const exportMode = analysis.exportMode(ast);
  if (exportMode.module || exportMode.exports) {
    isModule = true;
  }
  if (isModule) {
    moduleMetaData = analysis.classAnalysis(ast);
    // function
    if (Object.keys(moduleMetaData).length === 0) {
      babel.traverse(ast, {
        AssignmentExpression(path) {
          if (analysis.isModule(path)) {
            moduleMetaData = analysis.moduleAnalysis(path);
          } else if(analysis.isExports(path)) {
            moduleMetaData = analysis.exportsAnalysis(path);
          }
        }
      });
    }
  } else {
    babel.traverse(ast, {
      CallExpression: {
        enter(path) {
          const { callee, arguments } = path.node;
          const type = methodTypeParse({});
          const args = argumentsParse(arguments);
          const branch = branchParse(path);
          const callDependencies = callDependenciesParse(path);
          const functionMeta = {
            kind: 'method',
            type,
            params: args,
            branch,
            callDependencies
          };
          moduleMetaData[callee.name] = functionMeta;
        }
      }
    });
  }
  // Object.keys(moduleMetaData).forEach(key => {
  //   console.log(moduleMetaData[key].callDependencies)
  // })
  moduleMetaData.isModule = isModule;
  return moduleMetaData;
}

module.exports = function (filePath) {
  return loadFile(filePath)
  .then(codeString => moduleAnalysis(codeString));
};