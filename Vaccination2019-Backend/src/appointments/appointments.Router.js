const { Router } = require('express');
const { wrapList } = require('../utils/wrapper');
const controller = wrapList(require('./appointments.Controller.js'));
const { checkToken, checkRole } = require('../middleware/userChecker');
const validator = require('../middleware/validator');
const schema = require('./appointments.Schema');
const { HEALTHCARE_PROVIDER, STUDENT, MINISTRY } = require('../config').ROLES;

const router = new Router();

router.use(checkToken);

router.put('/', checkRole(STUDENT), validator(schema.addAppointment), controller.addAppointment);

router.use(checkRole([STUDENT, HEALTHCARE_PROVIDER, MINISTRY]));
router.get('/', controller.getAppointments);
router.get('/:appointmentId', validator(schema.getAppointment), controller.getAppointment);
router.post('/:appointmentId', validator(schema.makeAction), controller.makeAction);

module.exports = router;
