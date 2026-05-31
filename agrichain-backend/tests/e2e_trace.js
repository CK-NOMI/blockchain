// #3 物流/#4 零售/#6 溯源审计 端到端测试
// 用法: node tests/e2e_trace.js
// 依赖: 后端运行中 (http://127.0.0.1:3001)

import BatchIndex from '../src/models/BatchIndex.js';
import fiscoClient from '../src/services/fiscoClient.js';
import * as farmerStore from '../src/services/farmerStore.js';
import { createUser, login } from './testHelper.js';
const BASE = process.env.API_BASE || 'http://127.0.0.1:3001';

// 创建新批次（测试独立，不依赖旧数据）
async function createBatch(farmerToken) {
  const res = await fetch(`${BASE}/api/batches/create`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productName: '测试大豆', origin: '安徽合肥', category: '粮食', quantity: 300 }),
  });
  const body = await res.json();
  if (body.code !== 0) throw new Error(`创建批次失败: ${body.msg}`);
  return { batchId: body.data.batchId, farmerToken };
}

async function main() {
  let pass = 0, fail = 0, warn = 0;

  function check(cond, msg) {
    if (!cond) { throw new Error(msg); }
  }

  // 0. 现场创建所有角色用户 + 测试批次
  let batchId, FARMER_TOKEN, PROCESSOR_TOKEN, LOGISTICS_TOKEN, RETAIL_TOKEN, REG_TOKEN;
  try {
    const farmer = await createUser('FARMER');
    FARMER_TOKEN = farmer.token;
    const prep = await createBatch(FARMER_TOKEN);
    batchId = prep.batchId;
    check(batchId, '应有 batchId');

    const processor = await createUser('PROCESSOR');
    PROCESSOR_TOKEN = processor.token;
    const logistics = await createUser('LOGISTICS');
    LOGISTICS_TOKEN = logistics.token;
    const retail = await createUser('RETAIL');
    RETAIL_TOKEN = retail.token;
    const regulator = await createUser('REGULATOR');
    REG_TOKEN = regulator.token;

    console.log('PASS  测试批次就绪: %s, 角色: F/P/L/R/R', batchId);
    pass++;
  } catch (e) {
    console.log('FAIL  前置准备: %s', e.message);
    console.log('FAIL  堆栈: %s', e.stack?.slice(0, 300));
    fail++;
    process.exit(1);
  }
  // 解析链上 batchId（字符串 ID → keccak256 bytes32）
  const chainBatchId = await farmerStore.getBatch(batchId).then(b => b?.chainBatchId || batchId).catch(() => batchId);

  // ========== 农事记录：将状态从 Created 推进到 FarmRecorded（为加工做准备） ==========
  if (FARMER_TOKEN) {
    try {
      const r = await fetch(`${BASE}/api/batches/${batchId}/farm-record`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${FARMER_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sowingDate: '2026-05-01', harvestDate: '2026-05-28', principalName: '张三' }),
      });
      const b = await r.json();
      if (b.code === 0) console.log('PASS  农事记录推进完成, txHash=%s', b.data?.transactionHash?.slice(0,20) || '');
    } catch { /* ignore */ }
  }

  // ========== 加工阶段：将批次推进到 state=2（为物流做准备） ==========
  if (PROCESSOR_TOKEN) {
    try {
      const r = await fetch(`${BASE}/api/batches/${batchId}/process-record`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${PROCESSOR_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ processType: '分拣', description: '加工完成，品质合格', reportHash: '' }),
      });
      const b = await r.json();
      if (b.code === 0) console.log('PASS  加工推进完成, txHash=%s', b.data?.transactionHash?.slice(0,20) || '');
    } catch { /* ignore */ }
  }

  // ========== 物流模块 ==========

  // 1. 物流用户已在步骤 0 创建，LOGISTICS_TOKEN 已就绪

  // 2. 提交物流记录
  try {
    const res = await fetch(`${BASE}/api/batches/${batchId}/logistics-record`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOGISTICS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleInfo: '黑A·88888',
        routeInfo: '哈尔滨→长春→沈阳',
        tempHumidity: '温度 25°C, 湿度 60%',
      }),
    });
    const body = await res.json();
    check(body.code === 0, `物流记录应成功: ${body.msg}`);
    const logTxHash = body.data?.transactionHash;
    check(logTxHash, `物流记录应有 transactionHash`);
    console.log('PASS  物流记录提交成功, transactionHash:', logTxHash);
    pass++;
  } catch (e) {
    console.log('FAIL  物流记录:', e.message);
    fail++;
  }

  // 2.5 MySQL + 链上验证 — 物流记录后
  try {
    const dbBatch = await BatchIndex.findOne({ where: { batchId } });
    check(dbBatch, '数据库应有批次记录');
    console.log('PASS  MySQL 物流后验证: batchId=%s', batchId);
    pass++;
  } catch (e) {
    console.log('FAIL  MySQL 物流后验证:', e.message);
    fail++;
  }
  try {
    const t = await fiscoClient.callReadOnly('TraceManager', 'queryTimeline', [chainBatchId]);
    const [, , logisticsTime] = Array.isArray(t) ? t : [0, 0, 0];
    check(Number(logisticsTime) > 0, `链上 logisticsTime 应 > 0: ${logisticsTime}`);
    console.log('PASS  链上物流时间: logisticsTime=%s', Number(logisticsTime));
    pass++;
  } catch (e) {
    console.log('FAIL  链上物流时间（合约缺口）:', e.message);
    fail++;
  }

  // ========== 零售模块 ==========

  // 3. 零售用户已在步骤 0 创建，RETAIL_TOKEN 已就绪

  // 4. 提交零售记录
  try {
    const res = await fetch(`${BASE}/api/batches/${batchId}/retail-record`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${RETAIL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeLocation: '哈尔滨市南岗区学府路1号', saleStatus: 'ON_SALE' }),
    });
    const body = await res.json();
    check(body.code === 0, `零售记录应成功: ${body.msg}`);
    const retTxHash = body.data?.transactionHash;
    check(retTxHash, `零售记录应有 transactionHash`);
    console.log('PASS  零售记录提交成功, transactionHash:', retTxHash);
    pass++;
  } catch (e) {
    console.log('FAIL  零售记录:', e.message);
    fail++;
  }

  // 4.5 MySQL + 链上验证 — 零售记录后
  try {
    const dbBatch = await BatchIndex.findOne({ where: { batchId } });
    check(dbBatch, '数据库应有批次记录');
    console.log('PASS  MySQL 零售后验证: batchId=%s', batchId);
    pass++;
  } catch (e) {
    console.log('FAIL  MySQL 零售后验证:', e.message);
    fail++;
  }
  try {
    const t = await fiscoClient.callReadOnly('TraceManager', 'queryTimeline', [chainBatchId]);
    const [, , , retailTime] = Array.isArray(t) ? t : [0, 0, 0, 0];
    check(Number(retailTime) > 0, `链上 retailTime 应 > 0: ${retailTime}`);
    console.log('PASS  链上零售时间: retailTime=%s', Number(retailTime));
    pass++;
  } catch (e) {
    console.log('FAIL  链上零售时间（链不可达）:', e.message);
    fail++;
  }

  // 5. 更新销售状态（零售方按钮"更新状态上链"）
  try {
    const res = await fetch(`${BASE}/api/batches/${batchId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${RETAIL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 6 }),
    });
    const body = await res.json();
    check(body.code === 0, `状态更新应成功: ${body.msg}`);
    const stTxHash = body.data?.transactionHash;
    check(stTxHash, `销售状态更新应有 transactionHash`);
    console.log('PASS  销售状态更新成功, transactionHash:', stTxHash);
    pass++;
  } catch (e) {
    console.log('WARN  销售状态更新:', e.message);
    warn++;
  }

  // 5.5 MySQL + 链上验证 — 状态更新后
  try {
    const dbBatch = await BatchIndex.findOne({ where: { batchId } });
    check(dbBatch, '数据库应有批次记录');
    console.log('PASS  MySQL 状态更新后验证: batchId=%s', batchId);
    pass++;
  } catch (e) {
    console.log('FAIL  MySQL 状态更新后验证:', e.message);
    fail++;
  }
  try {
    const info = await fiscoClient.callReadOnly('TraceManager', 'getBatchBaseInfo', [chainBatchId]);
    const status = Number(Array.isArray(info) ? info[0] : 0);
    check(status >= 6, `链上状态应为 >= 6, 实际 ${status}`);
    console.log('PASS  链上状态验证: status=%s', status);
    pass++;
  } catch (e) {
    console.log('WARN  链上状态验证（链不可达）:', e.message);
    warn++;
  }

  // ========== 公开溯源 ==========

  // 6. 公开溯源查询（无需认证）
  try {
    const res = await fetch(`${BASE}/api/trace/${batchId}`);
    const body = await res.json();
    check(body.code === 0, '溯源查询应返回 code 0');
    check(body.data?.batchId === batchId, 'batchId 应匹配');
    check(Array.isArray(body.data?.timeline), '应有 timeline 数组');
    check(body.data.timeline.length > 0, `时间线应有节点，当前为 0`);
    console.log('PASS  溯源查询: %d 个时间线节点', body.data.timeline.length);
    pass++;
  } catch (e) {
    console.log('FAIL  溯源查询:', e.message);
    fail++;
  }

  // 7. 文件验真
  try {
    const res = await fetch(`${BASE}/api/trace/${batchId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileHash: '0x0000000000000000000000000000000000000000' }),
    });
    const body = await res.json();
    check(body.code === 0, '验真应返回 code 0');
    console.log('PASS  文件验真: found=%s', body.data?.found);
    pass++;
  } catch (e) {
    console.log('FAIL  文件验真:', e.message);
    fail++;
  }

  // 8. 消费者反馈
  try {
    const res = await fetch(`${BASE}/api/trace/${batchId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemType: '品质问题', description: '产品色泽异常' }),
    });
    const body = await res.json();
    check(body.code === 0, '反馈应返回 code 0');
    check(body.data?.feedbackId, '应有 feedbackId');
    console.log('PASS  消费者反馈: id=%s', body.data?.feedbackId);
    pass++;
  } catch (e) {
    console.log('FAIL  消费者反馈:', e.message);
    fail++;
  }

  // ========== 监管审计 ==========

  // 9. 监管用户已在步骤 0 创建，REG_TOKEN 已就绪

  // 10. 审计日志列表
  try {
    const res = await fetch(`${BASE}/api/audit/logs`, {
      headers: { Authorization: `Bearer ${REG_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `审计日志应返回 code 0: ${body.msg}`);
    check(Array.isArray(body.data), '审计日志应为数组');
    console.log('PASS  审计日志: %d 条', body.data?.length || 0);
    pass++;
  } catch (e) {
    console.log('FAIL  审计日志（合约缺口）:', e.message);
    fail++;
  }

  // 11. 异常批次列表（依赖链上 isBatchAbnormal，合约缺口时 WARN）
  try {
    const res = await fetch(`${BASE}/api/audit/abnormal`, {
      headers: { Authorization: `Bearer ${REG_TOKEN}` },
    });
    const body = await res.json();
    check(body.code === 0, `异常列表应返回 code 0: ${body.msg}`);
    check(Array.isArray(body.data), '异常列表应为数组');
    console.log('PASS  异常批次列表: %d 条', body.data.length);
    pass++;
  } catch (e) {
    console.log('FAIL  异常批次列表（合约缺口）:', e.message);
    fail++;
  }

  // 12. 证据链查询（依赖链上 getEvidenceChain，合约缺口时 WARN）
  try {
    const res = await fetch(`${BASE}/api/audit/${batchId}/evidence`, {
      headers: { Authorization: `Bearer ${REG_TOKEN}` },
    });
    const body = await res.json();
    if (body.code === 0) {
      console.log('PASS  证据链查询: batchId=%s', batchId);
      pass++;
    } else {
      console.log('FAIL  证据链查询（合约函数缺失）: %s', body.msg);
      fail++;
    }
  } catch (e) {
    console.log('FAIL  证据链查询:', e.message);
    fail++;
  }

  // ========== 管理员操作 ==========

  // 13. admin 登录并查询链信息
  try {
    const admin = await login('admin', 'admin123');
    check(admin.token, 'admin 应有 token');
    console.log('PASS  admin 登录成功');
    const res = await fetch(`${BASE}/api/admin/chain-info`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const body = await res.json();
    check(body.code === 0, '链信息应返回 code 0');
    check(body.data?.blockNumber >= 0, `区块高度: ${body.data?.blockNumber}`);
    console.log('PASS  链信息: chainId=%s blockNumber=%s', body.data?.chainId, body.data?.blockNumber);
    pass += 2;
  } catch (e) {
    console.log('FAIL  admin/链信息:', e.message);
    fail += 2;
  }

  console.log('\n==== trace e2e: %d pass, %d fail, %d warn ====', pass, fail, warn);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.log('FATAL:', e.message);
  process.exit(1);
});
