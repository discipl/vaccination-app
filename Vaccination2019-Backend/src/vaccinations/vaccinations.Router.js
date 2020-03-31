const { Router } = require('express');
const { wrapList } = require('../utils/wrapper');
const controller = wrapList(require('./vaccinations.Controller.js'));
const validator = require('../middleware/validator');
const { checkRole, checkToken } = require('../middleware/userChecker');
const schema = require('./vaccinations.Schema');
const {
    MINISTRY, HCP_MANAGER, STUDENT, HEALTHCARE_PROVIDER,
} = require('../config').ROLES;

const router = new Router();

router.use(checkToken);
router.put('/', checkRole(HCP_MANAGER), validator(schema.addVaccination), controller.addVaccination);
router.put('/:vaccinationId/', checkRole(HCP_MANAGER), validator(schema.vaccinationId), validator(schema.addBloodTest), controller.addBloodtest);
router.get('/:vaccinationId/statistics', checkRole(MINISTRY), validator(schema.vaccinationId), controller.getVaccinationStatistics);


router.use(checkRole([MINISTRY, HCP_MANAGER, STUDENT, HEALTHCARE_PROVIDER]));
router.get('/', validator(schema.eventFilters), controller.getVaccinations);
router.get('/events', validator(schema.eventFilters), controller.getEvents);
router.get('/events/:eventId', validator(schema.eventId), controller.getEventDetails);
router.get('/events/:eventId/students', validator(schema.eventId), controller.getEventStudentsList);
router.get('/events/:eventId/hcproviders', validator(schema.eventId), controller.getEventHCProvidersList);
router.get('/:vaccinationId', controller.getVaccination);


module.exports = router;
