const express = require('express');

const router = express.Router()

const ctrl = require('../../controllers/users');
const { authenticate } = require('../../middleware');



router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/current', authenticate, ctrl.current);
router.get('/logout', authenticate, ctrl.logout);
router.patch('/', authenticate, ctrl.updateSubscribe);



module.exports = router;

