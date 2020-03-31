/* eslint-disable global-require */
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;
chai.use(chaiHttp);

const User = require('../src/models/User');
const server = require('../src/server');

suite('Registration', async () => {
    const bigId = '1';
    const duoId = '2';

    suiteSetup('Setup environmentExample', async () => {
        await require('./testEnvironmentPreparer')();
        await User.remove({ duoId });
        await User.remove({ bigId });
    });

    test('No parameters request', async () => {
        const res = await chai.request(server)
            .put('/users')
            .send({});
        expect(res.statusCode).to.equal(400);
    });

    test('Request with both parameters', async () => {
        const res = await chai.request(server)
            .put('/users')
            .send({ bigId: 'random', duoId: 'random' });
        expect(res.statusCode).to.equal(400);
    });

    test('Register by big without password', async () => {
        const res = await chai.request(server)
            .put('/users')
            .send({ bigId: 'random' });
        expect(res.statusCode).to.equal(400);
    });
    test('Register by duo without password', async () => {
        const res = await chai.request(server)
            .put('/users')
            .send({ duoId: 'random' });
        expect(res.statusCode).to.equal(400);
    });

    test('Register nonexistent hcProvider', async () => {
        const res = await chai.request(server)
            .put('/users')
            .send({ bigId: '123456789012', password: 'password' });
        expect(res.statusCode).to.equal(400);
    });

    test('Register exists hcProvider', async () => {
        const res = await chai.request(server)
            .put('/users')
            .send({ bigId, password: 'password' });
        expect(res.statusCode).to.equal(201);
        expect(res.headers).to.have.property('token');
    });

    test('Register exists hcProvider once again', async () => {
        const res = await chai.request(server)
            .put('/users')
            .send({ bigId, password: 'password' });
        expect(res.statusCode).to.equal(409);
    });

    test('Register nonexistent student', async () => {
        const res = await chai.request(server)
            .put('/users')
            .send({ duoId: 12345, password: 'password' });
        expect(res.statusCode).to.equal(400);
    });

    test('Register exists student', async () => {
        const res = await chai.request(server)
            .put('/users')
            .send({ duoId, password: 'password' });
        expect(res.statusCode).to.equal(201);
        expect(res.headers).to.have.property('token');
    });

    test('Register exists student once again', async () => {
        const res = await chai.request(server)
            .put('/users')
            .send({ duoId, password: 'password' });
        expect(res.statusCode).to.equal(409);
    });
});
