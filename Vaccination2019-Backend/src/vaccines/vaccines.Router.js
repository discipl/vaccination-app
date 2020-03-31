const { Router } = require('express');
const { wrapList } = require('../utils/wrapper');
const controller = wrapList(require('./vaccines.Controller.js'));
const validator = require('../middleware/validator');
const { checkRole, checkToken } = require('../middleware/userChecker');
const schema = require('./vaccines.Schema');
const { MINISTRY, HCP_MANAGER } = require('../config').ROLES;

const router = new Router();

router.use(checkToken);
router.put('/', checkRole([MINISTRY]), validator(schema.addVaccine), controller.addVaccine);
router.use(checkRole([MINISTRY, HCP_MANAGER]));
router.get('/', validator(schema.vaccineFilters), controller.getVaccines);

router.get('/types', controller.getVaccineTypes);

router.get('/search', controller.searchVaccines);

router.get('/:vaccineId', validator(schema.idInPath), controller.getVaccine);
router.get('/:vaccineId/statistics', checkRole(MINISTRY), validator(schema.idInPath), controller.getVaccineStatistics);

module.exports = router;
