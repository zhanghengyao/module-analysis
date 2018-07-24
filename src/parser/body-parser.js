const generate = require('babel-generator');
const babylon = require('babylon');
module.exports = function (node) {
  node.traverse({
    IfStatement: {
      enter(path) {
        // console.log(path.node.code);
      }
    }
  })
}