const express = require('express')


const ctrl = require('../../controllers/contacts')

const {isValidId, authenticate} = require('../../middleware')

const router = express.Router()


router.get('/', authenticate, ctrl.getAll)

router.get('/:contactId', authenticate, isValidId, ctrl.getById)

router.post('/', authenticate, ctrl.add)

router.put('/:contactId', authenticate, isValidId, ctrl.update)

router.patch('/:contactId/favorite', authenticate, isValidId, ctrl.updateStatusContact)

router.delete('/:contactId', authenticate, ctrl.remove)

module.exports = router
