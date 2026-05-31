// #4 农户模块端到端测试
// 用法: node tests/e2e_farmer.js
// 依赖: 后端运行中 (http://127.0.0.1:3001)

import BatchIndex from '../src/models/BatchIndex.js';
import { createUser } from './testHelper.js';
const BASE = process.env.API_BASE || 'http://127.0.0.1:3001';

async function main() {
  let pass = 0, fail = 0, warn = 0;
  let TOKEN;

  function check(cond, msg) {
    if (!cond) { throw new Error(msg); }
  }

  // 1. 现场创建农户用户
  try {
    const farmer = await createUser('FARMER');
    check(farmer.token, '应有 token');
    check(farmer.user?.role === 'FARMER', '角色应为 FARMER');
    console.log('PASS  现场创建农户: %s', farmer.user.username);
    pass++;
    TOKEN = farmer.token;
  } catch (e) {
    console.log('FAIL  创建农户:', e.message);
    fail++;
    process.exit(1);
  }

  // 2. 创建批次
  let batchId;
  try {
    const res = await fetch(`${BASE}/api/batches/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: '测试水稻',
        origin: '黑龙江五常',
        category: '粮食',
        quantity: 1000,
      }),
    });
    const body = await res.json();
    check(body.code === 0, `创建批次应成功: ${body.msg}`);
    check(body.data?.batchId, `应有 batchId: ${JSON.stringify(body.data)}`);
    check(body.data?.transactionHash && body.data.transactionHash.length > 0, `创建批次应有 transactionHash: ${body.data?.transactionHash}`);
    batchId = body.data.batchId;
    console.log('PASS  创建批次成功:', batchId);
    pass++;
  } catch (e) {
    console.log('FAIL  创建批次:', e.message);
    fail++;
  }

  // 2.5 MySQL 验证 — 批次记录
  try {
    const dbBatch = await BatchIndex.findOne({ where: { batchId } });
    check(dbBatch, '数据库应有批次记录');
    check(dbBatch.productName === '测试水稻', `productName 应匹配: ${dbBatch.productName}`);
    check(dbBatch.origin === '黑龙江五常', `origin 应匹配: ${dbBatch.origin}`);
    console.log('PASS  MySQL 批次记录验证: %s', batchId);
    pass++;
  } catch (e) {
    console.log('FAIL  MySQL 批次记录验证:', e.message);
    fail++;
  }

  // 3. 提交农事记录
  try {
    const res = await fetch(`${BASE}/api/batches/${batchId}/farm-record`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sowingDate: '2026-05-01',
        harvestDate: '2026-05-28',
        principalName: '张三',
        fertilizerRecord: '复合肥 50kg',
        pesticideRecord: '无',
      }),
    });
    const body = await res.json();
    check(body.code === 0, `农事记录应成功: ${body.msg}`);
    check(body.data?.transactionHash, `农事记录应有 transactionHash`);
    console.log('PASS  农事记录提交成功, transactionHash:', body.data.transactionHash);
    pass++;
  } catch (e) {
    console.log('FAIL  农事记录:', e.message);
    fail++;
  }

  // 3.5 MySQL 验证 — 农事后批次记录
  try {
    const dbBatch = await BatchIndex.findOne({ where: { batchId } });
    check(dbBatch, '数据库应有批次记录');
    console.log('PASS  MySQL 农事后验证: productName=%s, txHash=%s', dbBatch.productName, dbBatch.transactionHash || '无');
    pass++;
  } catch (e) {
    console.log('FAIL  MySQL 农事后验证:', e.message);
    fail++;
  }

  // 4. 查询批次详情
  try {
    const res = await fetch(`${BASE}/api/batches/${batchId}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, '批次详情应返回 code 0');
    check(body.data?.batchId === batchId, 'batchId 应匹配');
    console.log('PASS  批次详情: status=%s', body.data?.status);
    pass++;
  } catch (e) {
    console.log('FAIL  批次详情:', e.message);
    fail++;
  }

  // 5. 农户仪表盘（刚创建了批次，应有数据）
  try {
    const res = await fetch(`${BASE}/api/batches/dashboard?role=FARMER`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, '仪表盘应返回 code 0');
    check(Array.isArray(body.data), '数据应为数组');
    check(body.data.length > 0, `仪表盘应有批次数据: ${body.data.length}`);
    console.log('PASS  农户仪表盘: %d 个批次', body.data.length);
    pass++;
  } catch (e) {
    console.log('FAIL  农户仪表盘:', e.message);
    fail++;
  }

  console.log('\n==== farmer e2e: %d pass, %d fail, %d warn ====', pass, fail, warn);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.log('FATAL:', e.message);
  process.exit(1);
});
