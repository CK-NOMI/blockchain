// # 审计模块全覆盖端到端测试
// 覆盖 9 个审计接口：flag / abnormal / append / evidence / audit / logs / count / resolve / clear
// 用法: node tests/e2e_audit.js
// 依赖: 后端运行中 (http://127.0.0.1:3001)

import { createUser } from './testHelper.js';
const BASE = process.env.API_BASE || 'http://127.0.0.1:3001';

async function createBatch() {
  const farmer = await createUser('FARMER');
  const res = await fetch(`${BASE}/api/batches/create`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmer.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productName: '审计测试批次', origin: '测试产地', category: '测试', quantity: 200 }),
  });
  const body = await res.json();
  if (body.code !== 0) throw new Error(`创建批次失败: ${body.msg}`);
  return { batchId: body.data.batchId, farmerToken: farmer.token };
}

async function main() {
  let pass = 0, fail = 0, warn = 0;

  function check(cond, msg) {
    if (!cond) { throw new Error(msg); }
  }

  // 1. 现场创建监管员用户
  let REG_TOKEN;
  try {
    const reg = await createUser('REGULATOR');
    check(reg.token, 'regulator 应有 token');
    check(reg.user?.role === 'REGULATOR', '角色应为 REGULATOR');
    REG_TOKEN = reg.token;
    console.log('PASS  现场创建监管员: %s', reg.user.username);
    pass++;
  } catch (e) {
    console.log('FAIL  创建监管员: %s', e.message);
    fail++;
    process.exit(1);
  }

  // 2. 准备一个已有批次
  let batchId;
  try {
    const prep = await createBatch();
    batchId = prep.batchId;
    check(batchId, '应有 batchId');
    console.log('PASS  测试批次就绪: %s', batchId);
    pass++;
  } catch (e) {
    console.log('FAIL  准备测试批次: %s', e.message);
    fail++;
    process.exit(1);
  }

  // 3. 标记异常
  try {
    const res = await fetch(`${BASE}/api/audit/${batchId}/flag`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${REG_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: '质量检测异常', evidenceHash: '0x0000000000000000000000000000000000000000000000000000000000000001' }),
    });
    const body = await res.json();
    check(body.code === 0, `标记异常应成功: ${JSON.stringify(body)}`);
    console.log('PASS  标记异常成功', batchId);
    pass++;
  } catch (e) {
    console.log('FAIL  标记异常: %s', e.message);
    fail++;
  }

  // 4. 异常列表
  try {
    const res = await fetch(`${BASE}/api/audit/abnormal`, {
      headers: { Authorization: `Bearer ${REG_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `异常列表应返回 code 0: ${body.msg}`);
    check(Array.isArray(body.data), '异常列表应为数组');
    console.log('PASS  异常列表: %d 条', body.data.length);
    pass++;
  } catch (e) {
    console.log('FAIL  异常列表: %s', e.message);
    fail++;
  }

  // 5. 补充证据
  try {
    const res = await fetch(`${BASE}/api/audit/${batchId}/evidence/append`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${REG_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidenceHash: '0x0000000000000000000000000000000000000000000000000000000000000002', description: '补充检测报告' }),
    });
    const body = await res.json();
    check(body.code === 0, `补充证据应成功: ${JSON.stringify(body)}`);
    console.log('PASS  补充证据成功');
    pass++;
  } catch (e) {
    console.log('FAIL  补充证据: %s', e.message);
    fail++;
  }

  // 6. 查询证据链
  try {
    const res = await fetch(`${BASE}/api/audit/${batchId}/evidence`, {
      headers: { Authorization: `Bearer ${REG_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, '证据链应返回 code 0');
    console.log('PASS  证据链查询成功: %s', JSON.stringify(body.data).slice(0, 100));
    pass++;
  } catch (e) {
    console.log('FAIL  证据链查询: %s', e.message);
    fail++;
  }

  // 7. 提交审计
  try {
    const res = await fetch(`${BASE}/api/audit/${batchId}/audit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${REG_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditType: 'QUALITY_CHECK', description: '质量审计', evidenceHash: '' }),
    });
    const body = await res.json();
    check(body.code === 0, `提交审计应成功: ${JSON.stringify(body)}`);
    console.log('PASS  提交审计成功');
    pass++;
  } catch (e) {
    console.log('FAIL  提交审计: %s', e.message);
    fail++;
  }

  // 8. 审计日志
  try {
    const res = await fetch(`${BASE}/api/audit/logs`, {
      headers: { Authorization: `Bearer ${REG_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `审计日志应返回 code 0: ${body.msg}`);
    check(Array.isArray(body.data), '审计日志应为数组');
    console.log('PASS  审计日志: %d 条', body.data.length);
    pass++;
  } catch (e) {
    console.log('FAIL  审计日志: %s', e.message);
    fail++;
  }

  // 9. 获取审计记录数
  try {
    const res = await fetch(`${BASE}/api/audit/${batchId}/count`, {
      headers: { Authorization: `Bearer ${REG_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `审计记录数应返回 code 0: ${JSON.stringify(body)}`);
    check(typeof body.data?.count === 'number', `count 应为数字: ${body.data?.count}`);
    console.log('PASS  审计记录数: %d', body.data?.count);
    pass++;
  } catch (e) {
    console.log('FAIL  审计记录数查询: %s', e.message);
    fail++;
  }

  // 10. 关闭审计
  try {
    const res = await fetch(`${BASE}/api/audit/${batchId}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${REG_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditId: 1 }),
    });
    const body = await res.json();
    check(body.code === 0, `关闭审计应成功: ${JSON.stringify(body)}`);
    console.log('PASS  关闭审计成功');
    pass++;
  } catch (e) {
    console.log('FAIL  关闭审计: %s', e.message);
    fail++;
  }

  // 11. 清除异常
  try {
    const res = await fetch(`${BASE}/api/audit/${batchId}/clear`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${REG_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `清除异常应成功: ${JSON.stringify(body)}`);
    console.log('PASS  清除异常成功');
    pass++;
  } catch (e) {
    console.log('FAIL  清除异常: %s', e.message);
    fail++;
  }

  console.log('\n==== audit e2e: %d pass, %d fail, %d warn ====', pass, fail, warn);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.log('FATAL:', e.message);
  process.exit(1);
});
