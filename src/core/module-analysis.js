const { branchParse, methodTypeParse, paramsParse, callDependenciesParse } = require('../parser');
const { babel, loadFile } = require('../utils');

function moduleAnalysis(codeString) {
  const moduleMetaData = {};
  const { ast, metadata } = babel.transform(codeString);
  babel.traverse(ast, {
    ClassMethod: {
      enter(path) {
        const { kind, key, params, generator, async } = path.node;
        const type = methodTypeParse({ generator, async });
        const args = paramsParse(params);
        const branch = branchParse(path);
        const callDependencies = callDependenciesParse(path);
        // console.log(body.callDependencies)
        const functionMeta = {
          kind,
          type,
          params: args,
          branch,
          callDependencies
        };
        moduleMetaData[key.name] = functionMeta;
      }
    }
  });
  // console.log(moduleMetaData);
  Object.keys(moduleMetaData).forEach(key => {
    console.log(moduleMetaData[key].callDependencies)
  })
  return moduleMetaData;
}

module.exports = function (filePath) {
  return loadFile(filePath)
  .then(codeString => moduleAnalysis(codeString));
};