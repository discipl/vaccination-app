const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const { EVENT_TYPES } = require('../config');

const EventShcema = {
    name: Joi.string(),
    bigIds: Joi.array().items(Joi.string().required()).required(),
    date: Joi.date().required(),
    alternativeDate: Joi.date().required(),
    place: {
        name: Joi.string().required(),
        address: Joi.string().required(),
        latitude: Joi.number(),
        longitude: Joi.number(),
    },
};

const addVaccination = Joi.object(
    {
        body: {
            steps: Joi.array().items(EventShcema).required(),
            vaccines: Joi.array().items(Joi.objectId().required()),
            initialCount: Joi.number().integer().min(3).required(),
        },
    });

const addBloodTest = Joi.object(
    {
        body: Joi.object(EventShcema).required(),
    });

const eventFilters = Joi.object(
    {
        query: {
            eventType: Joi.string().valid(Object.values(EVENT_TYPES)),
            dateFrom: Joi.date(),
            dateTo: Joi.date(),
            pageIndex: Joi.number().integer().min(0),
            pageSize: Joi.number().integer().min(1),
        },
    }
);

const eventId = Joi.object(
    {
        params: { eventId: Joi.objectId().required() },
    }
);

const vaccinationId = Joi.object(
    {
        params: { vaccinationId: Joi.objectId().required() },
    }
);

module.exports = {
    addVaccination,
    addBloodTest,
    eventFilters,
    eventId,
    vaccinationId,
};
