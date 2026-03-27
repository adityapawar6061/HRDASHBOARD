const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getAll, createEmployee } = require('../controllers/userController');

router.use(authenticate, requireAdmin);

router.get('/', getAll);
router.post('/',
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  validate,
  createEmployee
);

module.exports = router;
