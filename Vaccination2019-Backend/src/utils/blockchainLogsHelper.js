const request = require('request-promise-native');
const logger = require('./logger');
const BlockchainLog = require('../models/BlockchainLog');
const { BC_LOG_URL } = require('../config');

async function logBuyVaccine(vaccine) {
    const message = `Ministry buys vaccine - (${JSON.stringify(vaccine)})`;
    const reqBody = {
        project: 'Vaccination',
        message,
    };
    const options = {
        url: `${BC_LOG_URL}/api/logs`,
        method: 'POST',
        json: true,
        body: reqBody,
    };
    let guid;
    try {
        guid = await request(options);
        logger.log(message);
        const log = new BlockchainLog({
            action: 'BUY_VACCINE',
            vaccineId: vaccine._id,
            hash: guid,
        });
        await log.save();
    } catch (e) {
        logger.error('Can\'t save log to blockchain');
        logger.error(e);
    }
}

async function logFinishAppointment(appointment, vaccines) {
    const batchCodes = vaccines.map(v => v.batchCode);
    const message = `Student with student number ${appointment.duoId} passed step of vaccination and got doses of vaccines: ${batchCodes}`;
    const reqBody = {
        project: 'Vaccination',
        message,
    };
    const options = {
        url: `${BC_LOG_URL}/api/logs`,
        method: 'POST',
        json: true,
        body: reqBody,
    };
    let guid;
    try {
        guid = await request(options);
        logger.log(message);
        const log = new BlockchainLog({
            action: 'FINISH_STEP',
            appointmentId: appointment._id,
            hash: guid,
        });
        await log.save();
    } catch (e) {
        logger.error('Can\'t save log to blockchain');
        logger.error(e);
    }
}

module.exports = { logBuyVaccine, logFinishAppointment };
