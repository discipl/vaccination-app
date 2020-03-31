/* eslint-disable global-require,import/no-extraneous-dependencies, max-len */
const chai = require('chai');
const chaiHttp = require('chai-http');
const { ObjectID } = require('mongodb');
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
    createHCPManager,
} = require('./common.test.functions');
const { STATUSES, ACTIONS } = require('../src/appointments/appointments.Constants');
const { EVENT_TYPES } = require('../src/config');
const eventsAdapter = require('../src/vaccinations/events.Adapter');
const Appointment = require('../src/models/Appointment');
const User = require('../src/models/User');
const Vaccine = require('../src/models/Vaccine');
const VaccineType = require('../src/models/VaccineType');
const Vaccination = require('../src/models/Vaccinations');
const APIErrors = require('../src/utils/apiError');

suite('Appointments', async () => {
    let student;
    let student2;
    let hcProvider;
    let hcProviderBigId;
    let ministry;
    let hcpManager;
    let appointmentId;
    let vaccine;
    let event1;
    let event2;
    let vaccineWithOne;
    let eventWitOneVaccine;
    let vaccineTypes;

    const randomObjectId = new ObjectID();

    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow = tomorrow.toISOString();

    async function getAppointment(token) {
        return await chai.request(server)
            .get(`/appointments/${appointmentId}`)
            .set('token', token);
    }

    suiteSetup('Setup environmentExample', async () => {
        await require('./testEnvironmentPreparer')();
        student = await createStudent(`${Math.round(Math.random() * 1000000000)}`);
        student2 = await createStudent(`${Math.round(Math.random() * 1000000000)}`);
        const bigId = Math.round(Math.random() * 1000);
        await User.remove({ bigId });
        hcProvider = await createHCProvider(`${bigId}`);
        hcProviderBigId = hcProvider.bigId;
        ministry = await createMinistry();
        hcpManager = await createHCPManager();
        vaccine = await createVaccine(server, ministry);
        event1 = await createEvent(server, hcpManager, vaccine, hcProvider);
        event2 = await createEvent(server, hcpManager, vaccine, hcProvider);
        vaccineWithOne = await createVaccine(server, ministry, 3);
        eventWitOneVaccine = await createEvent(server, hcpManager, vaccineWithOne, hcProvider);
        vaccineTypes = (await VaccineType.find()).map(vt => vt.fitted);
    });

    suite('Add appointments', async () => {
        test('Add appointment without authorization', async () => {
            const res = await chai.request(server)
                .put('/appointments')
                .send({});
            expect(res.statusCode).to.equal(401);
        });

        test('Add appointment by ministry', async () => {
            const res = await chai.request(server)
                .put('/appointments')
                .set('token', ministry.token);
            expect(res.statusCode).to.equal(403);
        });

        test('Add appointment by hcProvider', async () => {
            const res = await chai.request(server)
                .put('/appointments')
                .set('token', hcProvider.token);
            expect(res.statusCode).to.equal(403);
        });

        test('Add appointment by HCP Managers', async () => {
            const res = await chai.request(server)
                .put('/appointments')
                .set('token', hcpManager.token);
            expect(res.statusCode).to.equal(403);
        });

        test('Add appointment with incorrect params', async () => {
            const res = await chai.request(server)
                .put('/appointments')
                .set('token', student.token)
                .send({});
            expect(res.statusCode).to.equal(400);
        });

        test('Add appointment with incorrect event ID', async () => {
            const res = await chai.request(server)
                .put('/appointments')
                .set('token', student.token)
                .send({ event: '111', duoIds: [student.duoId] });
            expect(res.statusCode).to.equal(400);
        });

        test('Add appointment and event doesnt exist', async () => {
            const res = await chai.request(server)
                .put('/appointments')
                .set('token', student.token)
                .send({ event: new ObjectID(), chosenDate: tomorrow });
            expect(res.statusCode).to.equal(404);
        });

        test('Add appointments', async () => {
            const res1 = await chai.request(server)
                .put('/appointments')
                .set('token', student.token)
                .send({
                    event: eventWitOneVaccine._id,
                    chosenDate: new Date(eventWitOneVaccine.allowedDates[0]),
                });
            expect(res1.statusCode).to.equal(201);
            expect(res1.body).to.have.property('_id');
            expect(res1.body).to.have.property('status', STATUSES.REGISTERED);
            expect(res1.body).to.have.property('event', eventWitOneVaccine._id.toString());
            expect(res1.body).to.have.property('duoId', student.duoId);

            const res2 = await chai.request(server)
                .put('/appointments')
                .set('token', student.token)
                .send({
                    event: event2._id,
                    chosenDate: new Date(event2.allowedDates[0]),
                });
            expect(res2.statusCode).to.equal(201);
            appointmentId = res2.body._id;
        });

        test('Add more appointments than step.initialAmount', async () => {
            const res = await chai.request(server)
                .put('/appointments')
                .set('token', student2.token)
                .send({
                    event: eventWitOneVaccine._id,
                    chosenDate: new Date(eventWitOneVaccine.allowedDates[0]),
                });
            expect(res.statusCode).to.equal(409);
            expect(JSON.stringify(res.body)).to.equal(JSON.stringify(APIErrors.noVaccines()));
        });

        test('Add appointment once again', async () => {
            const res = await chai.request(server)
                .put('/appointments')
                .set('token', student.token)
                .send({
                    event: event2._id,
                    chosenDate: new Date(event2.allowedDates[0]),
                });
            expect(res.statusCode).to.equal(201);
            expect(res.body).to.have.property('_id', appointmentId);
            expect(res.body).to.have.property('status', STATUSES.REGISTERED);
            expect(res.body).to.have.property('event', event2._id.toString());
            expect(res.body).to.have.property('duoId', student.duoId);
        });

        suite('Read appointments', async () => {
            test('Read appointments without login', async () => {
                const res = await chai.request(server)
                    .get('/appointments');
                expect(res.statusCode).to.equal(401);
            });

            test('Read appointments by student', async () => {
                const res = await chai.request(server)
                    .get('/appointments')
                    .set('token', student.token);
                expect(res.statusCode).to.equal(200);
                const appointments = res.body;
                expect(appointments.length).to.equal(2);
                expect(appointments[0]).to.have.all.keys('_id', 'vaccines', 'place', 'status', 'availableActions', 'eventType', 'eventId', 'chosenDate');
                expect(appointments[0].vaccines).to.deep.include({ _id: vaccineWithOne._id, batchCode: vaccineWithOne.batchCode, type: vaccineTypes[0] });
                expect(appointments[0].place).to.deep.equal(event1.place);
                expect(appointments[0]).to.have.property('status', STATUSES.REGISTERED);
                expect(appointments[0].availableActions).to.have.members([ACTIONS.CONFIRM_OPPONENT]);
                expect(appointments[1].vaccines).to.deep.include({ _id: vaccine._id, batchCode: vaccine.batchCode, type: vaccineTypes[0] });
            });

            test('Read appointments by hcProvider', async () => {
                const res = await chai.request(server)
                    .get('/appointments')
                    .set('token', hcProvider.token);
                expect(res.statusCode).to.equal(200);
                const appointments = res.body;
                expect(appointments.length).to.equal(0);
            });

            test('Get details of appointment with incorrect format of objectId', async () => {
                const res = await chai.request(server)
                    .get('/appointments/asd')
                    .set('token', student.token);
                expect(res.statusCode).to.equal(400);
            });

            test('Get details of nonexistent appointment by student', async () => {
                const res = await chai.request(server)
                    .get(`/appointments/${randomObjectId.toString()}`)
                    .set('token', student.token);
                expect(res.statusCode).to.equal(404);
            });

            test('Get details of nonexistent appointment by hcProvider', async () => {
                const res = await chai.request(server)
                    .get(`/appointments/${randomObjectId.toString()}`)
                    .set('token', hcProvider.token);
                expect(res.statusCode).to.equal(404);
            });

            test('Get details of appointment by student', async () => {
                const res = await getAppointment(student.token);
                expect(res.statusCode).to.equal(200);
            });

            test('Get details of appointment by ministry', async () => {
                const res = await getAppointment(ministry.token);
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.have.property('_id');
            });
        });

        suite('Appointment flow', async () => {
            let studentToken;
            let hcProviderToken;

            test('Nonexistent action', async () => {
                const res = await chai.request(server)
                    .post(`/appointments/${appointmentId}`)
                    .set('token', student.token)
                    .send({ action: 'FOO' });
                expect(res.statusCode).to.equal(400);
            });

            test(`Action ${ACTIONS.CONFIRM_OPPONENT} without token`, async () => {
                const res = await chai.request(server)
                    .post(`/appointments/${appointmentId}`)
                    .set('token', student.token)
                    .send({ action: ACTIONS.CONFIRM_OPPONENT });
                expect(res.statusCode).to.equal(400);
            });

            test('Generate token by healthcare provider', async () => {
                const res = await chai.request(server)
                    .post(`/users/${hcProvider._id}/token`)
                    .set('token', hcProvider.token)
                    .send();
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.have.property('token');
                hcProviderToken = res.body.token;
            });

            test('Confirm hcProvider by student (incorrect token)', async () => {
                const res = await chai.request(server)
                    .post(`/appointments/${appointmentId}`)
                    .set('token', student.token)
                    .send({ action: ACTIONS.CONFIRM_OPPONENT, token: `${hcProviderToken}_` });
                expect(res.statusCode).to.equal(409);
                expect(res.error).to.not.have.property('healthcareProvider');
            });

            test('Confirm hcProvider by student (hcProvider does not exists at BIG)', async () => {
                await User.updateOne({ _id: hcProvider._id }, { bigId: '1234567890123456' });
                const res = await chai.request(server)
                    .post(`/appointments/${appointmentId}`)
                    .set('token', student.token)
                    .send({ action: ACTIONS.CONFIRM_OPPONENT, token: hcProviderToken });
                expect(res.statusCode).to.equal(409);
                expect(res.body.healthcareProvider).to.deep.equal({
                    firstName: hcProvider.firstName,
                    lastName: hcProvider.lastName,
                });
            });

            test('Revert bigId of hcProvider', async () => {
                await User.updateOne({ _id: hcProvider._id }, { bigId: hcProviderBigId });
            });

            test('Confirm hcProvider by student', async () => {
                const res = await chai.request(server)
                    .post(`/appointments/${appointmentId}`)
                    .set('token', student.token)
                    .send({ action: ACTIONS.CONFIRM_OPPONENT, token: hcProviderToken });
                expect(res.statusCode).to.equal(200);

                const appointment = await Appointment.findOne({ _id: appointmentId });
                expect(appointment).to.have.property('status', STATUSES.CONFIRMED_BY_STUDENT);
            });

            test('Generate token by student', async () => {
                const res = await chai.request(server)
                    .post(`/appointments/${appointmentId}`)
                    .set('token', student.token)
                    .send({ action: ACTIONS.SHARE_TOKEN });
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.have.property('token');
                studentToken = res.body.token;
            });

            test('Confirm student by hcProvider with incorrect token', async () => {
                const res = await chai.request(server)
                    .post(`/appointments/${appointmentId}`)
                    .set('token', hcProvider.token)
                    .send({ action: ACTIONS.CONFIRM_OPPONENT, token: 'foo' });
                expect(res.statusCode).to.equal(409);
            });

            test('Confirm student by hcProvider', async () => {
                const res = await chai.request(server)
                    .post(`/appointments/${appointmentId}`)
                    .set('token', hcProvider.token)
                    .send({ action: ACTIONS.CONFIRM_OPPONENT, token: studentToken });
                expect(res.statusCode).to.equal(200);

                const appointment = await Appointment.findOne({ _id: appointmentId });
                expect(appointment).to.have.property('status', STATUSES.CONFIRMED);
                const studentDB = await User.findOne({ _id: student._id });
                expect(studentDB).to.have.property('qrToken', null);
            });

            test('Generate token by student once again', async () => {
                const res = await chai.request(server)
                    .post(`/appointments/${appointmentId}`)
                    .set('token', student.token)
                    .send({ action: ACTIONS.SHARE_TOKEN });
                expect(res.statusCode).to.equal(400);
            });

            test('Finish by healthcare provider without batch code', async () => {
                const res = await chai.request(server)
                    .post(`/appointments/${appointmentId}`)
                    .set('token', hcProvider.token)
                    .send({ action: ACTIONS.FINISH });
                expect(res.statusCode).to.equal(200);

                const appointment = (await getAppointment(student.token)).body;
                expect(appointment).to.have.property('status', STATUSES.FINISHED_BY_HEALTHCARE_PROVIDER);

                vaccine = await Vaccine.findOne({ _id: vaccine._id });
                expect(vaccine.finishedAmount).to.equal(1);
            });

            test('Finish by student', async () => {
                const res = await chai.request(server)
                    .post(`/appointments/${appointmentId}`)
                    .set('token', student.token)
                    .send({ action: ACTIONS.FINISH });
                expect(res.statusCode).to.equal(200);

                const appointment = (await getAppointment(student.token)).body;
                expect(appointment).to.have.property('status', STATUSES.FINISHED);
                const event = await eventsAdapter.getEvent(appointment.eventId);
                expect(event.finishedCount).to.equal(1);
            });

            test('Get vaccinations', async () => {
                const vaccination = await Vaccination.findOne({ 'steps._id': event2._id });
                const [step] = vaccination.steps.filter(s => s._id.toString() === event2._id.toString());
                step.type = EVENT_TYPES.BLOOD_TEST;
                await vaccination.save();
                const res1 = await chai.request(server)
                    .get(`/users/${student._id}/vaccinations`)
                    .set('token', student.token);
                expect(res1.statusCode).to.equal(200);
                expect(res1.body.length).to.equal(1);
                expect(res1.body[0]).to.have.property('_id');
                expect(res1.body[0]).to.have.property('batchCode');
                expect(res1.body[0]).to.have.property('type');
                expect(res1.body[0]).to.have.property('name');
            });
        });
    });
});
