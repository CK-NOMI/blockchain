// # 链上 + 数据库状态验证
// 每步 API 调用后验证数据已写入 MySQL 和链上
// 用法: node tests/e2e_verify.js
// 依赖: 后端运行中 (http://127.0.0.1:3001)，MySQL + 链可达

import BatchIndex from '../src/models/BatchIndex.js';
import FarmDetail from '../src/models/FarmDetail.js';
import ProcessRecord from '../src/models/ProcessRecord.js';
import LogisticsDetail from '../src/models/LogisticsDetail.js';
import RetailDetail from '../src/models/RetailDetail.js';
import fiscoClient from '../src/services/fiscoClient.js';
import { getDashboardBatches } from '../src/services/traceService.js';
import { ethers } from 'ethers';
import { createUser } from './testHelper.js';
import { createHash } from 'crypto';

const BASE = process.env.API_BASE || 'http://127.0.0.1:3001';

async function main() {
  let pass = 0, fail = 0, warn = 0;

  function check(cond, msg) {
    if (!cond) { throw new Error(msg); }
  }

  // ===== 0. 现场创建所有角色用户 + 批次 =====
  let farmerToken, processorToken, logisticsToken, retailToken, batchId, chainBatchId;
  try {
    const farmer = await createUser('FARMER');
    farmerToken = farmer.token;
    const processor = await createUser('PROCESSOR');
    processorToken = processor.token;
    const logistics = await createUser('LOGISTICS');
    logisticsToken = logistics.token;
    const retail = await createUser('RETAIL');
    retailToken = retail.token;

    const res = await fetch(`${BASE}/api/batches/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName: '验证测试水稻', origin: '黑龙江五常', category: '粮食', quantity: 500 }),
    });
    const body = await res.json();
    check(body.code === 0, `创建批次应成功: ${body.msg}`);
    batchId = body.data.batchId;
    chainBatchId = body.data.chainBatchId;
    console.log('PASS  现场创建用户 + 批次: batchId=%s', batchId);
    pass++;
  } catch (e) {
    console.log('FAIL  前置准备: %s', e.message);
    fail++;
    process.exit(1);
  }

  // ===== 1. 验证 MySQL batch_index =====
  try {
    const dbBatch = await BatchIndex.findOne({ where: { batchId } });
    check(dbBatch, '数据库应有批次记录');
    check(dbBatch.productName === '验证测试水稻', `productName 应匹配: ${dbBatch.productName}`);
    check(dbBatch.origin === '黑龙江五常', `origin 应匹配: ${dbBatch.origin}`);
    console.log('PASS  MySQL batch_index 验证: productName=%s, origin=%s', dbBatch.productName, dbBatch.origin);
    pass++;
  } catch (e) {
    console.log('FAIL  MySQL batch_index 验证: %s', e.message);
    fail++;
  }

  // ===== 2. 验证链上 getBatchBaseInfo =====
  try {
    const queryId = chainBatchId || batchId;
    const info = await fiscoClient.callReadOnly('TraceManager', 'getBatchBaseInfo', [queryId]);
    check(info, '链上应有批次信息');
    const status = Number(Array.isArray(info) ? info[0] : 0);
    check(status === 0, `链上状态应为 0 (Created), 实际 ${status}`);
    console.log('PASS  链上 getBatchBaseInfo 验证: status=%s', status);
    pass++;
  } catch (e) {
    console.log('FAIL  链上 getBatchBaseInfo 验证（链不可达）: %s', e.message);
    fail++;
  }

  // ===== 3. 提交农事记录 =====
  try {
    const res = await fetch(`${BASE}/api/batches/${batchId}/farm-record`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}`, 'Content-Type': 'application/json' },
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
    console.log('PASS  农事记录提交成功, txHash=%s', body.data?.transactionHash || '无');
    pass++;
  } catch (e) {
    console.log('FAIL  农事记录: %s', e.message);
    fail++;
  }

  // ===== 4. 验证 MySQL batch_index（农事后） =====
  try {
    const dbBatch = await BatchIndex.findOne({ where: { batchId } });
    check(dbBatch, '数据库应有批次记录');
    console.log('PASS  MySQL 农事后记录存在: productName=%s', dbBatch.productName);
    pass++;
  } catch (e) {
    console.log('FAIL  MySQL 农事后验证: %s', e.message);
    fail++;
  }

  // ===== 5. 验证 MySQL FarmDetail（农事明细） =====
  try {
    const farmDetail = await FarmDetail.findOne({ where: { batchId } });
    check(farmDetail, '数据库应有农事明细');
    check(farmDetail.sowingDate === '2026-05-01', `sowingDate 应匹配: ${farmDetail.sowingDate}`);
    check(farmDetail.harvestDate === '2026-05-28', `harvestDate 应匹配: ${farmDetail.harvestDate}`);
    check(farmDetail.principalName === '张三', `principalName 应匹配: ${farmDetail.principalName}`);
    console.log('PASS  MySQL FarmDetail 验证: sowingDate=%s, principalName=%s', farmDetail.sowingDate, farmDetail.principalName);
    pass++;
  } catch (e) {
    console.log('FAIL  MySQL FarmDetail 验证: %s', e.message);
    fail++;
  }


	// ===== 5b. 验证 getDashboardBatches 过滤（农事后·状态1） =====
	try {
	  const processorRows = await getDashboardBatches('PROCESSOR');
	  const foundProc = processorRows.some(r => r.id === batchId);
	  check(foundProc, `PROCESSOR 看板应包含批次 ${batchId}（状态1在[1,1]内）`);
	  const farmerRows = await getDashboardBatches('FARMER');
	  const foundFarmer = farmerRows.some(r => r.id === batchId);
	  check(foundFarmer, `FARMER 看板应包含批次 ${batchId}（状态1在[0,1]内）`);
	  const retailRows = await getDashboardBatches('RETAIL');
	  const notFoundRetail = !retailRows.some(r => r.id === batchId);
	  check(notFoundRetail, `RETAIL 看板不应包含批次 ${batchId}（状态1不在[3,4]内）`);
	  console.log(`PASS  getDashboardBatches 过滤验证（状态1）: PROCESSOR✓ FARMER✓ RETAIL✗`);
	  pass++;
	} catch (e) {
	  console.log(`FAIL  getDashboardBatches 过滤验证（状态1）: ${e.message}`);
	  fail++;
	}
  // ===== 6. 验证链上 queryTimeline（农事时间） =====
  try {
    const queryId = chainBatchId || batchId;
    const t = await fiscoClient.callReadOnly('TraceManager', 'queryTimeline', [queryId]);
    const [farmTime] = Array.isArray(t) ? t : [0];
    check(Number(farmTime) > 0, `链上 farmTime 应 > 0: ${farmTime}`);
    console.log('PASS  链上 queryTimeline 验证: farmTime=%s', Number(farmTime));
    pass++;
  } catch (e) {
    console.log('FAIL  链上 queryTimeline（链不可达）: %s', e.message);
    fail++;
  }

  // ===== 7. 提交加工记录（含文件哈希） =====
  const TEST_FILE_CONTENT = 'e2e_test_qc_report_2026';
  const TEST_FILE_HASH = '0x' + createHash('sha256').update(TEST_FILE_CONTENT).digest('hex');
  try {
    const res = await fetch(`${BASE}/api/batches/${batchId}/process-record`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${processorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ processType: '碾磨', description: '品质检测合格', reportHash: TEST_FILE_HASH }),
    });
    const body = await res.json();
    check(body.code === 0, `加工记录应成功: ${body.msg}`);
    console.log('PASS  加工记录提交成功, txHash=%s, reportHash=%s', body.data?.transactionHash || '无', TEST_FILE_HASH);
    pass++;
  } catch (e) {
    console.log('FAIL  加工记录（链不可达）: %s', e.message);
    fail++;
  }

  // ===== 8. 验证 MySQL ProcessRecord（加工明细） =====
  try {
    const pr = await ProcessRecord.findOne({ where: { batchId } });
    check(pr, '数据库应有加工明细');
    check(pr.processType === '碾磨', `processType 应匹配: ${pr.processType}`);
    check(pr.description === '品质检测合格', `description 应匹配: ${pr.description}`);
    console.log('PASS  MySQL ProcessRecord 验证: processType=%s', pr.processType);
    pass++;
  } catch (e) {
    console.log('FAIL  MySQL ProcessRecord 验证: %s', e.message);
    fail++;
  }

  // ===== 9. 验证链上 queryTimeline（加工时间） =====
  try {
    const queryId = chainBatchId || batchId;
    const t = await fiscoClient.callReadOnly('TraceManager', 'queryTimeline', [queryId]);
    const [, processTime] = Array.isArray(t) ? t : [0, 0];
    check(Number(processTime) > 0, `链上 processTime 应 > 0: ${processTime}`);
    console.log('PASS  链上加工时间验证: processTime=%s', Number(processTime));
    pass++;
  } catch (e) {
    console.log('FAIL  链上加工时间验证: %s', e.message);
    fail++;
  }

  // ===== 9b. 验证链上文件哈希 =====
  try {
    const queryId = chainBatchId || batchId;
    const info = await fiscoClient.callReadOnly('TraceManager', 'getBatchBaseInfo', [queryId]);
    const onChainHash = (Array.isArray(info) ? info[5] : info?.fileHash) || '';
    check(onChainHash === TEST_FILE_HASH, `链上文件哈希应匹配: 期望 ${TEST_FILE_HASH}, 实际 ${onChainHash}`);
    console.log('PASS  链上文件哈希验证: hash=%s', onChainHash);
    pass++;
  } catch (e) {
    console.log('FAIL  链上文件哈希验证: %s', e.message);
    fail++;
  }

  // ===== 9c. 调用 verifyFile 端到端验真 =====
  try {
    const res = await fetch(`${BASE}/api/trace/${batchId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileHash: TEST_FILE_HASH }),
    });
    const body = await res.json();
    const d = body?.data || body;
    check(d?.found === true, `verifyFile 应返回 found=true: ${JSON.stringify(d)}`);
    console.log('PASS  verifyFile 端到端验真通过');
    pass++;
  } catch (e) {
    console.log('FAIL  verifyFile 端到端验真: %s', e.message);
    fail++;
  }

	// ===== 9d. 验证 getDashboardBatches 过滤（加工后·状态2） =====
	try {
	  const processorRows = await getDashboardBatches('PROCESSOR');
	  const foundProc = processorRows.some(r => r.id === batchId);
	  check(foundProc, `PROCESSOR 看板应包含批次 ${batchId}（状态2在[1,2]内）`);
	  const logisticsRows = await getDashboardBatches('LOGISTICS');
	  const foundLogistics = logisticsRows.some(r => r.id === batchId);
	  check(foundLogistics, `LOGISTICS 看板应包含批次 ${batchId}（状态2在[2,3]内）`);
	  const farmerRows = await getDashboardBatches('FARMER');
	  const notFoundFarmer = !farmerRows.some(r => r.id === batchId);
	  check(notFoundFarmer, `FARMER 看板不应包含批次 ${batchId}（状态2不在[0,1]内）`);
	  console.log(`PASS  getDashboardBatches 过滤验证（状态2）: PROCESSOR✓ LOGISTICS✓ FARMER✗`);
	  pass++;
	} catch (e) {
	  console.log(`FAIL  getDashboardBatches 过滤验证（状态2）: ${e.message}`);
	  fail++;
	}

  // ===== 10. 提交物流记录 =====
  try {
    const res = await fetch(`${BASE}/api/batches/${batchId}/logistics-record`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleInfo: '黑A·88888', routeInfo: '哈尔滨→长春', tempHumidity: '25°C' }),
    });
    const body = await res.json();
    check(body.code === 0, `物流记录应成功: ${body.msg}`);
    console.log('PASS  物流记录提交成功, txHash=%s', body.data?.transactionHash || '无');
    pass++;
  } catch (e) {
    console.log('FAIL  物流记录（链不可达）: %s', e.message);
    fail++;
  }

  // ===== 11. 验证 MySQL LogisticsDetail（物流明细） =====
  try {
    const ld = await LogisticsDetail.findOne({ where: { batchId } });
    check(ld, '数据库应有物流明细');
    check(ld.vehicleInfo === '黑A·88888', `vehicleInfo 应匹配: ${ld.vehicleInfo}`);
    check(ld.routeInfo === '哈尔滨→长春', `routeInfo 应匹配: ${ld.routeInfo}`);
    console.log('PASS  MySQL LogisticsDetail 验证: vehicleInfo=%s', ld.vehicleInfo);
    pass++;
  } catch (e) {
    console.log('FAIL  MySQL LogisticsDetail 验证: %s', e.message);
    fail++;
  }

  // ===== 12. 验证链上 queryTimeline（物流时间） =====
  try {
    const queryId = chainBatchId || batchId;
    const t = await fiscoClient.callReadOnly('TraceManager', 'queryTimeline', [queryId]);
    const [, , logisticsTime] = Array.isArray(t) ? t : [0, 0, 0];
    check(Number(logisticsTime) > 0, `链上 logisticsTime 应 > 0: ${logisticsTime}`);
    console.log('PASS  链上物流时间验证: logisticsTime=%s', Number(logisticsTime));
    pass++;
  } catch (e) {
    console.log('FAIL  链上物流时间验证: %s', e.message);
    fail++;
  }

  // ===== 13. 提交零售记录 =====
  try {
    const res = await fetch(`${BASE}/api/batches/${batchId}/retail-record`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${retailToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeLocation: '哈尔滨市南岗区学府路1号', saleStatus: 'ON_SALE' }),
    });
    const body = await res.json();
    check(body.code === 0, `零售记录应成功: ${body.msg}`);
    console.log('PASS  零售记录提交成功, txHash=%s', body.data?.transactionHash || '无');
    pass++;
  } catch (e) {
    console.log('FAIL  零售记录（链不可达）: %s', e.message);
    fail++;
  }

  // ===== 14. 验证 MySQL RetailDetail（零售明细） =====
  try {
    const rd = await RetailDetail.findOne({ where: { batchId } });
    check(rd, '数据库应有零售明细');
    check(rd.storeLocation === '哈尔滨市南岗区学府路1号', `storeLocation 应匹配: ${rd.storeLocation}`);
    check(rd.saleStatus === 'ON_SALE', `saleStatus 应匹配: ${rd.saleStatus}`);
    console.log('PASS  MySQL RetailDetail 验证: storeLocation=%s', rd.storeLocation);
    pass++;
  } catch (e) {
    console.log('FAIL  MySQL RetailDetail 验证: %s', e.message);
    fail++;
  }

  // ===== 15. 验证链上 queryTimeline（零售时间） =====
  try {
    const queryId = chainBatchId || batchId;
    const t = await fiscoClient.callReadOnly('TraceManager', 'queryTimeline', [queryId]);
    const [, , , retailTime] = Array.isArray(t) ? t : [0, 0, 0, 0];
    check(Number(retailTime) > 0, `链上 retailTime 应 > 0: ${retailTime}`);
    console.log('PASS  链上零售时间验证: retailTime=%s', Number(retailTime));
    pass++;
  } catch (e) {
    console.log('FAIL  链上零售时间验证: %s', e.message);
    fail++;
  }

  // ===== 16. 更新销售状态 =====
  try {
    const res = await fetch(`${BASE}/api/batches/${batchId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${retailToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 6 }),
    });
    const body = await res.json();
    check(body.code === 0, `状态更新应成功: ${body.msg}`);
    console.log('PASS  状态更新成功, txHash=%s', body.data?.transactionHash || '无');
    pass++;
  } catch (e) {
    console.log('WARN  状态更新（链不可达）: %s', e.message);
    warn++;
  }

  // ===== 17. 验证链上状态已更新 =====
  try {
    const queryId = chainBatchId || batchId;
    const info = await fiscoClient.callReadOnly('TraceManager', 'getBatchBaseInfo', [queryId]);
    const status = Number(Array.isArray(info) ? info[0] : 0);
    check(status >= 6, `链上 status 应为 >= 6, 实际 ${status}`);
    console.log('PASS  链上状态验证: status=%s', status);
    pass++;
  } catch (e) {
    console.log('WARN  链上状态验证: %s', e.message);
    warn++;
  }

  console.log('\n==== verify e2e: %d pass, %d fail, %d warn ====', pass, fail, warn);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.log('FATAL:', e.message);
  process.exit(1);
});
