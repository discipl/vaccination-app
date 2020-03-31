const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const { ACTIONS } = require('./appointments.Constants');

const getAppointment = Joi.object({
    params: {
        appointmentId: Joi.objectId().required(),
    },
});

const addAppointment = Joi.object(
    {
        body: {
            event: Joi.objectId().required(),
            chosenDate: Joi.date().required(),
        },
    });

const makeAction = Joi.object(
    {
        params: {
            appointmentId: Joi.objectId().required(),
        },
        body: {
            action: Joi.string().valid(Object.keys(ACTIONS)).required(),
            token: Joi.when('action', {
                is: Joi.valid(ACTIONS.CONFIRM_OPPONENT),
                then: Joi.string().required(),
            }),
        },
    });

module.exports = {
    getAppointment,
    addAppointment,
    makeAction,
};
