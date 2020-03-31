const mongoose = require('mongoose');
const _ = require('lodash');
const { ROLES } = require('../config');

const { Schema } = mongoose;

const AddressSchemaTemplate = {
    _id: false,
    address: String,
    zipCode: Number,
    country: String,
};

const AddressSchema = new Schema(AddressSchemaTemplate);

const StudentSchema = new Schema({
    _id: false,
    study: String,
    crebo: Boolean,
    school: new Schema({
        name: String,
        ...AddressSchemaTemplate,
    }),
});

const HCProviderSchema = new Schema({
    _id: false,
    diploma: String,
    vaccinationDiploma: Boolean,
    healthcareProvider: {
        name: String,
        address: AddressSchema,
    },
});

const UserSchema = new Schema(
    {
        login: String,
        password: String,
        token: String,
        qrToken: String,

        firstName: String,
        lastName: String,
        dateOfBirth: Date,
        address: AddressSchema,

        duoId: String,
        bigId: String,
        HCPManagerNumber: String,

        student: StudentSchema,
        hcProvider: HCProviderSchema,
    },
    { versionKey: false },
    { collection: 'users' }
);

UserSchema.virtual('role').get(function get() {
    let role;
    if (this.bigId) {
        role = ROLES.HEALTHCARE_PROVIDER;
    } else if (this.duoId) {
        role = ROLES.STUDENT;
    } else if (this.HCPManagerNumber) {
        role = ROLES.HCP_MANAGER;
    } else {
        role = ROLES.MINISTRY;
    }
    return role;
});

UserSchema.virtual('fitted').get(function get() {
    const fitted = _.omit(this._doc, ['token', 'password', '_v']);
    fitted.role = this.role;
    return fitted;
});

const model = mongoose.model('users', UserSchema);

module.exports = model;
