const Joi = require('joi-i18n');
const Locale = require('../utils/locale');
const nlLocalization = require('./validator.i18n.nl');

Joi.addLocaleData('en_US', {});
Joi.addLocaleData('nl_NL', nlLocalization);

const getPathString = (arrayPath) => {
    const reducer = (result, current) => `${result}["${current}"]`;
    return arrayPath.reduce(reducer);
};

module.exports = schema => (req, res, next) => {
    const result = schema.validate(req, {
        allowUnknown: true,
        abortEarly: false,
        locale: Locale.getLocaleFromRequestSafe(req),
    });

    if (result.error) {
        const error = { httpStatusCode: 400, code: 'INVALID_ARGUMENTS' };
        error.fields = result.error.details
            .map(e => ({
                param: e.context.key,
                path: getPathString(e.path),
                message: e.message,
                type: e.type === 'any.required' || e.type === 'any.empty'
                    ? 'REQUIRED' : 'INVALID',
            }));
        return res.status(400).json(error);
    }
    return next();
};
