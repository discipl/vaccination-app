const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');

const { Schema } = mongoose;

const BlockchainLogSchema = new Schema(
    {
        action: String,
        hash: String,
        vaccineId: ObjectID,
        appointmentId: ObjectID,
    },
    { versionKey: false },
    { collection: 'blockchainLogs' }
);

const model = mongoose.model('blockchainLogs', BlockchainLogSchema);

module.exports = model;
