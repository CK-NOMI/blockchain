import { normalizeRole } from './userStore.js';

export function roleGuard(...allowedRoles) {
  const allowed = allowedRoles.map(normalizeRole).filter(Boolean);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, data: null, msg: '未登录' });
    }
    if (req.user.role === 'ADMIN' || allowed.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ code: 403, data: null, msg: `需要角色: ${allowed.join('/')}` });
  };
}
