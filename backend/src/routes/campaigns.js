const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');
const c = require('../controllers/campaignController');

router.use(authenticate);

const campaignBody = [
  body('name').notEmpty().withMessage('Campaign name is required'),
  body('min_hours').optional().isFloat({ min: 0 }),
  body('salary_per_min_hours').optional().isFloat({ min: 0 }),
  body('location_lat').optional().isFloat({ min: -90, max: 90 }),
  body('location_lng').optional().isFloat({ min: -180, max: 180 }),
  body('location_radius_meters').optional().isInt({ min: 50 }),
];

router.get('/', c.getAll);
router.post('/', requireAdmin, campaignBody, validate, c.create);
router.put('/:id', requireAdmin, campaignBody, validate, c.update);
router.delete('/:id', requireAdmin, c.remove);
router.post('/:id/assign', requireAdmin, body('userId').notEmpty(), validate, c.assignEmployee);
router.delete('/:id/assign/:userId', requireAdmin, c.removeEmployee);

module.exports = router;
