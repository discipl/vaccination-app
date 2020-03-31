/* eslint-disable prefer-destructuring */
const request = require('request-promise-native');
const { BIG_URL } = require('../../config');
const logger = require('../../utils/logger');

async function find(bigId) {
    let user;
    const options = {
        url: `${BIG_URL}${bigId}`,
        method: 'GET',
        json: true,
    };
    try {
        user = await request(options);
    } catch (e) {
        // do nothing
    }
    if (!user) {
        logger.info(`Healthcare provider could not be found by bigId = '${bigId}'`);
    } else {
        user.bigId = bigId;
        // todo convert user to db format after BIG API becomes available
        user.address = { address: user.address };
        user.hcProvider = { ...user };
        if (user.hcProvider.healthcareProvider) {
            user.hcProvider.healthcareProvider.address = { ...user.hcProvider.healthcareProvider };
        }
    }
    return user;
}

module.exports = {
    find,
};
