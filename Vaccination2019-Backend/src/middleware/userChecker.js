const User = require('../models/User');
const APIError = require('../utils/apiError');

async function fillUser(req, res, next) {
    try {
        const { token } = req.cookies.token ? req.cookies : req.headers;
        const user = await User.findOne({ token });
        req.user = user;
        if (next) {
            next();
        }
        return !!user;
    } catch (exception) {
        return false;
    }
}

async function checkToken(req, res, next) {
    try {
        if (!(await fillUser(req, res))) {
            res.status(401).send(APIError.tokenInvalidError());
            res.end();
            return;
        }
        next();
    } catch (exception) {
        res.status(500).send(exception);
        res.end();
    }
}

const checkRole = roles => (req, res, next) => {
    const { user } = req;
    if ((typeof roles === 'string' && user.role !== roles)
        || (Array.isArray(roles) && !roles.includes(user.role))) {
        res.status(403).send(APIError.forbidden());
        res.end();
    } else {
        next();
    }
};

module.exports = {
    checkToken,
    checkRole,
    fillUser,
};
