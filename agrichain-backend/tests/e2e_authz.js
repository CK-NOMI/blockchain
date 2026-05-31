// # 角色权限矩阵测试
// 测试每个角色守卫接口是否正确保护——正确角色通过，错误角色返回 403
// 用法: node tests/e2e_authz.js
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
  /** @type {Object<string, string>} */
  const tokens = {};

  function check(cond, msg) {
    if (!cond) { throw new Error(msg); }
  }

  // ===== 1. 登录所有 6 个角色账户 =====
  const accounts = [
    ['farmer1', '123456', 'FARMER'],
    ['processor1', '123456', 'PROCESSOR'],
    ['logistics1', '123456', 'LOGISTICS'],
    ['retail1', '123456', 'RETAIL'],
    ['regulator1', '123456', 'REGULATOR'],
    ['admin', 'admin123', 'ADMIN'],
  ];

  for (const [username, password, role] of accounts) {
    try {
      const data = await login(username, password);
      check(data.token, `${username} 应有 token`);
      check(data.user?.role === role, `${username} 角色应为 ${role}`);
      tokens[role] = data.token;
      console.log('PASS  登录 %s (role=%s)', username, role);
      pass++;
    } catch (e) {
      console.log('FAIL  登录 %s: %s', username, e.message);
      fail++;
      process.exit(1);
    }
  }

  // ===== 2. farmer1 创建一个测试批次 =====
  let batchId;
  try {
    const res = await fetch(`${BASE}/api/batches/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.FARMER}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName: '权限测试批次', origin: '测试产地', category: '测试', quantity: 100 }),
    });
    const body = await res.json();
    check(body.code === 0, `创建批次应成功: ${body.msg}`);
    batchId = body.data.batchId;
    console.log('PASS  创建测试批次: %s', batchId);
    pass++;
  } catch (e) {
    console.log('FAIL  创建测试批次: %s', e.message);
    fail++;
    process.exit(1);
  }

  // ===== 3. 批次端点测试矩阵 =====
  /** @type {Array<{method: string, url: string, body?: Object, allowed: string[], label: string}>} */
  const batchEndpoints = [
    { method: 'POST', url: `/batches/create`, body: { productName: '临时', origin: '临时', category: '测', quantity: 1 }, allowed: ['FARMER', 'ADMIN'], label: '创建批次' },
    { method: 'POST', url: `/batches/${batchId}/farm-record`, body: { sowingDate: '2026-01-01', harvestDate: '2026-06-01', principalName: '测试人', fertilizerRecord: '无', pesticideRecord: '无' }, allowed: ['FARMER', 'ADMIN'], label: '农事记录' },
    { method: 'POST', url: `/batches/${batchId}/process-record`, body: { processType: '碾磨', description: '测试', reportHash: '' }, allowed: ['PROCESSOR', 'ADMIN'], label: '加工记录' },
    { method: 'POST', url: `/batches/${batchId}/logistics-record`, body: { vehicleInfo: '测试车辆', routeInfo: '测试路线', tempHumidity: '25C' }, allowed: ['LOGISTICS', 'ADMIN'], label: '物流记录' },
    { method: 'POST', url: `/batches/${batchId}/retail-record`, body: { storeLocation: '测试门店', saleStatus: 'ON_SALE' }, allowed: ['RETAIL', 'ADMIN'], label: '零售记录' },
    { method: 'PUT', url: `/batches/${batchId}/status`, body: { status: 6 }, allowed: ['RETAIL', 'ADMIN'], label: '更新状态' },
  ];

  const ALL_ROLES = ['FARMER', 'PROCESSOR', 'LOGISTICS', 'RETAIL', 'REGULATOR', 'ADMIN'];

  for (const ep of batchEndpoints) {
    for (const role of ALL_ROLES) {
      try {
        const res = await fetch(`${BASE}/api${ep.url}`, {
          method: ep.method,
          headers: { Authorization: `Bearer ${tokens[role]}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(ep.body),
        });

        if (ep.allowed.includes(role)) {
          // 正确角色：检查是否被守卫拦截（403 + 含"需要角色"）
          if (res.status === 403) {
            const body = await res.json();
            check(!body.msg?.includes('需要角色'),
              `[${ep.label}] ${role} 应通过守卫，但被拦截: ${body.msg}`);
          }
          console.log('PASS  [%s] %s → %s (允许)', ep.label, role, res.status);
        } else {
          // 错误角色：必须返回 403
          check(res.status === 403, `[${ep.label}] ${role} 应被守卫拦截(403)，实际 ${res.status}`);
          const body = await res.json();
          check(body.code === 403, `[${ep.label}] ${role} body.code 应为 403`);
          check(body.msg.includes('需要角色'), `[${ep.label}] ${role} msg 应含角色提示: ${body.msg}`);
          console.log('PASS  [%s] %s → 403 (拒绝)', ep.label, role);
        }
        pass++;
      } catch (e) {
        console.log('FAIL  [%s] %s: %s', ep.label, role, e.message);
        fail++;
      }
    }
  }

  // ===== 4. admin 端点测试 =====
  /** @type {Array<{method: string, url: string, body?: Object}>} */
  const adminEndpoints = [
    { method: 'GET', url: '/admin/users' },
    { method: 'GET', url: '/admin/chain-info' },
    { method: 'GET', url: '/admin/contract-config' },
    { method: 'GET', url: '/admin/node-status' },
    { method: 'GET', url: '/admin/logs' },
    { method: 'PUT', url: '/admin/users/0x0000000000000000000000000000000000000001/approve' },
    { method: 'PUT', url: '/admin/users/0x0000000000000000000000000000000000000001/reject', body: { reason: 'test' } },
    { method: 'PUT', url: '/admin/users/0x0000000000000000000000000000000000000001/suspend' },
    { method: 'PUT', url: '/admin/users/0x0000000000000000000000000000000000000001/role', body: { role: 'FARMER' } },
  ];

  // 4a. 证明 admin 守卫：用第一个 admin 端点测试所有 6 个角色
  const adminGuardEp = adminEndpoints[0];
  for (const role of ALL_ROLES) {
    try {
      const res = await fetch(`${BASE}/api${adminGuardEp.url}`, {
        headers: { Authorization: `Bearer ${tokens[role]}` },
      });
      if (role === 'ADMIN') {
        check(res.status !== 403, 'ADMIN 不应被守卫拦截');
        console.log('PASS  [admin guard] %s → %s', role, res.status);
      } else {
        check(res.status === 403, `[admin guard] ${role} 应被拦截，实际 ${res.status}`);
        console.log('PASS  [admin guard] %s → 403', role);
      }
      pass++;
    } catch (e) {
      console.log('FAIL  [admin guard] %s: %s', role, e.message);
      fail++;
    }
  }

  // 4b. 验证所有 admin 端点对 admin 放行
  for (const ep of adminEndpoints) {
    try {
      const opts = { method: ep.method, headers: { Authorization: `Bearer ${tokens.ADMIN}` } };
      if (ep.body) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(ep.body);
      }
      const res = await fetch(`${BASE}/api${ep.url}`, opts);
      check(res.status !== 403, `[${ep.method} ${ep.url}] admin 不应被守卫拦截`);
      console.log('PASS  [admin endpoint] %s %s → %s', ep.method, ep.url.split('/').slice(0, 3).join('/'), res.status);
      pass++;
    } catch (e) {
      console.log('FAIL  [admin endpoint] %s %s: %s', ep.method, ep.url, e.message);
      fail++;
    }
  }

  // ===== 5. audit 端点测试 =====
  /** @type {Array<{method: string, url: string, bodyOptional?: boolean}>} */
  const auditEndpoints = [
    { method: 'GET', url: '/audit/abnormal' },
    { method: 'GET', url: `/audit/${batchId}/evidence` },
    { method: 'POST', url: `/audit/${batchId}/flag` },
    { method: 'POST', url: `/audit/${batchId}/audit` },
    { method: 'POST', url: `/audit/${batchId}/resolve` },
    { method: 'PUT', url: `/audit/${batchId}/clear` },
    { method: 'POST', url: `/audit/${batchId}/evidence/append` },
    { method: 'GET', url: `/audit/${batchId}/count` },
    { method: 'GET', url: '/audit/logs' },
  ];
  const AUDIT_ALLOWED = ['REGULATOR', 'ADMIN'];

  // 5a. 证明 audit 守卫：用第一个 audit 端点测试所有 6 个角色
  const auditGuardEp = auditEndpoints[0];
  for (const role of ALL_ROLES) {
    try {
      const res = await fetch(`${BASE}/api${auditGuardEp.url}`, {
        headers: { Authorization: `Bearer ${tokens[role]}` },
      });
      if (AUDIT_ALLOWED.includes(role)) {
        check(res.status !== 403, `${role} 不应被守卫拦截`);
        console.log('PASS  [audit guard] %s → %s', role, res.status);
      } else {
        check(res.status === 403, `[audit guard] ${role} 应被拦截，实际 ${res.status}`);
        console.log('PASS  [audit guard] %s → 403', role);
      }
      pass++;
    } catch (e) {
      console.log('FAIL  [audit guard] %s: %s', role, e.message);
      fail++;
    }
  }

  // 5b. 验证所有 audit 端点对 regulator 和 admin 放行
  for (const ep of auditEndpoints) {
    for (const role of AUDIT_ALLOWED) {
      try {
        const opts = { method: ep.method, headers: { Authorization: `Bearer ${tokens[role]}` } };
        // POST/PUT 需要 Content-Type 和 body
        if (ep.method === 'POST' || ep.method === 'PUT') {
          opts.headers['Content-Type'] = 'application/json';
          opts.body = JSON.stringify({});
        }
        const res = await fetch(`${BASE}/api${ep.url}`, opts);
        check(res.status !== 403, `[audit endpoint ${ep.method} ${ep.url.split('/').slice(0, 3).join('/')}] ${role} 不应被守卫拦截`);
        console.log('PASS  [audit endpoint] %s %s → %s', ep.method, ep.url.split('/').slice(0, 3).join('/'), res.status);
        pass++;
      } catch (e) {
        console.log('FAIL  [audit endpoint] %s %s %s: %s', ep.method, ep.url, role, e.message);
        fail++;
      }
    }
  }

  console.log('\n==== authz e2e: %d pass, %d fail, %d warn ====', pass, fail, warn);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.log('FATAL:', e.message);
  process.exit(1);
});
