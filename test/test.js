const path = require('path');
const moduleAnalysis = require('../index');
moduleAnalysis(path.resolve(__dirname, './fixtures/demo.js'));