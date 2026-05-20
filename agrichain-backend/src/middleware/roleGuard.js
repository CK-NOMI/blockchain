export function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, data: null, msg: '未登录' });
    }
    // ADMIN 可以操作所有角色接口（合约层已支持 admin bypass）
    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ code: 403, data: null, msg: `需要角色: ${allowedRoles.join('/')}` });
  };
}

export const logisticsGuard = roleGuard('LOGISTICS');
export const retailGuard = roleGuard('RETAIL');
