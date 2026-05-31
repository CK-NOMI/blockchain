import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';

export const ROLES = ['ADMIN', 'FARMER', 'PROCESSOR', 'LOGISTICS', 'RETAIL', 'REGULATOR'];

export const ROLE_LABELS = {
  ADMIN: '平台管理员',
  FARMER: '农户',
  PROCESSOR: '加工中心',
  LOGISTICS: '冷链物流',
  RETAIL: '超市零售',
  REGULATOR: '监管员',
};

function createAddress(seed) {
  const hash = crypto.createHash('sha256').update(`${seed}:${Date.now()}`).digest('hex');
  return `0x${hash.slice(0, 40)}`;
}

export function normalizeRole(role) {
  const value = String(role || '').trim().toUpperCase();
  return ROLES.includes(value) ? value : '';
}

export function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.address,
    address: user.address,
    username: user.username,
    role: user.role,
    roleLabel: ROLE_LABELS[user.role] || user.role,
    organization: user.organization,
    status: user.status,
    isActive: user.isActive,
    chainInited: user.chainInited,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    approvedAt: user.createdAt || '',
    approvedBy: 'system',
    rejectedAt: '',
    rejectedBy: '',
    rejectReason: '',
    suspendedAt: '',
    suspendedBy: '',
    lastLoginAt: user.lastLoginAt || '',
  };
}

export async function initUsers() {
  const count = await User.count();
  if (count > 0) return;

  const seeds = [
    { username: 'admin', password: 'admin123', role: 'ADMIN', organization: 'Platform' },
    { username: 'farmer1', password: '123456', role: 'FARMER', organization: 'FarmOrg' },
    { username: 'processor1', password: '123456', role: 'PROCESSOR', organization: 'ProcessCorp' },
    { username: 'logistics1', password: '123456', role: 'LOGISTICS', organization: 'LogiCorp' },
    { username: 'retail1', password: '123456', role: 'RETAIL', organization: 'RetailStore' },
    { username: 'regulator1', password: '123456', role: 'REGULATOR', organization: 'RegAgency' },
  ];

  for (const seed of seeds) {
    const passwordHash = await bcrypt.hash(seed.password, 10);
    await User.create({
      username: seed.username,
      passwordHash,
      role: seed.role,
      organization: seed.organization,
      address: createAddress(seed.username),
      status: 'ACTIVE',
      isActive: true,
      chainInited: false,
    });
  }
  logger.info(`种子用户已初始化: ${seeds.length} 个`);
}

export async function findByUsername(username) {
  const user = await User.findOne({ where: { username: String(username || '').trim() } });
  return user ? user.get({ plain: true }) : null;
}

export async function findByAddress(address) {
  if (!address) return null;
  const user = await User.findOne({ where: { address: String(address).trim().toLowerCase() } });
  return user ? user.get({ plain: true }) : null;
}

export async function findByIdentity(identity = {}) {
  const addr = identity.address || identity.id || identity.sub;
  if (addr) return findByAddress(addr);
  if (identity.username) return findByUsername(identity.username);
  return null;
}

export async function verifyPassword(user, password) {
  if (!user) return false;
  return bcrypt.compare(String(password || ''), user.passwordHash);
}

export async function registerUser({ username, password, organization, role }) {
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '');
  const cleanOrg = String(organization || '').trim();
  const rawRole = String(role || '').trim();
  const cleanRole = rawRole ? normalizeRole(rawRole) : 'FARMER';

  if (!cleanUsername || !cleanPassword || !cleanOrg) {
    const error = new Error('用户名、密码和单位名称不能为空');
    error.status = 400;
    throw error;
  }
  if (cleanPassword.length < 6) {
    const error = new Error('密码长度至少 6 位');
    error.status = 400;
    throw error;
  }
  if (!cleanRole || cleanRole === 'ADMIN') {
    const error = new Error('注册角色不合法');
    error.status = 400;
    throw error;
  }

  const exists = await User.findOne({ where: { username: cleanUsername } });
  if (exists) {
    const error = new Error('用户名已存在');
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(cleanPassword, 10);
  const user = await User.create({
    username: cleanUsername,
    passwordHash,
    role: cleanRole,
    organization: cleanOrg,
    address: createAddress(cleanUsername),
    status: 'PENDING',
    isActive: false,
  });
  return toPublicUser(user.get({ plain: true }));
}

export async function listUsers({ role, status, q } = {}) {
  const where = {};
  const cleanRole = normalizeRole(role);
  if (cleanRole) where.role = cleanRole;
  const cleanStatus = String(status || '').trim().toUpperCase();
  if (cleanStatus) where.status = cleanStatus;
  const query = String(q || '').trim().toLowerCase();
  if (query) {
    where[Op.or] = [
      { username: { [Op.like]: `%${query}%` } },
      { organization: { [Op.like]: `%${query}%` } },
    ];
  }

  const users = await User.findAll({ where, order: [['createdAt', 'DESC']] });
  return users.map((u) => toPublicUser(u.get({ plain: true })));
}

export async function findByUsernameSync(username) {
  // 同步版本供 middleware 使用，调用异步版缓存结果
  // 实际已改为全异步，此函数为兼容保留
  return findByUsername(username);
}

export async function setBlockchainAddress(username, realAddress) {
  const user = await User.findOne({ where: { username } });
  if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 });
  user.address = realAddress;
  user.chainInited = true;
  await user.save();
  return toPublicUser(user.get({ plain: true }));
}

export async function setBlockchainAddressWithKey(username, realAddress, privateKey) {
  const user = await User.findOne({ where: { username } });
  if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 });
  user.address = realAddress;
  user.privateKey = privateKey;
  user.chainInited = true;
  await user.save();
  return toPublicUser(user.get({ plain: true }));
}

export async function getPrivateKey(username) {
  const user = await User.findOne({ where: { username } });
  return user?.privateKey || '';
}

export async function approveUser(address, operator) {
  const user = await User.findOne({ where: { address } });
  if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 });
  user.status = 'ACTIVE';
  user.isActive = true;
  await user.save();
  return toPublicUser(user.get({ plain: true }));
}

export async function rejectUser(address, reason, operator) {
  const user = await User.findOne({ where: { address } });
  if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 });
  user.status = 'REJECTED';
  user.isActive = false;
  await user.save();
  return toPublicUser(user.get({ plain: true }));
}

export async function suspendUser(address, operator) {
  const user = await User.findOne({ where: { address } });
  if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 });
  user.status = 'SUSPENDED';
  user.isActive = false;
  await user.save();
  return toPublicUser(user.get({ plain: true }));
}

export async function changeUserRole(address, role, operator) {
  const cleanRole = normalizeRole(role);
  if (!cleanRole || cleanRole === 'ADMIN') {
    const error = new Error('目标角色不合法');
    error.status = 400;
    throw error;
  }
  const user = await User.findOne({ where: { address } });
  if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 });
  user.role = cleanRole;
  await user.save();
  return toPublicUser(user.get({ plain: true }));
}

export async function recordLogin(username) {
  const user = await User.findOne({ where: { username } });
  if (!user) return null;
  user.lastLoginAt = new Date();
  await user.save();
  return toPublicUser(user.get({ plain: true }));
}

export async function getSummary() {
  const [total, pending, active, suspended, rejected] = await Promise.all([
    User.count(),
    User.count({ where: { status: 'PENDING' } }),
    User.count({ where: { status: 'ACTIVE' } }),
    User.count({ where: { status: 'SUSPENDED' } }),
    User.count({ where: { status: 'REJECTED' } }),
  ]);
  return { total, pending, active, suspended, rejected };
}
