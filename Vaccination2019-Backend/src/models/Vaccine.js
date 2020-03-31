const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');

const { Schema } = mongoose;

const VaccineSchema = new Schema(
    {
        batchCode: String,
        type: ObjectID, // VaccineType
        name: String,
        price: Number,
        bloodTestPrice: Number,
        initialAmount: Number, // all amount of vaccines
        availableAmount: Number, // amount of vaccines without appointments
        finishedAmount: { // amount of finished vaccines
            type: Number,
            default: 0,
        },
    },
    { versionKey: false },
    { collection: 'vaccines' }
);

const model = mongoose.model('vaccines', VaccineSchema);

module.exports = model;
