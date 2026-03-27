const campaignService = require('../services/campaignService');

const getAll = async (req, res, next) => {
  try { res.json(await campaignService.getAll()); } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try { res.status(201).json(await campaignService.create(req.body)); } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try { res.json(await campaignService.update(req.params.id, req.body)); } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try { await campaignService.remove(req.params.id); res.status(204).send(); } catch (err) { next(err); }
};

const assignEmployee = async (req, res, next) => {
  try {
    res.status(201).json(await campaignService.assignEmployee(req.params.id, req.body.userId));
  } catch (err) { next(err); }
};

const removeEmployee = async (req, res, next) => {
  try {
    await campaignService.removeEmployee(req.params.id, req.params.userId);
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove, assignEmployee, removeEmployee };
