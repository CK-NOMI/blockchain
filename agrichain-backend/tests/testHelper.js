/**
 * 测试辅助工具：现场注册具有真实区块链身份的用户。
 *
 * 种子用户的缺陷：测试全用预设好角色的固定账号，无法验证角色权限系统对
 * 任意用户是否生效。本模块现场创建用户，确保测试样本不依赖种子数据。
 *
 * registerUser 生成的地址是假的（SHA-256），没有私钥，WeBASE-Front 不认。
 * 本模块：生成真实密钥对 → 导入 WeBASE → 注册 DB → 管理员审批 → 链上授权真实地址
 */

import { ethers } from 'ethers';
import fiscoClient from '../src/services/fiscoClient.js';
import * as userStore from '../src/services/userStore.js';

const BASE = process.env.API_BASE || 'http://127.0.0.1:3001';

const ROLE_NUM = { FARMER: 1, PROCESSOR: 2, LOGISTICS: 3, RETAIL: 4, REGULATOR: 5 };

let _counter = 0;

export async function login(username, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json();
  if (!res.ok || body.code !== 0) throw new Error(`登录失败: ${body.msg || res.status}`);
  return body.data;
}

/**
 * 现场注册一个具有指定角色的真实用户。
 * 返回 { token, user }，可直接用于后续带角色守卫的 API 调用。
 */
export async function createUser(role) {
  _counter++;
  const ts = Date.now();
  const username = `t${role.charAt(0)}${ts}_${_counter}`.toLowerCase();
  const password = 'test123456';
  const roleNum = ROLE_NUM[role];
  if (!roleNum) throw new Error(`不支持的测试角色: ${role}`);

  // 1. 生成真实区块链密钥对，导入 WeBASE-Front
  const wallet = ethers.Wallet.createRandom();
  await fiscoClient.importKey(wallet.privateKey, `test_${username}`);

  // 2. 注册（创建 DB 记录，状态 PENDING，得到一个临时假地址）
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, organization: 'TestOrg', role }),
  });
  const regBody = await regRes.json();
  if (regBody.code !== 0) throw new Error(`注册失败: ${regBody.msg}`);

  // 3. 管理员审批（链上授权假地址 + DB 状态改为 ACTIVE）
  const admin = await login('admin', 'admin123');
  const fakeAddr = regBody.data.user.address;
  const approveRes = await fetch(`${BASE}/api/admin/users/${fakeAddr}/approve`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  if (approveRes.status !== 200) {
    const b = await approveRes.json();
    throw new Error(`审批失败: ${b.msg}`);
  }

  // 4. 用真实地址覆盖：链上授权 + DB 更新
  console.log('[testHelper] 授权角色 %s 到地址 %s', role, wallet.address);
  await fiscoClient.callContract('RoleManager', 'authorizeRole', [wallet.address, roleNum, username]);
  await userStore.setBlockchainAddressWithKey(username, wallet.address, wallet.privateKey);

  // 等待链上角色确认（最多轮询 20 次 × 500ms = 10s）
  for (let i = 0; i < 20; i++) {
    try {
      const ok = await fiscoClient.callReadOnly('RoleManager', 'checkRole', [wallet.address, roleNum]);
      if (ok === true) {
        console.log('[testHelper] 链上角色确认: %s', role);
        break;
      }
    } catch { /* 继续轮询 */ }
    await new Promise(r => setTimeout(r, 500));
    if (i === 19) throw new Error(`链上角色授权确认超时: ${role}`);
  }

  // 5. 登录获取携带真实地址的 JWT
  const user = await login(username, password);
  return user;
}

/**
 * 创建新用户并直接创建一批测试用批次。
 * 返回 { batchId, farmerToken }。
 */
export async function createFarmerAndBatch() {
  const farmer = await createUser('FARMER');
  const res = await fetch(`${BASE}/api/batches/create`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmer.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productName: '测试水稻',
      origin: '黑龙江五常',
      category: '粮食',
      quantity: 500,
    }),
  });
  const body = await res.json();
  if (body.code !== 0) throw new Error(`创建批次失败: ${body.msg}`);
  return { batchId: body.data.batchId, farmerToken: farmer.token };
}
