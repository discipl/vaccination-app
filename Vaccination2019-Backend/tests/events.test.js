/* eslint-disable global-require,import/no-extraneous-dependencies */
const chai = require('chai');
const chaiHttp = require('chai-http');
require('./testEnvironmentPreparer')();

const { expect } = chai;
chai.use(chaiHttp);

const server = require('../src/server');
const {
    createMinistry,
    createStudent,
    createVaccine,
    createHCPManager,
    addAppointment,
    createHCProvider,
    createEvent,
} = require('./common.test.functions');
const Vaccination = require('../src/models/Vaccinations');
const { EVENT_TYPES } = require('../src/config');

suite('Vaccinations', async () => {
    let ministry;
    let student;
    let hcpManager;
    let vaccine;
    let eventCountBeforeAdding;
    let hcp;
    let vaccination;
    let tomorrow = new Date();
    let secondDate = new Date();
    let thirdDate = new Date();
    let bloodtestDate = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    secondDate.setDate(secondDate.getDate() + 300);
    thirdDate.setDate(thirdDate.getDate() + 600);
    bloodtestDate.setDate(thirdDate.getDate() + 1200);
    tomorrow = tomorrow.toISOString();
    secondDate = secondDate.toISOString();
    thirdDate = thirdDate.toISOString();
    bloodtestDate = bloodtestDate.toISOString();
    const place = {
        name: 'name value',
        address: 'address value',
        latitude: 14.1,
        longitude: 41.5,
    };
    const vaccineEvent = {
        type: EVENT_TYPES.VACCINATION,
        date: tomorrow,
        alternativeDate: tomorrow,
        place,
        bigIds: [],
    };

    const analysisEvent = {
        place,
        bigIds: [],
    };

    suiteSetup('Setup environmentExample', async () => {
        await require('./testEnvironmentPreparer')();
        ministry = await createMinistry();
        hcpManager = await createHCPManager(`${Math.round(Math.random() * 1000000000)}`);
        hcp = await createHCProvider(`${Math.round(Math.random() * 1000000000)}`);
        student = await createStudent(`${Math.round(Math.random() * 1000000000)}`);
        vaccine = await createVaccine(server, ministry);
        vaccineEvent.bigIds.push(hcp.bigId);
        analysisEvent.bigIds.push(hcp.bigId);
        const step1 = {};
        Object.assign(step1, vaccineEvent);
        const step2 = {};
        Object.assign(step2, vaccineEvent);
        step2.date = secondDate;
        step2.alternativeDate = secondDate;
        const step3 = {};
        Object.assign(step3, vaccineEvent);
        step3.date = thirdDate;
        step3.alternativeDate = thirdDate;
        vaccineEvent.vaccines = [vaccine._id];
        vaccination = {
            vaccines: [vaccine._id],
            steps: [step1, step2, step3],
            initialCount: 3,
        };
    });

    suite('Add vaccinations', async () => {
        test('Add event without authorization', async () => {
            const res = await chai.request(server)
                .put('/vaccinations')
                .send({});
            expect(res.statusCode).to.equal(401);
        });

        test('Add event with incorrect params', async () => {
            const res = await chai.request(server)
                .put('/vaccinations')
                .set('token', hcpManager.token)
                .send({});
            expect(res.statusCode).to.equal(400);
        });

        test('Add event with incorrect date - Invalid date format', async () => {
            vaccination.steps[0].date = 'asddfg';
            vaccination.steps[0].alternativeDate = 'zxxzc';
            const res = await chai.request(server)
                .put('/vaccinations')
                .set('token', hcpManager.token)
                .send(vaccination);
            expect(res.statusCode).to.equal(400);
        });

        test('Add event with incorrect date - date is already passed', async () => {
            vaccination.steps[0].date = '01.01.2018';
            vaccination.steps[0].alternativeDate = '02.02.2010';
            const res = await chai.request(server)
                .put('/vaccinations')
                .set('token', hcpManager.token)
                .send(vaccination);
            expect(res.statusCode).to.equal(400);
        });

        test('Add event by student', async () => {
            const res = await chai.request(server)
                .put('/vaccinations')
                .set('token', student.token)
                .send({});
            expect(res.statusCode).to.equal(403);
        });

        test('Add vaccinations', async () => {
            eventCountBeforeAdding = (await Vaccination.find({})).length;
            vaccination.steps[0].date = tomorrow;
            vaccination.steps[0].alternativeDate = tomorrow;
            analysisEvent.date = bloodtestDate;
            analysisEvent.alternativeDate = bloodtestDate;
            const res1 = await chai.request(server)
                .put('/vaccinations')
                .set('token', hcpManager.token)
                .send(vaccination);
            expect(res1.statusCode).to.equal(201);
            expect(res1.body).to.have.keys(['_id', 'vaccines', 'steps']);
            expect(res1.body).to.have.property('vaccines');
            expect(res1.body.vaccines[0]).to.equal(vaccine._id);
            expect(res1.body.steps[0]).to.have.keys([
                '_id',
                'allowedDates',
                'availableCount',
                'bigIds',
                'initialCount',
                'finishedCount',
                'place',
                'type']);

            vaccination._id = res1.body._id;
            vaccineEvent._id = res1.body.steps[0]._id;
            const res2 = await chai.request(server)
                .put(`/vaccinations/${vaccination._id}`)
                .set('token', hcpManager.token)
                .send(analysisEvent);
            expect(res2.statusCode).to.equal(201);
            expect(res2.body).to.have.keys(['_id',
                'allowedDates',
                'availableCount',
                'bigIds',
                'initialCount',
                'finishedCount',
                'place',
                'type']);
            const eventCountAfter = (await Vaccination.find({})).length;
            expect(eventCountAfter).to.equal(eventCountBeforeAdding + 1);
        });
    });

    suite('Get vaccinations', async () => {
        suiteSetup('Setup environmentExample', async () => {
            await require('./testEnvironmentPreparer')();
            ministry = await createMinistry();
            hcpManager = await createHCPManager(`${Math.round(Math.random() * 1000000000)}`);
            student = await createStudent(`${Math.round(Math.random() * 1000000000)}`);
            eventCountBeforeAdding = (await Vaccination.find({})).length;
            await createEvent(server, hcpManager, vaccine, hcp);
        });
        test('Get list of events by student', async () => {
            const res = await chai.request(server)
                .get('/vaccinations/events')
                .set('token', student.token);
            expect(res.statusCode).to.equal(200);
            const [lastEvent] = res.body.items;
            expect(lastEvent).to.have.property('allowedDates');
            expect(lastEvent).to.have.property('availableCount');
            expect(lastEvent).to.have.property('bigIds');
            expect(lastEvent).to.have.property('hcps');
            expect(lastEvent).to.have.property('initialCount');
            expect(lastEvent).to.have.property('place');
            expect(lastEvent).to.have.property('type');
            expect(lastEvent).to.have.property('vaccinationId');
            expect(lastEvent).to.have.property('vaccines');
            expect(lastEvent).to.have.property('_id');
        });

        test('Get list of vaccinations by HCP', async () => {
            const res = await chai.request(server)
                .get('/vaccinations/events')
                .set('token', hcp.token);
            expect(res.statusCode).to.equal(200);
            const [lastEvent] = res.body.items;
            expect(lastEvent).to.have.property('allowedDates');
            expect(lastEvent).to.have.property('availableCount');
            expect(lastEvent).to.have.property('bigIds');
            expect(lastEvent).to.have.property('hcps');
            expect(lastEvent).to.have.property('initialCount');
            expect(lastEvent).to.have.property('place');
            expect(lastEvent).to.have.property('type');
            expect(lastEvent).to.have.property('vaccinationId');
            expect(lastEvent).to.have.property('vaccines');
            expect(lastEvent).to.have.property('_id');
        });

        test('Get list of vaccinations by ministry', async () => {
            const res = await chai.request(server)
                .get('/vaccinations/events')
                .set('token', ministry.token);
            expect(res.statusCode).to.equal(200);
            const [lastEvent] = res.body.items;
            expect(lastEvent).to.have.property('allowedDates');
            expect(lastEvent).to.have.property('availableCount');
            expect(lastEvent).to.have.property('bigIds');
            expect(lastEvent).to.have.property('hcps');
            expect(lastEvent).to.have.property('initialCount');
            expect(lastEvent).to.have.property('place');
            expect(lastEvent).to.have.property('type');
            expect(lastEvent).to.have.property('vaccinationId');
            expect(lastEvent).to.have.property('vaccines');
            expect(lastEvent).to.have.property('_id');
        });

        test('Get list of vaccinations with filters: bigId, placeName, eventType', async () => {
            const res = await chai.request(server)
                .get(`/vaccinations/events?placeName=${place.name}&eventType=${EVENT_TYPES.BLOOD_TEST}`)
                .set('token', ministry.token);
            expect(res.statusCode).to.equal(200);
            const lastEvent = res.body.items.pop();
            expect(lastEvent).to.have.all.keys([
                'availableCount',
                'allowedDates',
                'hcps',
                'initialCount',
                'finishedCount',
                'place',
                'type',
                'vaccines',
                '_id',
                'vaccinationId',
                'bigIds']);
            expect(lastEvent).to.have.property('type', EVENT_TYPES.BLOOD_TEST);
            expect(lastEvent.place).to.have.property('name', place.name);
        });

        test('Get list of vaccinations with filters: vaccine', async () => {
            const res = await chai.request(server)
                .get(`/vaccinations/events?vaccine=${vaccine.batchCode}`)
                .set('token', hcpManager.token);
            expect(res.statusCode).to.equal(200);
            const [lastEvent] = res.body.items;
            expect(lastEvent).to.have.property('allowedDates');
            expect(lastEvent).to.have.property('place');
            expect(lastEvent).to.have.property('type');
            expect(lastEvent).to.have.property('vaccines');
            expect(lastEvent).to.have.property('_id');
            expect(lastEvent).to.have.property('bigIds');
        });

        test('Get list of vaccinations with pagination', async () => {
            const res = await chai.request(server)
                .get('/vaccinations/events?pageIndex=0&pageSize=3')
                .set('token', ministry.token);
            const totalCount = await Vaccination.count();
            expect(res.statusCode).to.equal(200);
            expect(res.body.items.length).to.be.lessThan(4);
            expect(res.body).to.have.property('pagination');
            expect(res.body.pagination.count).to.be.greaterThan(totalCount * 3);
            expect(res.body.pagination).to.have.all.keys(['pageIndex', 'pageSize', 'count']);
            const lastEvent = res.body.items.pop();
            expect(lastEvent).to.have.property('allowedDates');
            expect(lastEvent).to.have.property('place');
            expect(lastEvent).to.have.property('type');
            expect(lastEvent).to.have.property('vaccines');
            expect(lastEvent).to.have.property('_id');
            expect(lastEvent).to.have.property('bigIds');
        });
    });

    suite('Get event details', async () => {
        test('Get event details', async () => {
            const res = await chai.request(server)
                .get(`/vaccinations/events/${vaccineEvent._id}`)
                .set('token', ministry.token);
            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.keys([
                '_id',
                'type',
                'vaccines',
                'place',
                'allowedDates',
                'bigIds',
                'initialCount',
                'finishedCount',
                'availableCount']);
            expect(res.body.vaccines[0]).to.have.keys([
                '_id',
                'batchCode',
                'type',
                'name',
                'price',
                'bloodTestPrice',
                'initialAmount',
                'availableAmount',
                'finishedAmount']);
        });
    });

    suite('Get vaccination statistics', async () => {
        test('Get vaccination statistics without auth', async () => {
            const res = await chai.request(server)
                .get(`/vaccinations/${vaccination._id}/statistics`);
            expect(res.statusCode).to.equal(401);
        });

        test('Get vaccination statistics by student', async () => {
            const res = await chai.request(server)
                .get(`/vaccinations/${vaccination._id}/statistics`)
                .set('token', student.token);
            expect(res.statusCode).to.equal(403);
        });

        test('Get vaccination statistics by HCP manager', async () => {
            const res = await chai.request(server)
                .get(`/vaccinations/${vaccination._id}/statistics`)
                .set('token', hcpManager.token);
            expect(res.statusCode).to.equal(403);
        });

        test('Get vaccination statistics by HCP', async () => {
            const res = await chai.request(server)
                .get(`/vaccinations/${vaccination._id}/statistics`)
                .set('token', hcp.token);
            expect(res.statusCode).to.equal(403);
        });

        test('Get vaccination - not found', async () => {
            const res = await chai.request(server)
                .get(`/vaccinations/${vaccineEvent._id}/statistics`)
                .set('token', ministry.token);
            expect(res.statusCode).to.equal(404);
        });

        test('Get vaccination statistics', async () => {
            const res = await chai.request(server)
                .get(`/vaccinations/${vaccination._id}/statistics`)
                .set('token', ministry.token);
            expect(res.statusCode).to.equal(200);
            expect(res.body.length).to.be.equal(4);
            expect(res.body[0]).to.be.have.keys([
                'availableCount',
                'finishedAmount',
                'finishedCount',
                'initialAmount',
                'initialCount',
                'type']);
        });
    });

    suite('Get event persons lists', async () => {
        let event;
        let hcp2;
        suiteSetup('Add appointments', async () => {
            hcp2 = await createHCProvider(`${Math.round(Math.random() * 1000000000)}`);
            event = await createEvent(server, hcpManager, vaccine, hcp2);
            await addAppointment(server, ministry, event, student);
        });
        test('Get event students', async () => {
            const res = await chai.request(server)
                .get(`/vaccinations/events/${event._id}/students`)
                .set('token', ministry.token);
            expect(res.statusCode).to.equal(200);
            expect(res.body.length).to.equal(1);
            expect(res.body[0]).to.have.property('_id', student._id.toString());
            expect(res.body[0]).to.have.property('duoId');
            expect(res.body[0]).to.have.property('firstName');
            expect(res.body[0]).to.have.property('lastName');
            expect(res.body[0]).to.have.property('appointmentId');
        });
        test('Get event HCPs', async () => {
            const res = await chai.request(server)
                .get(`/vaccinations/events/${event._id}/hcproviders`)
                .set('token', ministry.token);
            expect(res.statusCode).to.equal(200);
            expect(res.body.length).to.equal(1);
            expect(res.body[0]).to.have.property('bigId', hcp2.bigId);
            expect(res.body[0]).to.have.property('firstName');
            expect(res.body[0]).to.have.property('lastName');
            expect(res.body[0]).to.have.property('_id');
        });
    });
});
