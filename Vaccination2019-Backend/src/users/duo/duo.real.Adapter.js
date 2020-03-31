/* eslint-disable prefer-destructuring */
const request = require('request-promise-native');
const { DUO_URL } = require('../../config');
const logger = require('../../utils/logger');

async function find(duoId) {
    let user;
    const options = {
        url: `${DUO_URL}${duoId}`,
        method: 'GET',
        json: true,
    };
    try {
        user = await request(options);
    } catch (e) {
        // do nothing
    }
    if (!user) {
        logger.info(`Student could not be found by duoId = '${duoId}'`);
    } else {
        // todo convert user to db format after DUO API becomes available
        user.student = { ...user };
    }
    return user;
}

module.exports = {
    find,
};
