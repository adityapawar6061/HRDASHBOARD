const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getAll, create, update, remove } = require('../controllers/companyController');

router.use(authenticate);

router.get('/', getAll);
router.post('/', requireAdmin, body('name').notEmpty(), validate, create);
router.put('/:id', requireAdmin, body('name').notEmpty(), validate, update);
router.delete('/:id', requireAdmin, remove);

module.exports = router;
