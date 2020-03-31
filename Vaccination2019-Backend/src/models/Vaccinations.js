/* eslint-disable no-param-reassign,max-len */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const EventSchema = new Schema(
    {
        type: String,
        initialCount: Number,
        availableCount: Number,
        finishedCount: { type: Number, default: 0 },
        bigIds: [String],
        allowedDates: [Date],
        place: {
            name: String,
            address: String,
            addressDetails: Object,
            latitude: Number,
            longitude: Number,
        },
    },
    { versionKey: false }
);

const VaccinationSchema = new Schema(
    {
        steps: [EventSchema],
        vaccines: [mongoose.Schema.ObjectId],
    },
    { versionKey: false }
);

VaccinationSchema.statics.getEvents = async ($match) => {
    const $unwind = {
        $unwind: '$steps',
    };
    const $lookupVaccine = {
        from: 'vaccines',
        localField: 'vaccines',
        foreignField: '_id',
        as: 'vaccineEntities',
    };
    const $lookupBloodTest = {
        from: 'events',
        localField: '_id',
        foreignField: 'vaccinationEvent',
        as: 'bloodTestEntity',
    };
    const $project = {
        _id: 0,
        vaccine: 0,
        vaccinationEvent: 0,
    };
    const events = await mongoose.model('events').aggregate([
        { $unwind },
        { $match },
        { $lookup: $lookupVaccine },
        { $lookup: $lookupBloodTest },
        { $project },
    ]);
    events.forEach((event) => {
        const e = event.steps;
        e.vaccines = e.vaccineEntities;
        delete e.vaccineEntities;
        if (e.bloodTestEntity[0]) {
            e.bloodTest = e.bloodTestEntity[0]._id;
        }
        delete e.bloodTestEntity;
        return e;
    });
    return events;
};

VaccinationSchema.statics.getEventDetails = async $match => (await VaccinationSchema.statics.getEvents($match))[0];

const model = mongoose.model('vaccinations', VaccinationSchema);

module.exports = model;
