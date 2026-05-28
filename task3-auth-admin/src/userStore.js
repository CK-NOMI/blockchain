import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

export const ROLES = ['ADMIN', 'FARMER', 'PROCESSOR', 'LOGISTICS', 'RETAIL', 'REGULATOR'];

export const ROLE_LABELS = {
  ADMIN: '平台管理员',
  FARMER: '农户',
  PROCESSOR: '加工中心',
  LOGISTICS: '冷链物流',
  RETAIL: '超市零售',
  REGULATOR: '监管员',
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, '../data/users.json');
const users = new Map();
const addressIndex = new Map();

const nowIso = () => new Date().toISOString();

export function normalizeRole(role) {
  const value = String(role || '').trim().toUpperCase();
  return ROLES.includes(value) ? value : '';
}

function createAddress(seed) {
  const hash = crypto.createHash('sha256').update(`${seed}:${Date.now()}`).digest('hex');
  return `0x${hash.slice(0, 40)}`;
}

function save() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(Array.from(users.values()), null, 2));
}

function indexUser(user) {
  users.set(user.username, user);
  addressIndex.set(user.address.toLowerCase(), user.username);
}

function load() {
  if (!fs.existsSync(DATA_FILE)) return false;
  const rows = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
  rows.forEach(indexUser);
  return rows.length > 0;
}

function createSeedUser({ username, password, role, organization }) {
  indexUser({
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    organization,
    address: createAddress(username),
    status: 'ACTIVE',
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    approvedAt: nowIso(),
    approvedBy: 'system',
    rejectedAt: '',
    rejectedBy: '',
    rejectReason: '',
    suspendedAt: '',
    suspendedBy: '',
    tokenVersion: 1,
    lastLoginAt: '',
  });
}

export function initUsers() {
  if (load()) return;
  [
    { username: 'admin', password: 'admin123', role: 'ADMIN', organization: 'Platform' },
    { username: 'farmer1', password: '123456', role: 'FARMER', organization: 'FarmOrg' },
    { username: 'processor1', password: '123456', role: 'PROCESSOR', organization: 'ProcessCorp' },
    { username: 'logistics1', password: '123456', role: 'LOGISTICS', organization: 'LogiCorp' },
    { username: 'retail1', password: '123456', role: 'RETAIL', organization: 'RetailStore' },
    { username: 'regulator1', password: '123456', role: 'REGULATOR', organization: 'RegAgency' },
  ].forEach(createSeedUser);
  save();
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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    approvedAt: user.approvedAt,
    approvedBy: user.approvedBy,
    rejectedAt: user.rejectedAt,
    rejectedBy: user.rejectedBy,
    rejectReason: user.rejectReason,
    suspendedAt: user.suspendedAt,
    suspendedBy: user.suspendedBy,
    lastLoginAt: user.lastLoginAt,
  };
}

export function findByUsername(username) {
  return users.get(String(username || '').trim()) || null;
}

export function findByAddress(address) {
  const username = addressIndex.get(String(address || '').trim().toLowerCase());
  return username ? findByUsername(username) : null;
}

export function findByIdentity(identity = {}) {
  return findByAddress(identity.address || identity.id || identity.sub) || findByUsername(identity.username);
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
  if (users.has(cleanUsername)) {
    const error = new Error('用户名已存在');
    error.status = 400;
    throw error;
  }

  const user = {
    username: cleanUsername,
    passwordHash: await bcrypt.hash(cleanPassword, 10),
    role: cleanRole,
    organization: cleanOrg,
    address: createAddress(cleanUsername),
    status: 'PENDING',
    isActive: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    approvedAt: '',
    approvedBy: '',
    rejectedAt: '',
    rejectedBy: '',
    rejectReason: '',
    suspendedAt: '',
    suspendedBy: '',
    tokenVersion: 1,
    lastLoginAt: '',
  };
  indexUser(user);
  save();
  return toPublicUser(user);
}

export function listUsers({ role, status, q } = {}) {
  const cleanRole = normalizeRole(role);
  const cleanStatus = String(status || '').trim().toUpperCase();
  const query = String(q || '').trim().toLowerCase();

  return Array.from(users.values())
    .filter((user) => !cleanRole || user.role === cleanRole)
    .filter((user) => !cleanStatus || user.status === cleanStatus)
    .filter((user) => {
      if (!query) return true;
      return [user.username, user.organization, user.address, ROLE_LABELS[user.role], user.status]
        .some((value) => String(value || '').toLowerCase().includes(query));
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map(toPublicUser);
}

function updateUser(address, updater) {
  const user = findByAddress(address);
  if (!user) {
    const error = new Error('用户不存在');
    error.status = 404;
    throw error;
  }
  updater(user);
  user.updatedAt = nowIso();
  user.tokenVersion += 1;
  save();
  return toPublicUser(user);
}

export function approveUser(address, operator) {
  return updateUser(address, (user) => {
    user.status = 'ACTIVE';
    user.isActive = true;
    user.approvedAt = nowIso();
    user.approvedBy = operator;
    user.rejectedAt = '';
    user.rejectedBy = '';
    user.rejectReason = '';
  });
}

export function rejectUser(address, reason, operator) {
  return updateUser(address, (user) => {
    user.status = 'REJECTED';
    user.isActive = false;
    user.rejectedAt = nowIso();
    user.rejectedBy = operator;
    user.rejectReason = String(reason || '管理员驳回');
  });
}

export function suspendUser(address, operator) {
  return updateUser(address, (user) => {
    user.status = 'SUSPENDED';
    user.isActive = false;
    user.suspendedAt = nowIso();
    user.suspendedBy = operator;
  });
}

export function changeUserRole(address, role, operator) {
  const cleanRole = normalizeRole(role);
  if (!cleanRole || cleanRole === 'ADMIN') {
    const error = new Error('目标角色不合法');
    error.status = 400;
    throw error;
  }
  return updateUser(address, (user) => {
    user.role = cleanRole;
    user.approvedBy = operator;
  });
}

export function recordLogin(username) {
  const user = findByUsername(username);
  if (!user) return null;
  user.lastLoginAt = nowIso();
  user.updatedAt = nowIso();
  save();
  return toPublicUser(user);
}

export function getSummary() {
  const rows = Array.from(users.values());
  return {
    total: rows.length,
    pending: rows.filter((user) => user.status === 'PENDING').length,
    active: rows.filter((user) => user.status === 'ACTIVE').length,
    suspended: rows.filter((user) => user.status === 'SUSPENDED').length,
    rejected: rows.filter((user) => user.status === 'REJECTED').length,
  };
}
