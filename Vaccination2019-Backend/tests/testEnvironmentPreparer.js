/* eslint-disable global-require */
process.env.TEST_MODE = true;
process.env.NODE_ENV = 'debug';
const types = require('../src/config').VACCINE_TYPES;

let firstTime = true;

async function prepareEnvironment() {
    if (firstTime) {
        require('../src/server');
        const db = require('../src/db-connecting');
        await db.init();
        await require('../src/prescripts/vaccineTypes').addVaccineTypes(types);
        firstTime = false;
    }
}

module.exports = prepareEnvironment;
