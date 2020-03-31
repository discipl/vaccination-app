const { Router } = require('express');
const { wrapList } = require('../utils/wrapper');
const { getVersion } = wrapList(require('./version.Controller'));
const { checkToken } = require('../middleware/userChecker');

const router = new Router();

router.get('/', getVersion);
router.get('/secure', checkToken, getVersion);

module.exports = router;
