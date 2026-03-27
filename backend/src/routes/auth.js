const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { login, me } = require('../controllers/authController');

router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  validate,
  login
);

router.get('/me', authenticate, me);

module.exports = router;
