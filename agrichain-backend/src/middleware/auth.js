import { verifyToken } from '../utils/jwt.js';

export default function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ code: 401, data: null, msg: '未登录，请先登录' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ code: 401, data: null, msg: '登录已过期，请重新登录' });
  }
}
