const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getSalaries, generatePayslip } = require('../controllers/salaryController');

router.use(authenticate);

router.get('/', getSalaries);
router.post('/generate',
  requireAdmin,
  body('userId').notEmpty(),
  body('month').matches(/^\d{4}-\d{2}$/),
  body('per_day_pay').isFloat({ min: 0 }),
  validate,
  generatePayslip
);

module.exports = router;
