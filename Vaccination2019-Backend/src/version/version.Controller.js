const { BRANCH, SHORT } = require('../config');

const getVersion = async (req, res) => {
    const version = { version: `vB-${BRANCH}.${SHORT}` };
    res.status(200).send(version);
};

module.exports = { getVersion };
