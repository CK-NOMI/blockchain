import { Router } from 'express';
import authMiddleware from './authMiddleware.js';
import { signToken } from './jwt.js';
import { roleGuard } from './roleGuard.js';
import {
  approveUser,
  changeUserRole,
  findByIdentity,
  findByUsername,
  getSummary,
  listUsers,
  normalizeRole,
  recordLogin,
  registerUser,
  rejectUser,
  suspendUser,
  toPublicUser,
  verifyPassword,
} from './userStore.js';

const router = Router();

function sendError(res, error, fallback = '请求失败') {
  const status = error.status || 500;
  return res.status(status).json({ code: status, data: null, msg: error.message || fallback });
}

router.post('/auth/register', async (req, res) => {
  try {
    const user = await registerUser(req.body);
    return res.json({
      code: 0,
      data: { requestId: `REQ_${Date.now()}`, status: user.status, user },
      msg: '注册成功，等待管理员审核',
    });
  } catch (error) {
    return sendError(res, error, '注册失败');
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password, role } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ code: 400, data: null, msg: '用户名和密码不能为空' });
    }

    const user = findByUsername(username);
    if (!user || !(await verifyPassword(user, password))) {
      return res.status(401).json({ code: 401, data: null, msg: '用户名或密码错误' });
    }
    if (!user.isActive) {
      const msgMap = {
        PENDING: '账号正在审核中，请等待管理员通过',
        REJECTED: '账号审核未通过，请联系管理员',
        SUSPENDED: '账号已停用，请联系管理员',
      };
      return res.status(403).json({ code: 403, data: null, msg: msgMap[user.status] || '账号不可用' });
    }

    const rawRole = String(role || '').trim();
    const requestedRole = rawRole ? normalizeRole(rawRole) : '';
    if (rawRole && !requestedRole) {
      return res.status(400).json({ code: 400, data: null, msg: '登录角色不合法' });
    }
    if (requestedRole && requestedRole !== user.role) {
      return res.status(403).json({ code: 403, data: null, msg: '登录角色与账号角色不匹配' });
    }

    const token = signToken({
      sub: user.address,
      address: user.address,
      username: user.username,
      role: user.role,
      organization: user.organization,
      tokenVersion: user.tokenVersion,
    });
    const publicUser = recordLogin(user.username);
    return res.json({ code: 0, data: { token, user: publicUser }, msg: 'ok' });
  } catch (error) {
    return sendError(res, error, '登录失败');
  }
});

router.get('/auth/profile', authMiddleware, (req, res) => {
  const user = findByIdentity(req.user);
  return res.json({ code: 0, data: toPublicUser(user), msg: 'ok' });
});

router.get('/admin/users', authMiddleware, roleGuard('ADMIN'), (req, res) => {
  return res.json({ code: 0, data: listUsers(req.query), summary: getSummary(), msg: 'ok' });
});

router.put('/admin/users/:address/approve', authMiddleware, roleGuard('ADMIN'), (req, res) => {
  try {
    const user = approveUser(req.params.address, req.user.username);
    return res.json({ code: 0, data: user, msg: '用户审核通过' });
  } catch (error) {
    return sendError(res, error, '审批失败');
  }
});

router.put('/admin/users/:address/reject', authMiddleware, roleGuard('ADMIN'), (req, res) => {
  try {
    const user = rejectUser(req.params.address, req.body?.reason, req.user.username);
    return res.json({ code: 0, data: user, msg: '用户已驳回' });
  } catch (error) {
    return sendError(res, error, '驳回失败');
  }
});

router.put('/admin/users/:address/suspend', authMiddleware, roleGuard('ADMIN'), (req, res) => {
  try {
    if (String(req.params.address).toLowerCase() === String(req.user.address).toLowerCase()) {
      return res.status(400).json({ code: 400, data: null, msg: '不能停用当前登录管理员账号' });
    }
    const user = suspendUser(req.params.address, req.user.username);
    return res.json({ code: 0, data: user, msg: '用户已停用' });
  } catch (error) {
    return sendError(res, error, '停用失败');
  }
});

router.put('/admin/users/:address/role', authMiddleware, roleGuard('ADMIN'), (req, res) => {
  try {
    if (String(req.params.address).toLowerCase() === String(req.user.address).toLowerCase()) {
      return res.status(400).json({ code: 400, data: null, msg: '不能修改当前登录管理员角色' });
    }
    const user = changeUserRole(req.params.address, req.body?.role, req.user.username);
    return res.json({ code: 0, data: user, msg: '用户角色已更新' });
  } catch (error) {
    return sendError(res, error, '角色更新失败');
  }
});

router.get('/demo/farmer-only', authMiddleware, roleGuard('FARMER'), (req, res) => {
  return res.json({ code: 0, data: { user: req.user.username }, msg: '农户接口访问成功' });
});

export default router;
