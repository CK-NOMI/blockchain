import bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

// 临时用户存储（链上存角色权限，链下存储密码哈希）
const dbUsers = new Map();
// 初始化预设用户
const initUsers = () => {
  const defaults = [
    { username: 'admin', password: 'admin123', role: 'ADMIN', org: 'Platform', addr: '0x_admin' },
    { username: 'farmer1', password: '123456', role: 'FARMER', org: 'FarmOrg', addr: '0x_farmer' },
    { username: 'processor1', password: '123456', role: 'PROCESSOR', org: 'ProcessCorp', addr: '0x_processor' },
    { username: 'logistics1', password: '123456', role: 'LOGISTICS', org: 'LogiCorp', addr: '0x_logistics' },
    { username: 'retail1', password: '123456', role: 'RETAIL', org: 'RetailStore', addr: '0x_retail' },
    { username: 'regulator1', password: '123456', role: 'REGULATOR', org: 'RegAgency', addr: '0x_regulator' },
  ];
  for (const u of defaults) {
    if (!dbUsers.has(u.username)) {
      dbUsers.set(u.username, { ...u, password: bcrypt.hashSync(u.password, 10), isActive: true });
    }
  }
};
initUsers();

export async function login(req, res) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, data: null, msg: '用户名和密码不能为空' });
    }

    const user = dbUsers.get(username);
    if (!user) {
      return res.status(401).json({ code: 401, data: null, msg: '用户名或密码错误' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ code: 401, data: null, msg: '用户名或密码错误' });
    }

    if (!user.isActive) {
      return res.status(403).json({ code: 403, data: null, msg: '账号未审核，请联系管理员' });
    }

    // 只有 ADMIN 允许指定角色登录，普通用户只能使用自身角色
    const effectiveRole = (user.role === 'ADMIN' && role) ? role : user.role;

    const token = signToken({
      address: user.addr,
      username: user.username,
      role: effectiveRole,
      organization: user.org,
    });

    logger.info({ username: user.username, role: effectiveRole }, '用户登录');

    res.json({
      code: 0,
      data: {
        token,
        user: { id: user.addr, username: user.username, role: effectiveRole, roleLabel: effectiveRole, organization: user.org },
      },
      msg: 'ok',
    });
  } catch (err) {
    logger.error(err, '登录失败');
    res.status(500).json({ code: 500, data: null, msg: err.message || '登录失败' });
  }
}

export async function register(req, res) {
  try {
    const { username, password, organization, role } = req.body;
    if (!username || !password || !organization) {
      return res.status(400).json({ code: 400, data: null, msg: '用户名、密码和单位名称不能为空' });
    }

    if (dbUsers.has(username)) {
      return res.status(400).json({ code: 400, data: null, msg: '用户名已存在' });
    }

    const hashed = await bcrypt.hash(password, 10);
    dbUsers.set(username, {
      username,
      password: hashed,
      role: role || 'FARMER',
      org: organization,
      addr: `0x_${username}_${Date.now()}`,
      isActive: false,
    });

    logger.info({ username, role }, '新用户注册');

    res.json({
      code: 0,
      data: { requestId: `REQ_${Date.now()}`, status: 'PENDING' },
      msg: '注册成功，等待管理员审核',
    });
  } catch (err) {
    logger.error(err, '注册失败');
    res.status(500).json({ code: 500, data: null, msg: err.message || '注册失败' });
  }
}

export async function getProfile(req, res) {
  try {
    const user = dbUsers.get(req.user.username);
    if (!user) {
      return res.status(404).json({ code: 404, data: null, msg: '用户不存在' });
    }
    res.json({
      code: 0,
      data: { username: user.username, role: user.role, organization: user.org, isActive: user.isActive },
      msg: 'ok',
    });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '获取用户信息失败' });
  }
}
