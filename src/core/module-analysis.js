const babel = require('babel-core');
const { bodyParser, methodTypeParser, paramsParser } = require('../parser');
const utils = require('../utils');

function moduleAnalysis(codeString) {
  const moduleMetaData = {};
  const { ast, metadata } = babel.transform(codeString);
  babel.traverse(ast, {
    ClassMethod: {
      enter(path) {
        const { kind, key, params, generator, async } = path.node;
        const type = methodTypeParser({ generator, async });
        const args = paramsParser(params);
        bodyParser(path);
        const functionMeta = {
          kind,
          type,
          params: args,
          branch: [],
          callDependencies: []
        };
        moduleMetaData[key.name] = functionMeta;
      }
    }
  });
  return moduleMetaData;
}

module.exports = function (filePath) {
  return utils.loadFile(filePath)
  .then(codeString => moduleAnalysis(codeString))
  .catch(error => {
    throw error;
  });
};