module.exports = function ({
  generator = false,
  async = false
}) {
  const type = {
    normal: 'normal',
    generator: 'generator',
    async: 'async'
  }
  if (generator) {
    return type.generator;
  } else if(async) {
    return type.async;
  } else {
    return type.normal;
  }
}