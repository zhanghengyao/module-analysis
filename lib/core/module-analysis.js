const { babel, loadFile } = require('../utils');
const analysis = require('./analysis');

function moduleAnalysis(codeString, isCombinArgumentsDep) {
  let moduleMetaData = {};
  const { ast } = babel.transform(codeString, {
    plugins: ["transform-object-rest-spread"]
  });
  let isModule = false;
  const exportMode = analysis.exportMode(ast);
  if (exportMode.module || exportMode.exports) {
    isModule = true;
  }
  if (isModule) {
    moduleMetaData = analysis.classAnalysis(ast, isCombinArgumentsDep);
    // function
    if (Object.keys(moduleMetaData).length === 0) {
      babel.traverse(ast, {
        AssignmentExpression(path) {
          if (analysis.isModule(path)) {
            moduleMetaData = analysis.moduleAnalysis(path, isCombinArgumentsDep);
          } else if(analysis.isExports(path)) {
            moduleMetaData = analysis.exportsAnalysis(path, isCombinArgumentsDep);
          }
        }
      });
    }
  }
  return {
    isModule,
    metaData: moduleMetaData
  };
}

module.exports = function (filePath, isCombinArgumentsDep) {
  return loadFile(filePath)
  .then(codeString => moduleAnalysis(codeString, isCombinArgumentsDep));
};