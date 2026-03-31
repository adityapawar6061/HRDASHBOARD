const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { requestPayslip, getRequests, reviewRequest } = require('../controllers/payslipRequestController');

router.use(authenticate);

router.get('/', getRequests);
router.post('/', body('month').matches(/^\d{4}-\d{2}$/), validate, requestPayslip);
router.patch('/:id/review', requireAdmin, body('status').isIn(['approved', 'rejected']), validate, reviewRequest);

module.exports = router;
