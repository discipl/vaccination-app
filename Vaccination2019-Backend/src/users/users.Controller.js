const randomstring = require('randomstring');
const bigAdapter = require('./big/big.Resolver');
const duoAdapter = require('./duo/duo.Resolver');
const userHelper = require('./users.Helper');
const APIError = require('../utils/apiError');
const APISuccess = require('../utils/successResponses');
const logger = require('../utils/logger');
const User = require('../models/User');
const { MINISTRY, ROLES } = require('../config');

async function registration(req, res) {
    const {
        bigId,
        duoId,
        password,
        HCPManagerNumber,
    } = req.body;

    if (HCPManagerNumber && req.user.role !== ROLES.MINISTRY) throw APIError.forbidden();

    const userFilter = {};
    if (bigId) userFilter.bigId = bigId;
    else if (duoId) userFilter.duoId = duoId;
    else if (HCPManagerNumber) userFilter.HCPManagerNumber = HCPManagerNumber;

    const existentUser = await User.findOne(userFilter);
    if (existentUser) {
        res.status(409).send(APIError.userAlreadyExists());
        return;
    }

    let user;
    if (bigId) {
        logger.info('try to find user by bigId');
        user = await bigAdapter.find(bigId);
    } else if (duoId) {
        logger.info('try to find user by duoId');
        user = await duoAdapter.find(duoId);
    } else if (HCPManagerNumber) {
        logger.info('HCP Managers registration');
        user = { HCPManagerNumber };
    }

    if (!user) {
        res.status(400).send(APIError.invalidArgumentsError(bigId ? 'bigId' : 'duoId'));
        return;
    }

    logger.info('user was found');
    const dbUser = new User(user);
    dbUser.password = userHelper.hashPassword(password);
    dbUser.token = userHelper.generateToken();
    await dbUser.save();

    if (!HCPManagerNumber) {
        res.header('token', dbUser.token);
        res.cookie('token', dbUser.token);
    }
    res.status(201).send(dbUser.fitted);
}

async function changeLogin(req, res) {
    const { login } = req.body;
    const existentUser = await User.findOne({ login });
    if (existentUser || login === MINISTRY.LOGIN) {
        res.status(409).send(APIError.loginIsOccupied());
        return;
    }

    const { user } = req;
    await User.updateOne({ _id: user._id }, { login });
    res.status(200).send(APISuccess.ok());
}

async function createMinistryUser() {
    const user = new User({
        login: MINISTRY.LOGIN,
        password: userHelper.hashPassword(MINISTRY.DEFAULT_PASS),
        token: userHelper.generateToken(),
    });
    await user.save();
    return user;
}

async function loginUser(req, res) {
    const {
        bigId,
        duoId,
        login,
        HCPManagerNumber,
        password,
    } = req.body;
    let user;
    if (bigId) {
        user = await User.findOne({ bigId });
    } else if (duoId) {
        user = await User.findOne({ duoId });
    } else if (HCPManagerNumber) {
        user = await User.findOne({ HCPManagerNumber });
    } else {
        user = await User.findOne({ login });
        if (!user && login === MINISTRY.LOGIN && password === MINISTRY.DEFAULT_PASS) {
            user = await createMinistryUser();
        }
    }

    if (!user || !userHelper.comparePasswords(password, user.password)) {
        res.status(400).send(APIError.credentialsInvalidError());
        return;
    }

    user.token = userHelper.generateToken();
    await user.save();
    res.header('token', user.token);
    res.cookie('token', user.token);
    res.status(200).send(user.fitted);
}

async function logout(req, res) {
    const { user } = req;
    const dbUser = await User.findOne({ _id: user._id });
    dbUser.token = null;
    await dbUser.save();
    res.status(200).send(APISuccess.ok());
}

async function getUser(req, res) {
    const { user } = req;
    const { userId } = req.params;

    let resultUser;
    if (userId) {
        resultUser = await User.findOne({ _id: userId });
    } else {
        resultUser = user;
    }

    if (resultUser) {
        res.status(200).send(resultUser.fitted);
    } else {
        res.status(404).send(APIError.objectNotFoundError('user'));
    }
}

async function getUserVaccinations(req, res) {
    const { user } = req;
    const { userId } = req.params;
    if (!user._id.equals(userId)) throw APIError.objectNotFoundError('user');
    const vaccinations = await userHelper.getVaccinations(user);
    res.status(200).send(vaccinations);
}

async function getUserByDUO(req, res) {
    const { duoId } = req.params;
    const student = await duoAdapter.find(duoId);
    logger.info(student);
    if (!student) throw APIError.objectNotFoundError('student');
    const result = {
        firstName: student.firstName,
        lastName: student.lastName,
        duoId: student.duoId,
    };
    res.status(200).send(result);
}

async function generateToken(req, res) {
    const { user } = req;
    const { userId } = req.params;
    if (userId.toString() !== user._id.toString()) throw APIError.objectNotFoundError('user');
    user.qrToken = randomstring.generate();
    await user.save();
    res.status(200).send({ token: user.qrToken });
}

async function getUserFromBIG(req, res) {
    const { bigId } = req.params;
    const hcp = await bigAdapter.find(bigId);
    logger.info(hcp);
    if (!hcp) throw APIError.objectNotFoundError('healthcareProvider');
    const result = {
        firstName: hcp.firstName,
        lastName: hcp.lastName,
        bigId: hcp.bigId,
    };
    res.status(200).send(result);
}

async function getHCPManagers(req, res) {
    const { HCPManagerNumber } = req.query;
    const pageIndex = Number(req.query.pageIndex);
    const pageSize = Number(req.query.pageSize);
    const pagination = {};
    const match = { HCPManagerNumber: { $ne: null } };

    if (HCPManagerNumber) match.HCPManagerNumber = HCPManagerNumber;

    const totalItems = await User.find(match).sort({ _id: -1 });
    pagination.count = totalItems.length;
    let hcpManagers;
    if ((pageSize > 0) && (pageIndex > -1)) {
        hcpManagers = totalItems.slice(pageSize * pageIndex, pageSize * pageIndex + pageSize);
        pagination.pageIndex = pageIndex;
        pagination.pageSize = pageSize;
    } else {
        hcpManagers = totalItems;
    }
    const items = hcpManagers.map(s => ({ HCPManagerNumber: s.HCPManagerNumber, _id: s._id }));
    res.status(200).send({ items, pagination });
}

module.exports = {
    registration,
    changeLogin,
    login: loginUser,
    logout,
    getUser,
    getUserVaccinations,
    getUserByDUO,
    generateToken,
    getUserFromBIG,
    getHCPManagers,
};
