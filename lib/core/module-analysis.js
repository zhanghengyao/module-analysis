const { babel, loadFile, isModule, isExports } = require('../utils');
const analysis = require('./analysis');

module.exports = async function moduleAnalysis(filePath, isCombinArgumentsDep) {
  let moduleMetaData = {};
  let comments = [];
  const { ast } = await transformFile(filePath);
  // const ast = root.program;
  let isCMD = false;
  const exportMode = analysis.exportMode(ast);
  if (exportMode.module || exportMode.exports) {
    isCMD = true;
    moduleMetaData = analysis.classAnalysis(ast, isCombinArgumentsDep);
  }
  // 如果是 export.module 优先 class 分析
  // if (exportMode.module) {
  //   moduleMetaData = analysis.classAnalysis(ast, isCombinArgumentsDep);
  // }
  if (isCMD) {
    // class 分析无数据
    if (Object.keys(moduleMetaData).length === 0) {
      const visitor = {
        AssignmentExpression(path) {
          // 获取注释
          const { leadingComments } = path.parent;
          if (leadingComments) {
            comments = leadingComments.map(comment => comment.value)
          }
          if (isModule(path)) {
            moduleMetaData = analysis.moduleAnalysis(path, isCombinArgumentsDep);
            path.stop();
          } else if(isExports(path)) {
            const exportObj = analysis.exportsAnalysis(path, isCombinArgumentsDep);
            const key = Object.keys(exportObj)[0];
            if (exportObj[key]) {
              exportObj[key].comments = [...comments];
            }
            Object.assign(moduleMetaData, exportObj);
            // exports.xx 要清空数组
            comments = [];
          }
        }
      };
      babel.traverse(ast, visitor);
    } else {
      // 获取 class 的注释
      const visitor = {
        AssignmentExpression(path) {
          if (isModule(path)) {
            const { leadingComments } = path.parent;
            if (leadingComments) {
              comments = leadingComments.map(comment => comment.value)
            }
            path.stop();
          }
        }
      };
      babel.traverse(ast, visitor);
    }
  }
  return {
    isModule: isCMD,
    metaData: moduleMetaData,
    comments
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