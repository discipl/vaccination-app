const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const addVaccine = Joi.object(
    {
        body: {
            name: Joi.string(),
            batchCode: Joi.string().required(),
            type: Joi.objectId().required(),
            price: Joi.number().required(),
            bloodTestPrice: Joi.number().required(),
            initialAmount: Joi.number().required().integer().min(1),
        },
    });

const idInPath = Joi.object({
    params: { vaccineId: Joi.objectId() },
});

const vaccineFilters = Joi.object(
    {
        query: {
            pageIndex: Joi.number(),
            pageSize: Joi.number(),
        },
    }
);

module.exports = {
    addVaccine,
    idInPath,
    vaccineFilters,
};
