const { Router } = require('express');
const { wrapList } = require('../utils/wrapper');
const controller = wrapList(require('./users.Controller.js'));
const { checkToken, checkRole, fillUser } = require('../middleware/userChecker');
const {
    STUDENT,
    MINISTRY,
    HCP_MANAGER,
    HEALTHCARE_PROVIDER,
} = require('../config').ROLES;
const validator = require('../middleware/validator');
const schema = require('./users.Schema');

const router = new Router();

router.put('/', validator(schema.registration), fillUser, controller.registration);
router.post('/login', validator(schema.login), controller.login);
router.post('/logout', checkToken, controller.logout);

router.use(checkToken);

router.get('/', controller.getUser);
router.post('/', validator(schema.changeLogin), controller.changeLogin);

router.get('/hcpManagers', checkRole(MINISTRY), validator(schema.getHCPManagers), controller.getHCPManagers);
router.get('/duo/:duoId', checkRole(HCP_MANAGER), validator(schema.getUserByDUO), controller.getUserByDUO);
router.get('/big/:bigId', checkRole(HCP_MANAGER), validator(schema.getUserByBIG), controller.getUserFromBIG);

router.get('/:userId', validator(schema.getUser), controller.getUser);
router.get('/:userId/vaccinations', checkRole(STUDENT), validator(schema.getUserVaccinations), controller.getUserVaccinations);
router.post('/:userId/token', checkRole(HEALTHCARE_PROVIDER), validator(schema.getToken), controller.generateToken);

module.exports = router;
