/* eslint-disable global-require */
const chai = require('chai');
const chaiHttp = require('chai-http');
require('./testEnvironmentPreparer')();
const {
    BRANCH,
    SHORT,
} = require('../src/config');

const { expect } = chai;
chai.use(chaiHttp);

const server = require('../src/server');

suite('Versions', async () => {
    suiteSetup('Setup environmentExample', async () => {
        await require('./testEnvironmentPreparer')();
    });

    test('Check version', async () => {
        const versionResponse = await chai.request(server).get('/version');
        expect(versionResponse.statusCode).to.equal(200);
        expect(versionResponse.body).to.have.property('version', `vB-${BRANCH}.${SHORT}`);
    });
});
