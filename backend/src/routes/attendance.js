const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { punchIn, punchOut, getLogs } = require('../controllers/attendanceController');

router.use(authenticate);

router.post('/punch-in',
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('device_info').isObject(),
  validate,
  punchIn
);

router.post('/punch-out',
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  validate,
  punchOut
);

router.get('/', getLogs);

module.exports = router;
