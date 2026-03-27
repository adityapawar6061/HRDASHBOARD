const attendanceService = require('../services/attendanceService');

const punchIn = async (req, res, next) => {
  try {
    const data = await attendanceService.punchIn(req.user.id, req.body);
    res.status(201).json(data);
  } catch (err) { next(err); }
};

const punchOut = async (req, res, next) => {
  try {
    const data = await attendanceService.punchOut(req.user.id, req.body);
    res.json(data);
  } catch (err) { next(err); }
};

const getLogs = async (req, res, next) => {
  try {
    const { userId, date, page, limit } = req.query;
    // Employees can only see their own logs
    const targetUserId = req.user.role === 'admin' ? userId : req.user.id;
    const data = await attendanceService.getLogs({ userId: targetUserId, date, page, limit });
    res.json(data);
  } catch (err) { next(err); }
};

module.exports = { punchIn, punchOut, getLogs };
