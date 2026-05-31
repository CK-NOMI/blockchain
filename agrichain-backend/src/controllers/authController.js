import { ethers } from 'ethers';
import { signToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';
import fiscoConfig from '../config/fisco.js';
import fiscoClient from '../services/fiscoClient.js';
import { ROLE_ENUM } from '../services/roleService.js';
import {
  registerUser,
  findByUsername,
  verifyPassword,
  recordLogin,
  findByIdentity,
  toPublicUser,
  normalizeRole,
  getPrivateKey,
  setBlockchainAddressWithKey,
} from '../services/userStore.js';

export async function login(req, res) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, data: null, msg: '用户名和密码不能为空' });
    }

    const user = await findByUsername(username);
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

    // 只有 ADMIN 允许指定角色登录，普通用户只能使用自身角色
    const effectiveRole = (user.role === 'ADMIN' && role) ? role : user.role;

    // 链上引导：导入当前用户密钥到 WeBASE + 首次登录时授权链上角色（不阻塞登录）
    try {
      const realAddress = await setupUserChain(user);
      if (realAddress) user.address = realAddress;
    } catch (e) {
      logger.warn({ username: user.username, error: e.message }, '用户链上引导失败');
    }

    const token = signToken({
      sub: user.address,
      address: user.address,
      username: user.username,
      role: user.role,
      organization: user.organization,
      tokenVersion: user.tokenVersion,
    });
    const publicUser = await recordLogin(user.username);

    logger.info({ username: user.username, role: user.role }, '用户登录');

    res.json({ code: 0, data: { token, user: publicUser }, msg: 'ok' });
  } catch (err) {
    logger.error(err, '登录失败');
    res.status(500).json({ code: 500, data: null, msg: err.message || '登录失败' });
  }
}

export async function register(req, res) {
  try {
    const user = await registerUser(req.body);
    logger.info({ username: user.username, role: user.role }, '新用户注册');
    res.json({
      code: 0,
      data: { requestId: `REQ_${Date.now()}`, status: user.status, user },
      msg: '注册成功，等待管理员审核',
    });
  } catch (err) {
    const status = err.status || 500;
    logger.error(err, '注册失败');
    res.status(status).json({ code: status, data: null, msg: err.message || '注册失败' });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await findByIdentity(req.user);
    if (!user) {
      return res.status(404).json({ code: 404, data: null, msg: '用户不存在' });
    }
    res.json({ code: 0, data: toPublicUser(user), msg: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '获取用户信息失败' });
  }
}

/** 登录时按需引导：导入当前用户密钥到 WeBASE，首次登录时生成密钥 + 授权角色 */
async function setupUserChain(user) {
  const WEBASE = fiscoConfig.webaseFront.url;

  // 获取已有密钥或生成新密钥
  let wallet;
  const storedKey = await getPrivateKey(user.username);
  if (storedKey) {
    wallet = new ethers.Wallet(storedKey);
  } else {
    wallet = ethers.Wallet.createRandom();
  }

  // 导入 WeBASE（幂等，密钥已存在时 WeBASE 返回 code 201038）
  const webaseUser = `${user.username}_${wallet.address.slice(2, 8)}`;
  const impRes = await fetch(`${WEBASE}/privateKey/import?privateKey=${wallet.privateKey}&userName=${webaseUser}`, { method: 'GET' });
  const keyJson = impRes.ok ? null : await impRes.json().catch(() => null);
  if (!impRes.ok && keyJson?.code !== 201038) {
    throw new Error(`导入 WeBASE 失败: ${JSON.stringify(keyJson)}`);
  }

  // 首次登录：授权链上角色 + 持久化地址和私钥
  if (!user.chainInited) {
    const roleNum = ROLE_ENUM[user.role];
    if (roleNum) {
      await fiscoClient.callContract('RoleManager', 'authorizeRole', [wallet.address, roleNum, user.username]);
    }
    await setBlockchainAddressWithKey(user.username, wallet.address, wallet.privateKey);
    logger.info({ username: user.username, address: wallet.address, role: user.role }, '用户链上初始化完成');
  }

  return wallet.address;
}
