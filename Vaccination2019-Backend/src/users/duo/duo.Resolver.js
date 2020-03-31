const { TEST_MODE } = require('../../config');

module.exports = TEST_MODE ? require('./duo.test.Adapter') : require('./duo.real.Adapter');
