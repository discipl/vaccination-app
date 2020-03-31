const Joi = require('joi');

module.exports = {
    bigId: Joi.string(),
    duoId: Joi.string(),
    price: Joi.number(),
};
