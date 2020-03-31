const chai = require('chai');

const User = require('../src/models/User');
const VaccineType = require('../src/models/VaccineType');
const userHelper = require('../src/users/users.Helper');
const { EVENT_TYPES } = require('../src/config');

function createUser() {
    const random = `user${Math.random()}`;
    const user = new User();
    user.login = random;
    user.password = userHelper.hashPassword(random);
    user.token = `${random}_token`;
    user.firstName = `FN${random}`;
    user.lastName = `LN${random}`;
    return user;
}

async function createStudent(duoId = '123') {
    const student = createUser();
    student.duoId = duoId;
    student.firstName = `Student${student.firstName}`;
    await student.save();
    return student;
}

async function createHCProvider(bigId = '123') {
    const hcProvider = createUser();
    hcProvider.bigId = bigId;
    hcProvider.firstName = `HCProvider${hcProvider.firstName}`;
    await hcProvider.save();
    return hcProvider;
}


async function createHCPManager(HCPManagerNumber = '123') {
    const hcpManager = createUser();
    hcpManager.HCPManagerNumber = HCPManagerNumber;
    hcpManager.firstName = `hcpManager${hcpManager.firstName}`;
    await hcpManager.save();
    return hcpManager;
}

async function createMinistry() {
    const ministry = createUser();
    ministry.firstName = `Ministry${ministry.firstName}`;
    await ministry.save();
    return ministry;
}

async function loginUser(user, server) {
    return await chai.request(server)
        .post('/users/login')
        .send(user);
}

async function createVaccine(server, ministry, amount = 300) {
    const vaccineTypes = await VaccineType.find();
    return (await chai.request(server)
        .put('/vaccines')
        .set('token', ministry.token)
        .send({
            batchCode: `batchCode_${Math.random()}`,
            type: vaccineTypes[0]._id,
            name: 'VaccineName',
            price: 10.1,
            bloodTestPrice: 50,
            initialAmount: amount,
        }))
        .body;
}

async function createEvent(server, user, vaccine, hcProvider) {
    let tomorrow = new Date();
    let secondDate = new Date();
    let thirdDate = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    secondDate.setDate(secondDate.getDate() + 200);
    thirdDate.setDate(thirdDate.getDate() + 500);
    tomorrow = tomorrow.toISOString();
    secondDate = secondDate.toISOString();
    thirdDate = thirdDate.toISOString();

    const requestBody = {
        vaccines: [vaccine._id],
        initialCount: 3,
        steps: [
            {
                bigIds: [hcProvider.bigId],
                date: tomorrow,
                alternativeDate: tomorrow,
                place: {
                    name: 'place name',
                    address: 'place address',
                    latitude: 14.1,
                    longitude: 41.5,
                },
            },
            {
                bigIds: [hcProvider.bigId],
                date: secondDate,
                alternativeDate: secondDate,
                place: {
                    name: 'place name',
                    address: 'place address',
                    latitude: 14.1,
                    longitude: 41.5,
                },
            },
            {
                bigIds: [hcProvider.bigId],
                date: thirdDate,
                alternativeDate: thirdDate,
                place: {
                    name: 'place name',
                    address: 'place address',
                    latitude: 14.1,
                    longitude: 41.5,
                },
            },
        ],
    };
    const response = (await chai.request(server)
        .put('/vaccinations')
        .set('token', user.token)
        .send(requestBody))
        .body;
    return response.steps[0];
}

async function createBloodTest(server, ministry, hcProvider, vaccinationEvent) {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2000);
    tomorrow = tomorrow.toISOString();
    return (await chai.request(server)
        .put(`/vaccinations/${vaccinationEvent}`)
        .set('token', ministry.token)
        .send({
            bigIds: [hcProvider.bigId],
            date: tomorrow,
            alternativeDate: tomorrow,
            place: {
                name: 'place name',
                address: 'place address',
                latitude: 14.1,
                longitude: 41.5,
            },
        }))
        .body;
}

async function addAppointment(server, ministry, event, student) {
    return (await chai.request(server)
        .put('/appointments')
        .set('token', student.token)
        .send({
            event: event._id,
            chosenDate: new Date(event.allowedDates[0]),
        }))
        .body;
}


module.exports = {
    createStudent,
    createHCProvider,
    createMinistry,
    loginUser,
    createVaccine,
    createEvent,
    createBloodTest,
    addAppointment,
    createHCPManager,
};
