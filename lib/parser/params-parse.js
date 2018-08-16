function pickObjectPattern(node) {
  const param = {};
  node.properties.forEach(pro => {
    param[pro.key.name] = ''
  });
  return param;
}
function pickIdentifier(node) {
  return node.name;
}
function pickAssignmentPattern(node) {
  return node.left.name;
}
function pickArrayPattern() {
  return [];
}
function pickRestElement(node) {
  return `...${node.argument.name}`;
}

module.exports = function (paramNode) {
  let params = [];
  if(!Array.isArray(paramNode)) {
    return params;
  }
  const paramsMap = {
    ObjectPattern: pickObjectPattern,
    Identifier: pickIdentifier,
    AssignmentPattern: pickAssignmentPattern,
    ArrayPattern: pickArrayPattern,
    RestElement: pickRestElement
  };
  paramNode.map(node => {
    const map = paramsMap[node.type];
    if (!map) {
      throw Error(`\n invalid param type: ${node.type}`);
    }
    params.push({
      type: node.type,
      value: map(node)
    });
  });
  return params;
};