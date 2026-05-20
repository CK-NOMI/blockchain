import logger from '../utils/logger.js';

export default function errorHandler(err, req, res, _next) {
  logger.error(err, `${req.method} ${req.path}`);
  const status = err.status || 500;
  const message = err.message || '服务器内部错误';
  res.status(status).json({ code: status, data: null, msg: message });
}
