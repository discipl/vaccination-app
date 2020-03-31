/* eslint-disable global-require,import/no-extraneous-dependencies */
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const logger = require('../src/utils/logger');

require('./testEnvironmentPreparer')();

const { expect } = chai;
chai.use(chaiHttp);

const server = require('../src/server');
const {
    createStudent,
    createHCProvider,
    createMinistry,
    createVaccine,
    createEvent,
    createBloodTest,
    createHCPManager,
} = require('./common.test.functions');
const { STATUSES } = require('../src/appointments/appointments.Constants');
const User = require('../src/models/User');
const Vaccination = require('../src/models/Vaccinations');

suite('Appointments', async () => {
    let student;
    let hcProvider;
    let ministry;
    let hcpManager;
    let appointmentId;
    let vaccine;
    let vaccination;
    let event1;
    let event2;
    let bloodTest;

    suiteSetup('Setup environmentExample', async () => {
        await require('./testEnvironmentPreparer')();
        student = await createStudent(`${Math.round(Math.random() * 1000000000)}`);
        const bigId = Math.round(Math.random() * 1000);
        await User.remove({ bigId });
        hcProvider = await createHCProvider(`${bigId}`);
        ministry = await createMinistry();
        hcpManager = await createHCPManager(`${Math.round(Math.random() * 1000000000)}`);
        vaccine = await createVaccine(server, ministry);
        event1 = await createEvent(server, hcpManager, vaccine, hcProvider);
        event2 = await createEvent(server, hcpManager, vaccine, hcProvider);
        vaccination = await Vaccination.findOne({ 'steps._id': event1._id });
        bloodTest = await createBloodTest(server, hcpManager, hcProvider, vaccination._id);
    });
    suite('Get student by DUO id', async () => {
        test('Get student - no user', async () => {
            const res1 = await chai.request(server)
                .get(`/users/duo/${student.duoId}`)
                .set('token', hcpManager.token);
            expect(res1.statusCode).to.equal(404);
        });
        test('Get student by DUO id - 401', async () => {
            const res1 = await chai.request(server)
                .get(`/users/duo/${student.duoId}`);
            expect(res1.statusCode).to.equal(401);
        });
        test('Get student by DUO id - 403', async () => {
            const res1 = await chai.request(server)
                .get(`/users/duo/${student.duoId}`)
                .set('token', student.token);
            expect(res1.statusCode).to.equal(403);
        });

        test('Get student by DUO id', async () => {
            const res1 = await chai.request(server)
                .get('/users/duo/1')
                .set('token', hcpManager.token);
            expect(res1.statusCode).to.equal(200);
            expect(res1.body).to.have.all.keys(['duoId', 'firstName', 'lastName']);
        });
    });

    suite('Get HCP by BIG id', async () => {
        test('Get hcp - no user', async () => {
            const res1 = await chai.request(server)
                .get(`/users/big/${student.duoId}`)
                .set('token', hcpManager.token);
            expect(res1.statusCode).to.equal(404);
        });
        test('Get hcp by big id - 401', async () => {
            const res1 = await chai.request(server)
                .get(`/users/big/${hcProvider.bigId}`);
            expect(res1.statusCode).to.equal(401);
        });
        test('Get hcp by big id - 403', async () => {
            const res1 = await chai.request(server)
                .get(`/users/big/${hcProvider.bigId}`)
                .set('token', hcProvider.token);
            expect(res1.statusCode).to.equal(403);
        });

        test('Get hcp by big id', async () => {
            const res1 = await chai.request(server)
                .get('/users/big/1')
                .set('token', hcpManager.token);
            expect(res1.statusCode).to.equal(200);
            expect(res1.body).to.have.all.keys(['bigId', 'firstName', 'lastName']);
        });
    });

    suite('Get HCP Managers', async () => {
        test('Get hcpManagers - 401', async () => {
            const res1 = await chai.request(server)
                .get('/users/hcpManagers');
            expect(res1.statusCode).to.equal(401);
        });
        test('Get HCP Managers - 403', async () => {
            const res1 = await chai.request(server)
                .get('/users/hcpManagers')
                .set('token', hcProvider.token);
            expect(res1.statusCode).to.equal(403);
        });
        test('Get HCP Managers - without pagination', async () => {
            const res1 = await chai.request(server)
                .get('/users/hcpManagers')
                .set('token', ministry.token);
            expect(res1.statusCode).to.equal(200);
            expect(res1.body).to.have.all.keys(['pagination', 'items']);
            expect(res1.body.items[0]).to.have.all.keys(['HCPManagerNumber', '_id']);
        });
        test('Get HCP Managers - with pagination', async () => {
            const res1 = await chai.request(server)
                .get('/users/hcpManagers?pageSize=3&pageIndex=0')
                .set('token', ministry.token);
            expect(res1.statusCode).to.equal(200);
            expect(res1.body).to.have.all.keys(['pagination', 'items']);
            expect(res1.body.items[0]).to.have.all.keys(['HCPManagerNumber', '_id']);
        });
        test('Get HCP Managers - with empty filter', async () => {
            const res1 = await chai.request(server)
                .get('/users/hcpManagers?pageSize=3&pageIndex=0&HCPManagerNumber=')
                .set('token', ministry.token);
            expect(res1.statusCode).to.equal(400);
        });
        test('Get HCP Managers - with filter', async () => {
            const res1 = await chai.request(server)
                .get(`/users/hcpManagers?pageSize=3&pageIndex=0&HCPManagerNumber=${hcpManager.HCPManagerNumber}`)
                .set('token', ministry.token);
            expect(res1.statusCode).to.equal(200);
            expect(res1.body).to.have.all.keys(['pagination', 'items']);
            expect(res1.body.items[0]).to.have.all.keys(['HCPManagerNumber', '_id']);
        });
    });

    suite('Add appointments', async () => {
        test('Add appointments', async () => {
            const res1 = await chai.request(server)
                .put('/appointments')
                .set('token', student.token)
                .send({
                    event: event1._id,
                    chosenDate: new Date(event1.allowedDates[0]),
                });
            expect(res1.statusCode).to.equal(201);
            expect(res1.body).to.have.property('duoId', student.duoId);
            appointmentId = res1.body._id;
            const appointment = await mongoose.model('appointments').findOne({ _id: appointmentId });
            appointment.status = STATUSES.FINISHED;
            await appointment.save();

            const res2 = await chai.request(server)
                .put('/appointments')
                .set('token', student.token)
                .send({
                    event: event2._id,
                    chosenDate: new Date(event2.allowedDates[0]),
                });
            expect(res2.statusCode).to.equal(201);
            expect(res2.body).to.have.property('duoId', student.duoId);

            const res3 = await chai.request(server)
                .put('/appointments')
                .set('token', student.token)
                .send({
                    event: bloodTest._id,
                    chosenDate: new Date(bloodTest.allowedDates[0]),
                });
            expect(res3.statusCode).to.equal(201);
        });

        test('Get vaccinations - unauthorized', async () => {
            const res1 = await chai.request(server)
                .get(`/users/${student._id}/vaccinations`);
            expect(res1.statusCode).to.equal(401);
        });

        test('Get vaccinations - other user', async () => {
            const res1 = await chai.request(server)
                .get(`/users/${hcProvider._id}/vaccinations`)
                .set('token', student.token);
            expect(res1.statusCode).to.equal(404);
        });
    });
    suite('Generate token', async () => {
        test('Generate token for hcProvider', async () => {
            const res1 = await chai.request(server)
                .post(`/users/${hcProvider._id}/token`)
                .set('token', hcProvider.token);
            expect(res1.statusCode).to.equal(200);
            const user = await mongoose.model('users').findOne({ _id: hcProvider._id });
            expect(res1.body).to.have.property('token', user.qrToken);
        });
    });
});
