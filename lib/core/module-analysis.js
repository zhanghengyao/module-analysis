const { babel } = require('../utils');
const analysis = require('./analysis');

module.exports = function moduleAnalysis(filePath, isCombinArgumentsDep) {
  let moduleMetaData = {};
  const { ast: root } = babel.transformFileSync(filePath, {
    plugins: ["transform-object-rest-spread"]
  });
  const ast = root.program;
  let isModule = false;
  const exportMode = analysis.exportMode(ast);
  if (exportMode.module || exportMode.exports) {
    isModule = true;
  }
  if (isModule) {
    moduleMetaData = analysis.classAnalysis(ast, isCombinArgumentsDep);
    // function
    if (Object.keys(moduleMetaData).length === 0) {
      const visitor = {
        AssignmentExpression(path) {
          if (analysis.isModule(path)) {
            moduleMetaData = analysis.moduleAnalysis(path, isCombinArgumentsDep);
          } else if(analysis.isExports(path)) {
            moduleMetaData = analysis.exportsAnalysis(path, isCombinArgumentsDep);
          }
        }
      };
      babel.traverse(ast, visitor);
    }
  }
  // console.log(moduleMetaData)
  return {
    isModule,
    metaData: moduleMetaData
  };
}