const authService = require('../services/authService');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.json(profile);
  } catch (err) { next(err); }
};

module.exports = { login, me };
