export function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        data: null,
        msg: '\u672a\u767b\u5f55',
      });
    }

    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      code: 403,
      data: null,
      msg: `\u9700\u8981\u89d2\u8272: ${allowedRoles.join('/')}`,
    });
  };
}

export const farmerGuard = roleGuard('FARMER');
export const logisticsGuard = roleGuard('LOGISTICS');
export const retailGuard = roleGuard('RETAIL');
