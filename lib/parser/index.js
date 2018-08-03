const callDependenciesParse = require('./call-dependencies-parse');
const paramsParse = require('./params-parse');
const argumentsParse = require('./arguments-parse');
const methodTypeParse = require('./method-type-parse');
const branchParse = require('./branch-parse');
module.exports = {
  callDependenciesParse,
  paramsParse,
  methodTypeParse,
  branchParse,
  argumentsParse
}