const moduleAnalysis = require('./lib/core/module-analysis');
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
});
module.exports = moduleAnalysis;