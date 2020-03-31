/* eslint-disable no-param-reassign */
const Vaccine = require('../models/Vaccine');
const VaccineTypes = require('../models/VaccineType');
const APIError = require('../utils/apiError');
const blockchainLogger = require('../utils/blockchainLogsHelper');
const fitter = require('../utils/fitter');

async function addVaccine(req, res) {
    const vaccine = new Vaccine(req.body);
    const vaccineType = await VaccineTypes.findOne({ _id: vaccine.type });
    if (!vaccineType) throw APIError.invalidArgumentsError('type');
    vaccine.availableAmount = vaccine.initialAmount;
    const existVaccine = await Vaccine.findOne({ batchCode: vaccine.batchCode });
    if (existVaccine) {
        res.status(409).send(APIError.vaccineAlreadyExists());
        return;
    }
    await vaccine.save();
    await blockchainLogger.logBuyVaccine(vaccine);
    res.status(201).send(vaccine._doc);
}

async function getVaccine(req, res) {
    const vaccine = await Vaccine.findOne({ _id: req.params.vaccineId });
    if (!vaccine) throw APIError.objectNotFoundError('vaccine');
    res.status(200).send(fitter.fitVaccine(vaccine, req.user.role));
}

async function getVaccines(req, res) {
    const {
        vaccineType, batchCode,
    } = req.query;
    const pageIndex = Number(req.query.pageIndex);
    const pageSize = Number(req.query.pageSize);
    const pagination = {};

    const match = {};
    if (batchCode) match.batchCode = batchCode;
    if (vaccineType) match.type = vaccineType;

    const totalItems = await Vaccine.find(match).sort({ _id: -1 });
    pagination.count = totalItems.length;

    let vaccines;
    if ((pageSize > 0) && (pageIndex > -1)) {
        vaccines = totalItems.slice(pageSize * pageIndex, pageSize * pageIndex + pageSize);
        pagination.pageIndex = pageIndex;
        pagination.pageSize = pageSize;
    } else {
        vaccines = totalItems;
    }
    vaccines = vaccines.map(v => fitter.fitVaccine(v, req.user.role));
    res.status(200).send({ items: vaccines, pagination });
}

async function searchVaccines(req, res) {
    const { batchCode } = req.query;
    const $match = {};

    if (batchCode) $match.batchCode = new RegExp(batchCode);

    let vaccines = await Vaccine.find($match).sort({ _id: -1 });
    vaccines = vaccines.map(v => fitter.fitVaccine(v, req.user.role));
    res.status(200).send(vaccines);
}

async function getVaccineTypes(req, res) {
    const vaccineTypes = await VaccineTypes.find();
    res.status(200).send(vaccineTypes);
}

async function getVaccineStatistics(req, res) {
    const vaccine = await Vaccine.findOne({ _id: req.params.vaccineId });
    if (!vaccine) throw APIError.objectNotFoundError('vaccine');
    res.status(200).send({
        initialCount: vaccine.initialAmount > 5 ? vaccine.initialAmount : 0,
        availableCount: vaccine.availableAmount > 5 ? vaccine.initialAmount : 0,
        finishedCount: vaccine.finishedAmount > 5 ? vaccine.initialAmount : 0,
        initialAmount: this.initialAmount * (vaccine.price + vaccine.bloodTestPrice),
        finishedAmount: this.finishedAmount * (vaccine.price + vaccine.bloodTestPrice),
    });
}

module.exports = {
    addVaccine,
    getVaccine,
    getVaccines,
    searchVaccines,
    getVaccineTypes,
    getVaccineStatistics,
};
