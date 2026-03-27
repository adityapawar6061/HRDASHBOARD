const salaryService = require('../services/salaryService');

const getSalaries = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? req.query.userId : req.user.id;
    res.json(await salaryService.getSalaries(userId));
  } catch (err) { next(err); }
};

const generatePayslip = async (req, res, next) => {
  try {
    res.status(201).json(await salaryService.generatePayslip(req.body));
  } catch (err) { next(err); }
};

module.exports = { getSalaries, generatePayslip };
