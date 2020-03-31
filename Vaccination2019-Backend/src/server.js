const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan-body');

const versionRouter = require('./version/version.Router');
const usersRouter = require('./users/users.Router');
const appointmentsRouter = require('./appointments/appointments.Router');
const vaccinesRouter = require('./vaccines/vaccines.Router');
const vaccinationsRouter = require('./vaccinations/vaccinations.Router');
const swagger = require('./swagger/swagger.Router');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const Locale = require('./utils/locale');

const server = express();

server.use(cookieParser());
server.use(cors({ origin: true, credentials: true, exposedHeaders: ['token'] }));
server.use(compression());
server.use(helmet());
server.use(helmet.noCache());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(bodyParser.text());
server.use(Locale.setLocale);

server.use('/api-docs', swagger);
server.use('/users', usersRouter);
server.use('/appointments', appointmentsRouter);
server.use('/vaccines', vaccinesRouter);
server.use('/vaccinations', vaccinationsRouter);
server.use('/version', versionRouter);
server.use(errorHandler.afterAll);
morgan(server, {
    format: 'default',
    stream: {
        write(str) {
            logger.debug(`\n${str}`);
        },
    },
    noColors: true,
});

module.exports = server;
