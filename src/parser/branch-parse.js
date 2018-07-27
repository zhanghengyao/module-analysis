const { transformToCode, getNodeNotes } = require('../utils');
const argumentsParse = require('./arguments-parse');
module.exports = function (node) {
  const branch = {
    ifBranch: [],
    switchBranch: [],
    returnBranch: []
  };
  node.traverse({
    // if 分支分析
    IfStatement: {
      enter(path) {
        const notes = getNodeNotes(path.node);
        let code = '';
        path.traverse({
          LogicalExpression(path) {
            code = transformToCode(path.node);
            path.stop()
          },
          BinaryExpression(path) {
            code = transformToCode(path.node),
            path.stop()
          }
        });
        branch.ifBranch.push({
          code,
          notes
        });
      }
    },
    // switch 分支分析
    SwitchStatement: {
      enter(path) {
        let tempCode = '';
        const { cases, discriminant } = path.node;
        cases.forEach(node => {
          const notes = getNodeNotes(node);
          if (node.test === null) {
            const defaultCase = `${transformToCode(discriminant)} default`;
            branch.switchBranch.push({
              code: defaultCase,
              notes
            });
          } else {
            const caseCode = argumentsParse([node.test])[0];
            // 当前 case 没有 break 的情况
            if (node.consequent.length === 0) {
              tempCode += `${caseCode} || `;
            } else {
              let codeStr = '';
              // 判断之前的 case 是否有被使用
              if (tempCode !== '') {
                tempCode += caseCode;
                codeStr = tempCode;
                tempCode = '';
              } else {
                codeStr = caseCode;
              }
              branch.switchBranch.push({
                code: codeStr,
                notes
              });
            }
          }
        });
      }
    }
  });
  return branch;
}