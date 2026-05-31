import { verifyToken } from '../utils/jwt.js';
import { findByIdentity, toPublicUser } from '../services/userStore.js';

export default async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ code: 401, data: null, msg: '未登录，请先登录' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await findByIdentity(decoded);

    if (!user) {
      return res.status(401).json({ code: 401, data: null, msg: '账号不存在，请重新登录' });
    }
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ code: 401, data: null, msg: '账号状态已变更，请重新登录' });
    }
    if (!user.isActive) {
      return res.status(403).json({ code: 403, data: null, msg: '账号未审核或已停用' });
    }

    req.user = { ...decoded, ...toPublicUser(user) };
    return next();
  } catch {
    return res.status(401).json({ code: 401, data: null, msg: '登录已过期，请重新登录' });
  }
}
