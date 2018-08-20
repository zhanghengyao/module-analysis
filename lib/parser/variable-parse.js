const { babelTypes, transformToCode } = require('../utils');

function defineHandler(node) {
  const defMap = []
  /*
  * 普通变量定义
  * example:
  * const age = 18;
  */
  if (babelTypes.isIdentifier(node)) {
    defMap.push({
      key: node.name,
      value: node.name
    })
  } else if (babelTypes.isObjectPattern(node)) {
    /*
    * 对象解构,两种情况
    * example:
    * 1、const { name, age } = person;
    * 2、const { name: englishName, age, sex='male' } = person;
    */
    node.properties.forEach(objProperty => {
      let map = {
        key: objProperty.key.name,
        value: objProperty.key.name
      };
      if (babelTypes.isIdentifier(objProperty.value)) {
        map.value = objProperty.value.name
      }
      defMap.push(map);
    })
  } else if (babelTypes.isArrayPattern(node)) {
    // const [a, b] = [ 3, 5, 6];
    node.elements.forEach(item => {
      if (babelTypes.isIdentifier(item)) {
        defMap.push({
          key: item.name,
          value: item.name
        });
      } else {
        throw Error(`\n the type not supported: ${item.type}`)
      }
    })
  } else {
    console.log('\n variable-parse: ', node);
    throw Error(`\n invalid type ${node.type}`)
  }
  return defMap;
}
function initHandler(path) {
  const { init } = path.node;
  if (!init) {
    return {
      type: '',
      code: '',
      chain: []
    }
  }
  const initMap = {
    type: init.type,
    code: transformToCode(init),
    chain: []
  };
  const visitor = {
    MemberExpression(path) {
      initTraveres(path, initMap);
    },
  };
  path.traverse(visitor);
  if (initMap.chain.length === 0) {
    initMap.chain.push(initMap.code);
  }
  return initMap;
}
function initTraveres(path, initMap) {
  const visitor = {
    Identifier(path) {
      initMap.chain.push(path.node.name);
    },
    ThisExpression() {
      initMap.chain.push('this');
    }
  }
  path.traverse(visitor);
  path.stop();
}
module.exports = function (node) {
  const variableDeclaration = [];
  const varVisitor = {
    // 定义变量分析，主要用于生成调用链
    VariableDeclarator(path) {
      const varObj = {
        left: {
          type: '',
          map: [{
            key: '',
            value: ''
          }]
        },
        right: {
          type: '',
          code: '',
          chain: []
        }
      }
      const { id } = path.node;
      varObj.left.type = id.type;
      // 处理定义
      varObj.left.map = defineHandler(id);
      // 处理赋值
      varObj.right = initHandler(path);

      variableDeclaration.push(varObj);
    }
  };
  node.traverse(varVisitor);
  return variableDeclaration;
};