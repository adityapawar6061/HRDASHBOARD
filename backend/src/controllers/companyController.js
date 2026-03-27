const companyService = require('../services/companyService');

const getAll = async (req, res, next) => {
  try { res.json(await companyService.getAll()); } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try { res.status(201).json(await companyService.create(req.body)); } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try { res.json(await companyService.update(req.params.id, req.body)); } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try { await companyService.remove(req.params.id); res.status(204).send(); } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove };
