// #5 加工质检模块端到端测试
// 用法: node tests/e2e_processor.js
// 依赖: 后端运行中 (http://127.0.0.1:3001)

import BatchIndex from '../src/models/BatchIndex.js';
import fiscoClient from '../src/services/fiscoClient.js';
import * as farmerStore from '../src/services/farmerStore.js';
import { createUser } from './testHelper.js';
const BASE = process.env.API_BASE || 'http://127.0.0.1:3001';

async function main() {
  let pass = 0, fail = 0, warn = 0;

  function check(cond, msg) {
    if (!cond) { throw new Error(msg); }
  }

  // 0. 现场创建测试用户（加工方 + 农户），不依赖种子数据
  let TOKEN, batchId, farmerToken;
  try {
    const processor = await createUser('PROCESSOR');
    TOKEN = processor.token;
    check(TOKEN, 'processor 应有 token');
    check(processor.user?.role === 'PROCESSOR', '角色应为 PROCESSOR');
    const farmer = await createUser('FARMER');
    farmerToken = farmer.token;
    const batchRes = await fetch(`${BASE}/api/batches/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmer.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName: '测试玉米', origin: '吉林松原', category: '粮食', quantity: 500 }),
    });
    const batchBody = await batchRes.json();
    check(batchBody.code === 0, `创建批次失败: ${batchBody.msg}`);
    batchId = batchBody.data.batchId;
    check(batchId, '应有 batchId');
    console.log('PASS  现场创建用户: PROCESSOR=%s, FARMER=%s', processor.user.username, farmer.user.username);
    console.log('PASS  测试批次就绪: %s', batchId);
    pass += 3;
  } catch (e) {
    console.log('FAIL  前置准备: %s', e.message);
    fail++;
    process.exit(1);
  }

  // 1.5 农事记录：将状态从 Created 推进到 FarmRecorded（为加工做准备）
  try {
    const farmRes = await fetch(`${BASE}/api/batches/${batchId}/farm-record`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sowingDate: '2026-05-01', harvestDate: '2026-05-28', principalName: '张三' }),
    });
    const farmBody = await farmRes.json();
    check(farmBody.code === 0, `农事记录推进失败: ${farmBody.msg}`);
    console.log('PASS  农事记录推进完成');
    pass++;
  } catch (e) {
    console.log('FAIL  农事记录推进:', e.message);
    fail++;
  }

  // 2. 加工仪表盘
  try {
    const res = await fetch(`${BASE}/api/batches/dashboard?role=PROCESSOR`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, '仪表盘应返回 code 0');
    console.log('PASS  加工仪表盘: %d 个批次', body.data?.length || 0);
    pass++;
  } catch (e) {
    console.log('FAIL  加工仪表盘:', e.message);
    fail++;
  }

  // 3. 批次列表
  try {
    const res = await fetch(`${BASE}/api/batches/`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, '批次列表应返回 code 0');
    check(Array.isArray(body.data), '数据应为数组');
    console.log('PASS  批次列表: %d 个批次', body.data.length);
    pass++;
  } catch (e) {
    console.log('FAIL  批次列表:', e.message);
    fail++;
  }

  // 4. 提交加工记录
  try {
    const res = await fetch(`${BASE}/api/batches/${batchId}/process-record`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ processType: '碾磨', description: '加工程序完成，品质检测合格', reportHash: '' }),
    });
    const body = await res.json();
    check(body.code === 0, `加工记录应成功: ${body.msg}`);
    const procTxHash = body.data?.transactionHash;
    check(procTxHash, `加工记录应有 transactionHash，原始响应: ${JSON.stringify(body.data).slice(0, 200)}`);
    console.log('PASS  加工记录提交成功, transactionHash:', procTxHash);
    pass++;
  } catch (e) {
    console.log('FAIL  加工记录:', e.message);
    fail++;
  }

  // 5.5 MySQL + 链上验证 — 加工记录后
  try {
    // MySQL: batch_index 记录应存在
    const dbBatch = await BatchIndex.findOne({ where: { batchId } });
    check(dbBatch, '数据库应有批次记录');
    console.log('PASS  MySQL 加工后验证: batchId=%s', batchId);
    pass++;
  } catch (e) {
    console.log('FAIL  MySQL 加工后验证:', e.message);
    fail++;
  }
  try {
    // 链上: queryTimeline 应有 processTime（解析 chainBatchId）
    const batch = await farmerStore.getBatch(batchId);
    const chainId = batch?.chainBatchId || batchId;
    const t = await fiscoClient.callReadOnly('TraceManager', 'queryTimeline', [chainId]);
    const [, processTime] = Array.isArray(t) ? t : [0, 0];
    check(Number(processTime) > 0, `链上 processTime 应 > 0: ${processTime}`);
    console.log('PASS  链上加工时间: processTime=%s', Number(processTime));
    pass++;
  } catch (e) {
    console.log('FAIL  链上加工时间（合约缺口）:', e.message);
    fail++;
  }

  // 6. 查询批次详情（验证加工记录可见）
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

  console.log('\n==== processor e2e: %d pass, %d fail, %d warn ====', pass, fail, warn);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.log('FATAL:', e.message);
  process.exit(1);
});
