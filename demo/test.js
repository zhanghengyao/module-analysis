const path = require('path');
const moduleAnalysis = require('../index');
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
});
moduleAnalysis(path.resolve(__dirname, './fixtures/demo.js')).then(ret => {
  console.log(ret);
});

