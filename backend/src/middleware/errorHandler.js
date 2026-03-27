const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  // Services throw plain objects { status, message }, Error instances have .message
  const status = err.status || err.statusCode || 500;
  const message = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
  logger.error(message, { path: req.path });
  res.status(status).json({ error: message });
};

const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.path} not found` });
};

module.exports = { errorHandler, notFound };
