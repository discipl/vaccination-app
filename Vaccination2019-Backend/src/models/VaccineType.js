const mongoose = require('mongoose');

const { Schema } = mongoose;

const VaccineTypeSchema = new Schema(
    {
        producer: String,
        drug: String,
        dosage: String,
        comment: String,
        stepsNumber: { type: Number, default: 3 },
        periods: { type: [Number], default: [30, 150, 90] },
        // minimal days from previous vaccination step
    },
    { versionKey: false },
    { collection: 'vaccineTypes' }
);

VaccineTypeSchema.virtual('fitted').get(function get() {
    return {
        _id: this._id.toString(),
        producer: this.producer,
        drug: this.drug,
        dosage: this.dosage,
        comment: this.comment,
        stepsNumber: this.stepsNumber,
        periods: this.periods,
    };
});

const model = mongoose.model('vaccineTypes', VaccineTypeSchema);

module.exports = model;
