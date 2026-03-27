const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');
const c = require('../controllers/campaignController');

router.use(authenticate);

router.get('/', c.getAll);
router.post('/', requireAdmin, body('name').notEmpty(), validate, c.create);
router.put('/:id', requireAdmin, body('name').notEmpty(), validate, c.update);
router.delete('/:id', requireAdmin, c.remove);
router.post('/:id/assign', requireAdmin, body('userId').notEmpty(), validate, c.assignEmployee);
router.delete('/:id/assign/:userId', requireAdmin, c.removeEmployee);

module.exports = router;
