const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const commonSchema = require('../common/common.Schema');

const password = Joi.string().required();
const login = Joi.string();

const registration = Joi.object(
    {
        body: Joi.object().keys({
            bigId: commonSchema.bigId,
            duoId: commonSchema.duoId,
            HCPManagerNumber: Joi.string(),
            password,
        })
            .xor('bigId', 'duoId', 'HCPManagerNumber'),
    });

const changeLogin = Joi.object({
    body: { login: login.required() },
});

const loginScheme = Joi.object(
    {
        body: Joi.object().keys({
            bigId: commonSchema.bigId,
            duoId: commonSchema.duoId,
            HCPManagerNumber: Joi.string(),
            login,
            password,
        })
            .xor('bigId', 'duoId', 'login', 'HCPManagerNumber'),
    });

const getUser = Joi.object(
    {
        params: {
            userId: Joi.objectId().required(),
        },
    });
const getUserByDUO = Joi.object(
    {
        params: { duoId: Joi.number().integer().required() },
    }
);

const getUserByBIG = Joi.object(
    {
        params: { bigId: Joi.number().integer().required() },
    }
);

const getHCPManagers = Joi.object({
    query: {
        pageIndex: Joi.number(),
        pageSize: Joi.number(),
        HCPManagerNumber: Joi.string(),
    },
});

module.exports = {
    registration,
    changeLogin,
    login: loginScheme,
    getUser,
    getUserVaccinations: getUser,
    getUserByDUO,
    getToken: getUser,
    getUserByBIG,
    getHCPManagers,
};
