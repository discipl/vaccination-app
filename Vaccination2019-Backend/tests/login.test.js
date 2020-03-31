/* eslint-disable global-require, max-len */
const chai = require('chai');
const chaiHttp = require('chai-http');
require('./testEnvironmentPreparer')();

const { expect } = chai;
chai.use(chaiHttp);

const server = require('../src/server');
const { createStudent, createHCProvider, loginUser } = require('./common.test.functions');
const { ROLES, MINISTRY } = require('../src/config');

function checkSecretFieldsExcluded(body) {
    expect(body).to.not.have.property('token');
    expect(body).to.not.have.property('password');
    expect(body).to.not.have.property('_v');
}

suite('Login', async () => {
    let student;
    let studentLogin;
    let hcProvider;

    suiteSetup('Setup environmentExample', async () => {
        await require('./testEnvironmentPreparer')();
        student = await createStudent(`${Math.round(Math.random() * 1000000000)}`);
        studentLogin = student.login;
        student.login = null;
        await student.save();
        hcProvider = await createHCProvider(`${Math.round(Math.random() * 1000000000)}`);
    });

    suite('Change login', async () => {
        test('Try to access secure urls without login', async () => {
            const res = await chai.request(server)
                .get('/version/secure');
            expect(res.statusCode).to.equal(401);
        });

        test('Set exist login', async () => {
            const res = await chai.request(server)
                .post('/users')
                .set('token', student.token)
                .send({ login: hcProvider.login });
            expect(res.statusCode).to.equal(409);
        });

        test('Set ministry login', async () => {
            const res = await chai.request(server)
                .post('/users')
                .set('token', student.token)
                .send({ login: MINISTRY.LOGIN });
            expect(res.statusCode).to.equal(409);
        });

        test('Set login', async () => {
            const res = await chai.request(server)
                .post('/users')
                .set('token', student.token)
                .send({ login: studentLogin });
            expect(res.statusCode).to.equal(200);
        });

        test('Try to access secure urls with setted login', async () => {
            const res = await chai.request(server)
                .get('/version/secure')
                .set('token', student.token);
            expect(res.statusCode).to.equal(200);
        });

        test('Try to access secure urls with cookie', async () => {
            const res = await chai.request(server)
                .get('/version/secure')
                .set('Cookie', `token=${student.token}`);
            expect(res.statusCode).to.equal(200);
        });

        test('Get current user details', async () => {
            const res = await chai.request(server)
                .get('/users')
                .set('token', student.token);
            expect(res.statusCode).to.equal(200);
            expect(res.body.firstName).to.equal(student.firstName);
            checkSecretFieldsExcluded(res.body);
        });

        test('Get details of other user', async () => {
            const res = await chai.request(server)
                .get(`/users/${hcProvider._id}`)
                .set('token', student.token);
            expect(res.statusCode).to.equal(200);
            expect(res.body.firstName).to.equal(hcProvider.firstName);
            checkSecretFieldsExcluded(res.body);
        });
    });

    suite('Login workflow', async () => {
        test('Login with incorrect parameters', async () => {
            const res = await loginUser({}, server);
            expect(res.statusCode).to.equal(400);
            expect(res.body.fields.length).to.equal(2);
        });

        test('Login with nonexistent login', async () => {
            const res = await loginUser({ login: `${Math.random()}`, password: 'pass' }, server);
            expect(res.statusCode).to.equal(400);
        });

        test('Login with incorrect password', async () => {
            const res = await loginUser({ login: studentLogin, password: 'pass' }, server);
            expect(res.statusCode).to.equal(400);
        });

        test('Login with correct parameters', async () => {
            const res = await loginUser({ login: studentLogin, password: studentLogin }, server);
            expect(res.statusCode).to.equal(200);
            expect(res.headers).to.have.property('token');
            expect(res.body).to.have.property('login', studentLogin);
            expect(res.body).to.have.property('_id');
            expect(res.body).to.have.property('role', ROLES.STUDENT);
            checkSecretFieldsExcluded(res.body);
        });

        test('Login hcProvider with duoId', async () => {
            const res = await loginUser({ duoId: student.duoId, password: studentLogin }, server);
            expect(res.statusCode).to.equal(200);
            expect(res.headers).to.have.property('token');
        });

        test('Login hcProvider with bigId', async () => {
            const res = await loginUser({ bigId: hcProvider.bigId, password: hcProvider.login }, server);
            expect(res.statusCode).to.equal(200);
            expect(res.headers).to.have.property('token');
        });
    });
});
