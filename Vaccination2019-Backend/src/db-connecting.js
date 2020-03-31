const mongoose = require('mongoose');

const config = require('./config');
const logger = require('./utils/logger');

async function init() {
    const url = config.MONGO_URL;
    const options = {
        autoIndex: false,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 500,
        poolSize: 500,
        bufferMaxEntries: 0,
        socketTimeoutMS: 0,
        keepAlive: true,
    };
    await mongoose.connect(url, options);
    logger.info('DB connection is established');
}

module.exports = { init };
