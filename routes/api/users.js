const express = require('express');

const router = express.Router()

const ctrl = require('../../controllers/users');
const { authenticate, upload } = require('../../middleware');



router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/current', authenticate, ctrl.current);
router.get('/logout', authenticate, ctrl.logout);
router.patch('/', authenticate, ctrl.updateSubscribe);
router.patch('/avatars', authenticate, upload.single('avatar'), ctrl.updateAvatar);



module.exports = router;

