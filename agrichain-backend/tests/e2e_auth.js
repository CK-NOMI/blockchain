// #3 管理员模块端到端测试
// 用法: node test/e2e_auth.js
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

  // 0. 健康检查（无需认证）
  try {
    const res = await fetch(`${BASE}/api/health`);
    const body = await res.json();
    check(body.code === 0, `健康检查应返回 code 0: ${body.msg}`);
    check(body.data?.status === 'ok', `状态应为 ok: ${body.data?.status}`);
    console.log('PASS  健康检查: status=%s', body.data?.status);
    pass++;
  } catch (e) {
    console.log('FAIL  健康检查:', e.message);
    fail++;
  }

  // 1. admin 登录
  try {
    const admin = await login('admin', 'admin123');
    check(admin.token, 'admin 应有 token');
    check(admin.user?.role === 'ADMIN', 'admin 角色应为 ADMIN');
    console.log('PASS  admin 登录成功');
    pass++;
    var TOKEN = admin.token;
  } catch (e) {
    console.log('FAIL  admin 登录:', e.message);
    fail++;
    process.exit(1);
  }

  // 2. 用户列表
  try {
    const res = await fetch(`${BASE}/api/admin/users?status=ACTIVE`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, '用户列表应返回 code 0');
    check(Array.isArray(body.data), '用户列表应为数组');
    check(body.data.length >= 5, `至少有 5 个用户: ${body.data.length}`);
    console.log('PASS  用户列表:', body.data.map(u => u.username).join(', '));
    pass++;
  } catch (e) {
    console.log('FAIL  用户列表:', e.message);
    fail++;
  }

  // 3. 获取链信息
  try {
    const res = await fetch(`${BASE}/api/admin/chain-info`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, '链信息应返回 code 0');
    check(body.data?.blockNumber >= 0, `区块高度: ${body.data?.blockNumber}`);
    console.log('PASS  链信息: chainId=%s blockNumber=%s', body.data?.chainId, body.data?.blockNumber);
    pass++;
  } catch (e) {
    console.log('FAIL  链信息:', e.message);
    fail++;
  }

  // 4. farmer1 登录（验证普通用户可正常登录）
  try {
    const farmer = await login('farmer1', '123456');
    check(farmer.token, 'farmer1 应有 token');
    check(farmer.user?.role === 'FARMER', 'farmer1 角色应为 FARMER');
    console.log('PASS  farmer1 登录成功');
    pass++;
    var FARMER_TOKEN = farmer.token;
  } catch (e) {
    console.log('FAIL  farmer1 登录:', e.message);
    fail++;
  }

  // 5. 获取个人信息（需认证）
  try {
    const res = await fetch(`${BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${FARMER_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `个人信息应返回 code 0: ${body.msg}`);
    check(body.data?.username === 'farmer1', `用户名应为 farmer1: ${body.data?.username}`);
    check(body.data?.role === 'FARMER', `角色应为 FARMER: ${body.data?.role}`);
    console.log('PASS  个人信息: %s, role=%s', body.data?.username, body.data?.role);
    pass++;
  } catch (e) {
    console.log('FAIL  个人信息:', e.message);
    fail++;
  }

  // 6. 注册新用户
  try {
    const newUsername = `test_reg_${Date.now()}`;
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, password: 'test123', organization: '测试单位', role: 'FARMER' }),
    });
    const body = await res.json();
    check(body.code === 0, `注册应成功: ${body.msg}`);
    check(body.data?.user?.status === 'PENDING', `新用户状态应为 PENDING: ${body.data?.user?.status}`);
    check(body.data?.user?.username === newUsername, '用户名应匹配');
    console.log('PASS  注册新用户: %s, status=%s', newUsername, body.data?.user?.status);
    pass++;
  } catch (e) {
    console.log('FAIL  注册新用户:', e.message);
    fail++;
  }

  console.log('\n==== auth e2e: %d pass, %d fail, %d warn ====', pass, fail, warn);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.log('FATAL:', e.message);
  process.exit(1);
});
