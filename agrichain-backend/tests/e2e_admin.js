// 管理员模块端到端测试：用户审批/驳回/停用/角色变更
// 用法: node test/e2e_admin.js
// 依赖: 后端运行中 (http://127.0.0.1:3001)

const BASE = process.env.API_BASE || 'http://127.0.0.1:3001';

async function login(username, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json();
  if (!res.ok || body.code !== 0) throw new Error(`登录失败: ${body.msg || res.status}`);
  return body.data;
}

async function main() {
  let pass = 0, fail = 0, warn = 0;

  function check(cond, msg) {
    if (!cond) { throw new Error(msg); }
  }

  // WeBASE 直接返回回执对象，transactionHash 在第一层
  function getTransactionHash(data) {
    return data?.transactionHash || null;
  }

  // 1. admin 登录
  let ADMIN_TOKEN;
  try {
    const admin = await login('admin', 'admin123');
    check(admin.token, 'admin 应有 token');
    ADMIN_TOKEN = admin.token;
    console.log('PASS  admin 登录成功');
    pass++;
  } catch (e) {
    console.log('FAIL  admin 登录:', e.message);
    fail++;
    process.exit(1);
  }

  // 2. 用户列表
  let users;
  try {
    const res = await fetch(`${BASE}/api/admin/users`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `用户列表应返回 code 0: ${body.msg}`);
    check(Array.isArray(body.data), '用户列表应为数组');
    check(body.data.length >= 6, `至少有 6 个用户: ${body.data.length}`);
    users = body.data;
    console.log('PASS  用户列表: %d 个用户', users.length);
    pass++;
  } catch (e) {
    console.log('FAIL  用户列表:', e.message);
    fail++;
  }

  // 找一个非 admin 的种子用户用于测试（用 farmer1，密码已知为 123456）
  const SEED_USER = 'farmer1';
  const SEED_PASS = '123456';
  const target = users.find(u => u.username === SEED_USER && u.address);
  if (!target) {
    console.log('FAIL  无可用的测试用户');
    fail++;
    process.exit(1);
  }
  const testAddr = target.address;
  const testUser = target.username;

  // 3. 获取链信息
  try {
    const res = await fetch(`${BASE}/api/admin/chain-info`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `链信息应返回 code 0: ${body.msg}`);
    check(body.data?.blockNumber >= 0, `区块高度: ${body.data?.blockNumber}`);
    console.log('PASS  链信息: chainId=%s blockNumber=%s', body.data?.chainId, body.data?.blockNumber);
    pass++;
  } catch (e) {
    console.log('FAIL  链信息:', e.message);
    fail++;
  }

  // 4. 获取合约配置
  try {
    const res = await fetch(`${BASE}/api/admin/contract-config`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, '合约配置应返回 code 0');
    check(Array.isArray(body.data?.contracts), '应有 contracts 数组');
    check(body.data.contracts.length >= 1, '至少有 1 个合约');
    console.log('PASS  合约配置: %d 个合约', body.data.contracts.length);
    pass++;
  } catch (e) {
    console.log('FAIL  合约配置:', e.message);
    fail++;
  }

  // 5. 查询节点状态
  try {
    const res = await fetch(`${BASE}/api/admin/node-status`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `节点状态应返回 code 0: ${body.msg}`);
    check(body.data?.blockHeight >= 0, `区块高度: ${body.data?.blockHeight}`);
    console.log('PASS  节点状态: blockHeight=%s', body.data?.blockHeight);
    pass++;
  } catch (e) {
    console.log('FAIL  节点状态:', e.message);
    fail++;
  }

  // 6. 审批用户（用现有种子用户，已有地址）
  try {
    const res = await fetch(`${BASE}/api/admin/users/${testAddr}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `审批应成功: ${body.msg}`);
    const transactionHashApprove = getTransactionHash(body.data);
    check(transactionHashApprove, `审批应有 transactionHash`);
    console.log('PASS  审批用户: %s, transactionHash=%s', testUser, transactionHashApprove);
    pass++;
  } catch (e) {
    console.log('FAIL  审批用户:', e.message);
    fail++;
  }

  // 7. 变更用户角色
  try {
    const res = await fetch(`${BASE}/api/admin/users/${testAddr}/role`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'PROCESSOR' }),
    });
    const body = await res.json();
    check(body.code === 0, `角色变更应成功: ${body.msg}`);
    check(body.data?.role === 'PROCESSOR', `角色应为 PROCESSOR: ${body.data?.role}`);
    console.log('PASS  变更角色: PROCESSOR');
    // 改回原角色
    const revertRes = await fetch(`${BASE}/api/admin/users/${testAddr}/role`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: target.role }),
    });
    const revertBody = await revertRes.json();
    check(revertBody.code === 0, `角色恢复应成功: ${revertBody.msg}`);
    console.log('PASS  恢复角色: %s', target.role);
    pass++;
  } catch (e) {
    console.log('FAIL  变更角色:', e.message);
    fail++;
  }

  // 8. 停用用户
  try {
    const res = await fetch(`${BASE}/api/admin/users/${testAddr}/suspend`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `停用应成功: ${body.msg}`);
    const transactionHashSuspend = getTransactionHash(body.data);
    console.log('PASS  停用用户: %s, transactionHash=%s', testUser, transactionHashSuspend || '无');
    pass++;
  } catch (e) {
    console.log('FAIL  停用用户:', e.message);
    fail++;
  }

  // 9. 验证停用用户无法登录
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUser, password: SEED_PASS }),
    });
    const body = await res.json();
    check(body.code === 403, `停用用户登录应被拒(403): ${body.code}`);
    check(body.msg.includes('停用'), `错误信息应含停用: ${body.msg}`);
    console.log('PASS  停用用户登录被拒: %s', body.msg);
    pass++;
  } catch (e) {
    console.log('FAIL  停用用户登录验证:', e.message);
    fail++;
  }

  // 10. 恢复用户为可用（重新审批）
  try {
    const res = await fetch(`${BASE}/api/admin/users/${testAddr}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `恢复用户应成功: ${body.msg}`);
    const transactionHashRestore = getTransactionHash(body.data);
    check(transactionHashRestore, `恢复用户应有 transactionHash`);
    console.log('PASS  恢复用户: %s, transactionHash=%s', testUser, transactionHashRestore);
    pass++;
  } catch (e) {
    console.log('FAIL  恢复用户:', e.message);
    fail++;
  }

  // 11. 注册新用户并验证状态
  let newUserAddr;
  const newUsername = `test_reg_${Date.now()}`;
  try {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, password: 'test123456', organization: '测试单位', role: 'FARMER' }),
    });
    const body = await res.json();
    check(body.code === 0, `注册应成功: ${body.msg}`);
    check(body.data?.user?.status === 'PENDING', `新用户状态应为 PENDING: ${body.data?.user?.status}`);
    newUserAddr = body.data?.user?.address;
    check(newUserAddr && newUserAddr.startsWith('0x'), `注册用户应有地址: ${newUserAddr}`);
    console.log('PASS  注册新用户: %s, addr=%s, status=%s', newUsername, newUserAddr, body.data?.user?.status);
    pass++;
  } catch (e) {
    console.log('FAIL  注册新用户:', e.message);
    fail++;
  }

  // 12. 驳回刚注册的用户（验证驳回流程）
  try {
    const res = await fetch(`${BASE}/api/admin/users/${newUserAddr}/reject`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: '测试驳回' }),
    });
    const body = await res.json();
    check(body.code === 0, `驳回应成功: ${body.msg}`);
    check(body.data?.status === 'REJECTED', `状态应为 REJECTED: ${body.data?.status}`);
    console.log('PASS  驳回用户: %s, status=%s', newUsername, body.data?.status);
    pass++;
  } catch (e) {
    console.log('FAIL  驳回用户:', e.message);
    fail++;
  }

  // 13. 验证驳回用户无法登录
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, password: 'test123456' }),
    });
    const body = await res.json();
    check(body.code === 403, `驳回用户登录应被拒: ${body.code}`);
    check(body.msg.includes('审核'), `错误信息应含审核: ${body.msg}`);
    console.log('PASS  驳回用户登录被拒: %s', body.msg);
    pass++;
  } catch (e) {
    console.log('FAIL  驳回用户登录验证:', e.message);
    fail++;
  }

  // 14. 管理日志（GET /api/admin/logs）
  try {
    const res = await fetch(`${BASE}/api/admin/logs`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `管理日志应返回 code 0: ${body.msg}`);
    check(Array.isArray(body.data), '日志应为数组');
    check(body.data.length > 0, `管理日志应有数据: ${body.data.length}`);
    console.log('PASS  管理日志: %d 条', body.data.length);
    pass++;
  } catch (e) {
    console.log('FAIL  管理日志:', e.message);
    fail++;
  }

  console.log('\n==== admin e2e: %d pass, %d fail, %d warn ====', pass, fail, warn);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.log('FATAL:', e.message);
  process.exit(1);
});
