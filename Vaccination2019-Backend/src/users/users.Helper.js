const bcrypt = require('bcrypt');
const { SHA3 } = require('sha3');
const Appointment = require('../models/Appointment');
const VaccineType = require('../models/VaccineType');
const { EVENT_TYPES } = require('../config');
const { STATUSES } = require('../appointments/appointments.Constants');

const sha3 = new SHA3(256);
const { BCRYPT_SALTROUNDS } = require('../config');

function hashPassword(password) {
    return bcrypt.hashSync(password, BCRYPT_SALTROUNDS);
}

function comparePasswords(password, hashedPassword) {
    return bcrypt.compareSync(password, hashedPassword);
}

function generateToken() {
    const str = new Date().getTime().toString();
    const nonce = Math.random() * 1000;
    const draft = `${nonce}#${str}`;
    sha3.update(draft);
    return sha3.digest().toString('base64');
}

async function getVaccinations(student) {
    const appointments = await Appointment.aggregate([
        {
            $match: {
                duoId: student.duoId,
                status: {
                    $in: [STATUSES.FINISHED, STATUSES.FINISHED_BY_HEALTHCARE_PROVIDER],
                },
            },
        },
        {
            $lookup: {
                from: 'vaccinations',
                let: { event: '$event' },
                pipeline: [
                    { $unwind: '$steps' },
                    { $match: { $expr: { $eq: ['$steps._id', '$$event'] } } },
                ],
                as: 'event',
            },
        },
        { $unwind: '$event' },
        { $unwind: '$event.steps' },
        {
            $lookup: {
                from: 'vaccines',
                localField: 'event.vaccines',
                foreignField: '_id',
                as: 'vaccineEntities',
            },
        },
    ]);
    const filteredApps = appointments
        .filter(app => app.event && app.event.steps && (app.event.steps.type === EVENT_TYPES.BLOOD_TEST));
    const result = [];
    filteredApps.forEach((app) => {
        const fittedVaccines = app.vaccineEntities.map(vaccine => ({
            _id: vaccine._id,
            batchCode: vaccine.batchCode,
            type: vaccine.type,
            name: vaccine.name,
        }));
        result.push(...fittedVaccines);
    });

    const vaccineTypes = await VaccineType.find({});
    result.forEach((r) => {
        // eslint-disable-next-line no-param-reassign
        [r.type] = vaccineTypes.filter(type => type._id.equals(r.type));
    });
    const resultIds = result.map(r => r._id.toString());
    // this monster removes duplicates
    return result.filter((elem, pos) => resultIds.indexOf(elem._id.toString()) === pos);
}

module.exports = {
    hashPassword,
    comparePasswords,
    generateToken,
    getVaccinations,
};
