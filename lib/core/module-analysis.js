const { babel, loadFile } = require('../utils');
const analysis = require('./analysis');

module.exports = async function moduleAnalysis(filePath, isCombinArgumentsDep) {
  let moduleMetaData = {};
  const { ast } = await transformFile(filePath);
  // const ast = root.program;
  let isModule = false;
  const exportMode = analysis.exportMode(ast);
  if (exportMode.module || exportMode.exports) {
    isModule = true;
  }
  if (isModule) {
    // console.log(ast.body[0].declarations[0])
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
  return {
    isModule,
    metaData: moduleMetaData
  };
}
// function transformFile(filePath) {
//   return new Promise((resolve, reject) => {
//     // 有坑！！！同一个 JS 文件，放不同地方，一个能正常加载
//     // 另一个神特么先载一个空文件，里面就一段代码：
//     // var _regenerator = require('babel-runtime/regenerator')
//     babel.transformFile(filePath, {
//       plugins: ["transform-object-rest-spread"]
//     }, (err, ret) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(ret);
//       }
//     });
//   });
// }
async function transformFile (filePath) {
  const codeString = await loadFile(filePath);
  return babel.transform(codeString, {
    plugins: ["transform-object-rest-spread"]
  });
}; 