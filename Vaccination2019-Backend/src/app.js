require('dotenv').config({ path: `${__dirname}/.env` });
const http = require('http');
const logger = require('./utils/logger');
const app = require('./server');
const { PORT, VACCINE_TYPES } = require('./config');
const db = require('./db-connecting');
const { addVaccineTypes } = require('./prescripts/vaccineTypes');

const server = http.createServer(app);

db.init().then(async () => {
    await addVaccineTypes(VACCINE_TYPES);
    server.listen(PORT, async () => {
        logger.info(`Vaccination-Backend is listening at ${PORT}`);
    });
}).catch((err) => {
    logger.error('DB is not available', err);
    process.exit(-1);
});
