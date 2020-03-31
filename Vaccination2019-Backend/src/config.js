require('dotenv').config({ path: `${__dirname}/.env` });

const constants = {
    PORT: process.env.PORT || 8080,
    MONGO_URL: process.env.MONGO_URL,
    NODE_ENV: process.env.NODE_ENV,
    TEST_MODE: process.env.TEST_MODE,
    BRANCH: process.env.BRANCH,
    SHORT: process.env.SHORT,
    BIG_URL: process.env.BIG_URL,
    DUO_URL: process.env.DUO_URL,
    BC_LOG_URL: process.env.BC_LOG_URL,
    BCRYPT_SALTROUNDS: 10,

    ROLES: {
        HEALTHCARE_PROVIDER: 'HEALTHCARE_PROVIDER',
        STUDENT: 'STUDENT',
        MINISTRY: 'MINISTRY',
        HCP_MANAGER: 'HCP_MANAGER',
    },

    EVENT_TYPES: {
        VACCINATION: 'VACCINATION',
        BLOOD_TEST: 'BLOOD_TEST',
    },

    MINISTRY: {
        LOGIN: process.env.MINISTRY_LOGIN,
        DEFAULT_PASS: process.env.MINISTRY_DEFAULT_PASS,
    },

    VACCINE_TYPES: [
        {
            producer: 'GSK', drug: 'Engerix B', dosage: '20 microgram /1,0 ml', comment: '≥ 16 jaar',
        },
        {
            producer: 'SPMSD', drug: 'HBVaxpro', dosage: '10 microgram /1,0 ml', comment: '≥ 16 jaar',
        },
        {
            producer: 'GSK', drug: 'Fendrix', dosage: '50 microgram /0,5 ml', comment: '≥ 15 jaar - alleen voor patiënten met nierinsufficiëntie',
        },
    ],
};

module.exports = constants;
