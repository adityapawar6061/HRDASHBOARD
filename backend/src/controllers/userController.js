const userService = require('../services/userService');

const getAll = async (req, res, next) => {
  try { res.json(await userService.getAll()); } catch (err) { next(err); }
};

const createEmployee = async (req, res, next) => {
  try { res.status(201).json(await userService.createEmployee(req.body)); } catch (err) { next(err); }
};

module.exports = { getAll, createEmployee };
