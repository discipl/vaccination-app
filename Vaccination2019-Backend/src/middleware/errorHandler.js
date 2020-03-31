const APIError = require('../utils/apiError');

const afterAll = (error, req, res, next) => {
    APIError.errorResponseHandler(error, res, next);
    return next();
};
module.exports = { afterAll };
