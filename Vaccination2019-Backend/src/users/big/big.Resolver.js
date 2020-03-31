const { TEST_MODE } = require('../../config');

module.exports = TEST_MODE ? require('./big.test.Adapter') : require('./big.real.Adapter');
