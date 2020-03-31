/* eslint-disable global-require,import/no-extraneous-dependencies */
const chai = require('chai');
const chaiHttp = require('chai-http');
require('./testEnvironmentPreparer')();

const { expect } = chai;
chai.use(chaiHttp);

const server = require('../src/server');
const { createStudent } = require('./common.test.functions');

suite('Localization', async () => {
    let student;

    async function getAppointment(appointmentId, localzation) {
        return await chai.request(server)
            .get(`/appointments/${appointmentId}`)
            .set('token', student.token)
            .set('accept-language', localzation);
    }

    suiteSetup('Setup environmentExample', async () => {
        await require('./testEnvironmentPreparer')();
        student = await createStudent(`${Math.round(Math.random() * 1000000000)}`);
    });

    suite('Joi errors', async () => {
        test('Check joi default localization', async () => {
            const res = await getAppointment('1', '');
            expect(res.body.fields[0].message.includes('fails to match the required pattern')).to.equal(true);
        });

        test('Check joi en localization', async () => {
            const res = await getAppointment('1', 'en');
            expect(res.body.fields[0].message.includes('fails to match the required pattern')).to.equal(true);
        });

        test('Check joi nl localization', async () => {
            const res = await getAppointment('1', 'nl');
            expect(res.body.fields[0].message.includes('komt het vereiste patroon niet overeen')).to.equal(true);
        });
    });

    suite('404 errors', async () => {
        test('Check 404 en localization', async () => {
            const res = await getAppointment('123456789012345678901234', 'en');
            expect(res.body.message.includes('Appointment not found')).to.equal(true);
        });

        test('Check 404 nl localization', async () => {
            const res = await getAppointment('123456789012345678901234', 'nl');
            expect(res.body.message.includes('Afspraak niet gevonden')).to.equal(true);
        });
    });
});
