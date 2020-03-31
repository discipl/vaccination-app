/* eslint-disable global-require,import/no-extraneous-dependencies */
const chai = require('chai');
const chaiHttp = require('chai-http');
const { ObjectID } = require('mongodb');
const logger = require('../src/utils/logger');

const randomObjectId = new ObjectID().toString();

require('./testEnvironmentPreparer')();

const { expect } = chai;
chai.use(chaiHttp);

const server = require('../src/server');
const { createMinistry, createStudent, createHCPManager } = require('./common.test.functions');
const Vaccine = require('../src/models/Vaccine');

suite('Vaccine types', async () => {
    let ministry;
    let student;
    let hcpManager;

    suiteSetup('Setup environmentExample', async () => {
        await require('./testEnvironmentPreparer')();
        ministry = await createMinistry();
        student = await createStudent(`${Math.round(Math.random() * 1000000000)}`);
        hcpManager = await createHCPManager(`${Math.round(Math.random() * 1000000000)}`);
    });

    test('Get vaccine types without authorization', async () => {
        const res = await chai.request(server)
            .get('/vaccines/types')
            .send({});
        expect(res.statusCode).to.equal(401);
    });

    test('Get vaccine types - Forbiddent', async () => {
        const res = await chai.request(server)
            .get('/vaccines/types')
            .set('token', student.token)
            .send({});
        expect(res.statusCode).to.equal(403);
    });

    test('Get vaccine types', async () => {
        const res = await chai.request(server)
            .get('/vaccines/types')
            .set('token', ministry.token)
            .send({});
        expect(res.statusCode).to.equal(200);
        expect(res.body.length).to.be.greaterThan(0);
        expect(res.body[0]).to.have.property('_id');
        expect(res.body[0]).to.have.property('producer');
        expect(res.body[0]).to.have.property('drug');
        expect(res.body[0]).to.have.property('dosage');
        expect(res.body[0]).to.have.property('comment');
    });

    test('Get vaccine types by HCP Managers', async () => {
        const res = await chai.request(server)
            .get('/vaccines/types')
            .set('token', hcpManager.token)
            .send({});
        expect(res.statusCode).to.equal(200);
    });
});

suite('Vaccines', async () => {
    let ministry;
    let student;
    let vaccineCountBeforeAdding;
    let vaccineId;
    let vaccineTypes;
    let hcpManager;
    const vaccine = {
        batchCode: `VaccineBatchCode1_${Math.random()}`,
        name: 'VaccineName',
        price: 1001.1,
        bloodTestPrice: 50.5,
        initialAmount: 10,
    };
    const analysis = {
        batchCode: `AnalysisBatchCode1_${Math.random()}`,
        name: 'AnalysisName',
        price: 1002,
        bloodTestPrice: 51.5,
        initialAmount: 10,
    };

    suiteSetup('Setup environmentExample', async () => {
        await require('./testEnvironmentPreparer')();
        ministry = await createMinistry();
        student = await createStudent(`${Math.round(Math.random() * 1000000000)}`);
        hcpManager = await createHCPManager(`${Math.round(Math.random() * 1000000000)}`);
        vaccineTypes = (await chai.request(server)
            .get('/vaccines/types')
            .set('token', ministry.token)
            .send({})).body;
        vaccine.type = vaccineTypes[0]._id;
        analysis.type = vaccineTypes[0]._id;
    });

    test('Add vaccine without authorization', async () => {
        const res = await chai.request(server)
            .put('/vaccines')
            .send({});
        expect(res.statusCode).to.equal(401);
    });

    test('Add vaccine with incorrect params', async () => {
        const res = await chai.request(server)
            .put('/vaccines')
            .set('token', ministry.token)
            .send({});
        expect(res.statusCode).to.equal(400);
    });

    test('Add vaccine by student', async () => {
        const res = await chai.request(server)
            .put('/vaccines')
            .set('token', student.token)
            .send({});
        expect(res.statusCode).to.equal(403);
    });

    test('Add vaccine by HCP Managers', async () => {
        const res = await chai.request(server)
            .put('/vaccines')
            .set('token', hcpManager.token)
            .send({});
        expect(res.statusCode).to.equal(403);
    });

    test('Add vaccine with zero initialAmount', async () => {
        const res = await chai.request(server)
            .put('/vaccines')
            .set('token', ministry.token)
            .send({
                ...vaccine,
                initialAmount: 0,
            });
        expect(res.statusCode).to.equal(400);
    });

    test('Add vaccines', async () => {
        vaccineCountBeforeAdding = (await Vaccine.find({})).length;

        const res1 = await chai.request(server)
            .put('/vaccines')
            .set('token', ministry.token)
            .send(vaccine);
        expect(res1.statusCode).to.equal(201);
        expect(res1.body).to.have.property('_id');
        vaccine._id = res1.body._id;
        vaccine.availableAmount = vaccine.initialAmount;
        vaccine.finishedAmount = 0;
        expect(res1.body).to.deep.equal(vaccine);

        const res2 = await chai.request(server)
            .put('/vaccines')
            .set('token', ministry.token)
            .send(analysis);
        expect(res2.statusCode).to.equal(201);
        expect(res1.body).to.have.property('_id');
        analysis._id = res2.body._id;
        analysis.availableAmount = analysis.initialAmount;
        analysis.finishedAmount = 0;
        expect(res2.body).to.deep.equal(analysis);

        const vaccineCountAfter = (await Vaccine.find({})).length;
        expect(vaccineCountAfter).to.equal(vaccineCountBeforeAdding + 2);
    });

    test('Add vaccine once again', async () => {
        const res1 = await chai.request(server)
            .put('/vaccines')
            .set('token', ministry.token)
            .send({
                batchCode: vaccine.batchCode,
                type: vaccine.type,
                initialAmount: 1,
                price: 50,
                bloodTestPrice: 40,
            });
        expect(res1.statusCode).to.equal(409);
    });

    test('Get list of vaccines by student', async () => {
        const res = await chai.request(server)
            .get('/vaccines')
            .set('token', student.token);
        expect(res.statusCode).to.equal(403);
    });

    test('Get list of vaccines by HCP Managers', async () => {
        const res = await chai.request(server)
            .get('/vaccines')
            .set('token', hcpManager.token);
        expect(res.statusCode).to.equal(200);
        expect(res.body.items[0]).to.not.have.property('price');
        expect(res.body.items[0]).to.not.have.property('bloodTestPrice');
        expect(res.body.items[0]).to.have.property('batchCode');
        expect(res.body.items[0]).to.have.property('type');
        expect(res.body.items[0]).to.have.property('name');
        expect(res.body.items[0]).to.not.have.property('initialAmount');
    });

    test('Get list of vaccines by ministry', async () => {
        const res = await chai.request(server)
            .get('/vaccines')
            .set('token', ministry.token);
        expect(res.statusCode).to.equal(200);
        expect(res.body.pagination.count).to.equal(vaccineCountBeforeAdding + 2);
        vaccineId = res.body.items[0]._id;
    });

    test('Get vaccine without auth', async () => {
        const res = await chai.request(server)
            .get(`/vaccines/${vaccineId}`);
        expect(res.statusCode).to.equal(401);
    });

    test('Get vaccine by ministry', async () => {
        const res = await chai.request(server)
            .get(`/vaccines/${vaccineId}`)
            .set('token', ministry.token);
        logger.info(vaccineId.toString());
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.keys(['_id', 'type', 'price', 'bloodTestPrice', 'batchCode', 'name', 'initialAmount', 'availableAmount', 'finishedAmount']);
    });

    test('Get vaccine by ministry - Not found', async () => {
        const res = await chai.request(server)
            .get(`/vaccines/${randomObjectId}`)
            .set('token', ministry.token);
        logger.info(JSON.stringify(res.body));
        expect(res.statusCode).to.equal(404);
    });

    test('Get vaccine by student - Forbidden', async () => {
        const res = await chai.request(server)
            .get(`/vaccines/${vaccineId}`)
            .set('token', student.token);
        expect(res.statusCode).to.equal(403);
    });

    test('Get vaccine statistics without auth', async () => {
        const res = await chai.request(server)
            .get(`/vaccines/${vaccineId}/statistics`);
        expect(res.statusCode).to.equal(401);
    });

    test('Get vaccine statistics by student', async () => {
        const res = await chai.request(server)
            .get(`/vaccines/${vaccineId}/statistics`)
            .set('token', student.token);
        expect(res.statusCode).to.equal(403);
    });

    test('Get vaccine statistics by HCP manager', async () => {
        const res = await chai.request(server)
            .get(`/vaccines/${vaccineId}/statistics`)
            .set('token', hcpManager.token);
        expect(res.statusCode).to.equal(403);
    });

    test('Get vaccine statistics by ministry', async () => {
        const res = await chai.request(server)
            .get(`/vaccines/${vaccineId}/statistics`)
            .set('token', ministry.token);
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.keys([
            'availableCount',
            'finishedAmount',
            'finishedCount',
            'initialAmount',
            'initialCount']);
    });
});

suite('Vaccines filters', async () => {
    let ministry;
    const vaccine1 = {
        batchCode: `VaccineBatchCode1_${Math.random()}`,
        name: 'VaccineName',
        price: 1001.1,
        bloodTestPrice: 30,
        initialAmount: 10,
    };
    const vaccine2 = {
        batchCode: `VaccineBatchCode1_${Math.random()}`,
        name: 'VaccineName',
        price: 1001.1,
        bloodTestPrice: 30,
        initialAmount: 10,
    };

    suiteSetup('Setup environmentExample', async () => {
        await require('./testEnvironmentPreparer')();
        ministry = await createMinistry();
        const vaccineTypes = (await chai.request(server)
            .get('/vaccines/types')
            .set('token', ministry.token)
            .send({})).body;
        vaccine1.type = vaccineTypes[0]._id;
        vaccine2.type = vaccineTypes[1]._id;
        const res1 = await chai.request(server)
            .put('/vaccines')
            .set('token', ministry.token)
            .send(vaccine1);
        expect(res1.statusCode).to.equal(201);
        vaccine1._id = res1.body._id;
        const res2 = await chai.request(server)
            .put('/vaccines')
            .set('token', ministry.token)
            .send(vaccine2);
        expect(res2.statusCode).to.equal(201);
        vaccine2._id = res2.body._id;
    });

    test('Vaccines filter - Only batchCode', async () => {
        const res = await chai.request(server)
            .get(`/vaccines?batchCode=${vaccine1.batchCode}`)
            .set('token', ministry.token);
        expect(res.statusCode).to.equal(200);
        expect(res.body.pagination.count).to.equal(1);
        expect(res.body.items[0]._id).to.equal(vaccine1._id);
    });

    test('Vaccines filter - Only vaccineType', async () => {
        const res = await chai.request(server)
            .get(`/vaccines?vaccineType=${vaccine2.type}`)
            .set('token', ministry.token);
        const count = await Vaccine.countDocuments({ type: vaccine2.type });
        expect(res.statusCode).to.equal(200);
        expect(res.body.pagination.count).to.equal(count);
        expect(res.body.items[0]._id).to.equal(vaccine2._id);
    });

    test('Vaccines filter - vaccineType + batchCode', async () => {
        const res = await chai.request(server)
            .get(`/vaccines?batchCode=${vaccine1.batchCode}&vaccineType=${vaccine1.type}`)
            .set('token', ministry.token);
        expect(res.statusCode).to.equal(200);
        expect(res.body.pagination.count).to.equal(1);
        expect(res.body.items[0]._id).to.equal(vaccine1._id);
    });

    test('Vaccines filter - vaccineType + batchCode - empty result', async () => {
        const res = await chai.request(server)
            .get(`/vaccines?batchCode=${vaccine1.batchCode}&vaccineType=${vaccine2.type}`)
            .set('token', ministry.token);
        expect(res.statusCode).to.equal(200);
        expect(res.body.pagination.count).to.equal(0);
    });

    test('Vaccines pagination', async () => {
        const res = await chai.request(server)
            .get('/vaccines?pageIndex=0&pageSize=3')
            .set('token', ministry.token);
        expect(res.statusCode).to.equal(200);
        expect(res.body.items.length).to.be.lessThan(4);
        expect(res.body).to.have.property('pagination');
        expect(res.body.pagination).to.have.all.keys(['pageIndex', 'pageSize', 'count']);
    });

    test('Vaccines search', async () => {
        const res = await chai.request(server)
            .get(`/vaccines/search?batchCode=${vaccine1.batchCode.substr(0, 3)}`)
            .set('token', ministry.token);
        expect(res.statusCode).to.equal(200);
        expect(res.body.length).to.be.greaterThan(0);
    });
});
