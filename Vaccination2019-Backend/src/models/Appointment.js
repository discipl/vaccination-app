/* eslint-disable no-param-reassign,max-len */
const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');
const { STATUSES, STATUS_ROLE_ACTION } = require('../appointments/appointments.Constants');
const { ROLES } = require('../config');

const { Schema } = mongoose;

const AppointmentSchema = new Schema(
    {
        event: ObjectID,
        duoId: String,
        bigId: String,
        status: {
            type: String,
            default: STATUSES.REGISTERED,
        },
        chosenDate: Date,
    },
    { versionKey: false },
    { collection: 'appointments' }
);

async function getAppointments(user, appointmentId) {
    if (appointmentId && typeof appointmentId === 'string') {
        appointmentId = new ObjectID(appointmentId);
    }
    const $match = {};
    if (appointmentId) $match._id = appointmentId;

    const studentLookup = {
        from: 'users',
        localField: 'duoId',
        foreignField: 'duoId',
        as: 'user',
    };

    const hcProviderLookup = {
        from: 'users',
        let: { bigId: '$bigId' },
        pipeline: [{
            $match: {
                $expr: {
                    $and: [
                        { $eq: ['$bigId', '$$bigId'] },
                    ],
                },
                bigId: { $exists: true },
            },
        }],
        as: 'user',
    };

    const eventLookup = {
        from: 'vaccinations',
        let: { event: '$event' },
        pipeline: [
            { $unwind: '$steps' },
            { $match: { $expr: { $eq: ['$steps._id', '$$event'] } } },
        ],
        as: 'vaccinationEntity',
    };

    const vaccineLookup = {
        from: 'vaccines',
        localField: 'vaccinationEntity.vaccines',
        foreignField: '_id',
        as: 'vaccines',
    };

    const projectBeforeLookup = {
        _id: 1,
        duoId: 1,
        status: 1,
        event: 1,
        chosenDate: 1,
        bigId: 1,
    };

    const projectAfterLookup = {
        _id: 1,
        place: 1,
        status: 1,
        'user._id': 1,
        'user.firstName': 1,
        'user.lastName': 1,
        vaccines: 1,
        vaccinationEntity: 1,
        event: 1,
        chosenDate: 1,
    };
    let appointments = [];
    if (ROLES.MINISTRY === user.role) {
        appointments = await mongoose.model('appointments').aggregate([
            { $match },
            { $project: projectBeforeLookup },
        ]);
    } else if (ROLES.STUDENT === user.role) {
        $match.duoId = `${user.duoId}`;
        appointments = await mongoose.model('appointments').aggregate([
            { $match },
            { $project: projectBeforeLookup },
            { $lookup: eventLookup },
            { $lookup: vaccineLookup },
            { $lookup: hcProviderLookup },
            { $project: projectAfterLookup },
        ]);
    } else if (ROLES.HEALTHCARE_PROVIDER === user.role) {
        $match.bigId = `${user.bigId}`;
        appointments = await mongoose.model('appointments').aggregate([
            { $project: projectBeforeLookup },
            { $match },
            { $lookup: eventLookup },
            { $lookup: vaccineLookup },
            { $lookup: studentLookup },
            { $project: projectAfterLookup },
        ]);
    }
    appointments.forEach((a) => {
        if (a.user && a.user.length) {
            if (ROLES.HEALTHCARE_PROVIDER === user.role) {
                [a.student] = a.user;
            } else if (ROLES.STUDENT === user.role) {
                [a.hcProvider] = a.user;
            }
        }
        delete a.user;
        a.availableActions = STATUS_ROLE_ACTION[a.status] && STATUS_ROLE_ACTION[a.status][user.role];
        a.availableActions = a.availableActions || [];
        if (a.vaccines && a.vaccines.length > 0) {
            a.vaccines = a.vaccines.map(v => ({ _id: v._id, batchCode: v.batchCode, type: v.type }));
        }
        if (a.vaccinationEntity && a.vaccinationEntity.length) {
            const event = a.vaccinationEntity[0].steps;
            a.eventType = event.type;
            a.place = event.place;
            a.eventId = event._id;
            delete a.vaccinationEntity;
        }
        delete a.event;
    });

    const vaccineTypes = (await mongoose.model('vaccineTypes').find({})).map(vt => vt.fitted);
    appointments.forEach((a) => {
        if (a.vaccines) {
            a.vaccines.forEach((v) => {
                // eslint-disable-next-line no-param-reassign
                [v.type] = vaccineTypes.filter(type => type._id === v.type.toString());
            });
        }
    });

    return appointments;
}

AppointmentSchema.statics.getAppointments = async function get(user) {
    return await getAppointments(user);
};
AppointmentSchema.statics.getAppointment = async function get(user, appointmentId) {
    const [appointment] = await getAppointments(user, appointmentId);
    return appointment;
};


const model = mongoose.model('appointments', AppointmentSchema);

module.exports = model;
