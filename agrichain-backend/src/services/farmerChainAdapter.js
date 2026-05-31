// 【改动说明】
// 1. checkFarmerRole 原检查系统账户地址而非登录用户地址，导致 farmer1 等真实用户
//    提交农事记录时被误判为"链上账户未授权农户角色"。修复：增加 userAddress
//    参数，使调用方传入 req.user.address 进行角色检查。
// 2. 原使用 contractsV2.js 独立配置，与 contracts.js（V1）ABI 和地址完全相同。
//    已合并：去掉 contractsV2.js，统一走 contracts.js，合约名去掉 V2 后缀，
//    callContractV2As 改用 callContractAs。
import fiscoClient from './fiscoClient.js';
import logger from '../utils/logger.js';

/**
 * 检查指定用户是否拥有 Farmer 角色（RoleType=1）
 * @param {string} userAddress - 用户区块链地址
 * 返回 { chainAvailable: bool, isFarmer: bool }
 * - chainAvailable=false 表示节点不可达（网络错误），不应当作权限拒绝处理
 * - chainAvailable=true, isFarmer=false 表示节点正常但账户无农户角色
 */
export async function checkFarmerRole(userAddress) {
  if (!userAddress) return { chainAvailable: false, isFarmer: false };
  try {
    const result = await fiscoClient.callReadOnlyFrom(
      'RoleManager', 'checkRole', [userAddress, 1], userAddress
    );
    return { chainAvailable: true, isFarmer: result === true };
  } catch (err) {
    const isNetworkError = err.message?.includes('fetch failed')
      || err.message?.includes('ECONNREFUSED')
      || err.message?.includes('ENOTFOUND');
    logger.warn({ error: err.message, isNetworkError }, 'checkFarmerRole failed');
    return { chainAvailable: !isNetworkError, isFarmer: false };
  }
}

/**
 * 调用2号合约 generateBatchId(name, origin, plantDate, nonce)
 * 必须带 from = 签名账户，因为合约内部用 msg.sender 参与哈希
 */
export async function generateChainBatchId(name, origin, plantDate) {
  const walletAddress = fiscoClient.systemWallet?.address;
  if (!walletAddress) throw new Error('签名账户未配置');
  const nonce = Date.now();
  try {
    const bytes32Id = await fiscoClient.callReadOnlyFrom(
      'TraceManager', 'generateBatchId',
      [name, origin, plantDate, nonce],
      walletAddress
    );
    return { bytes32Id, nonce };
  } catch (err) {
    logger.error({ error: err.message }, 'generateChainBatchId failed');
    throw new Error('生成链上批次号失败: ' + err.message);
  }
}

/**
 * TraceManager 合约没有独立的农事记录函数（不像加工有 recordProcessInfo、
 * 物流有 recordLogisticsInfo）。农事信息被塞进了 createBatch 参数里：
 *
 *   第一次（农户创建批次 batchController.createBatch）：productName/variety/origin
 *   填完整，plantDate 有值，harvestDate 留空 → 链上生成一条初始批次记录
 *   第二次（农户提交农事记录 batchController.addFarmRecord）：同一个 batchId，
 *   harvestDate 补上 → 链上同一条记录补全农事时间，状态推进到"农事记录已提交"
 *
 * 合约内部用 mapping(bytes32 => Batch) 以 batchId 为键存储，重复调用同
 * batchId 是覆盖字段而非新增（Solidity mapping 不支持追加记录）。
 *
 * @param {string} userAddress - 签名用的农户地址（合约检查 msg.sender 是否为 FARMER）
 */
export async function createBatchOnChain(bytes32Id, name, variety, origin, plantDate, harvestDate, userAddress) {
  return fiscoClient.callContractAs(userAddress, 'TraceManager', 'createBatch', [
    bytes32Id, name, variety, origin, plantDate, harvestDate
  ]);
}

/**
 * 调用 TraceManager.recordFarmInfo 补充农事记录（替代原先错误调用 createBatch）
 */
export async function recordFarmInfoOnChain(chainBatchId, name, variety, origin, plantDate, harvestDate, userAddress) {
  return fiscoClient.callContractAs(userAddress, 'TraceManager', 'recordFarmInfo', [
    chainBatchId, name, variety, origin, plantDate, harvestDate
  ]);
}

/**
 * 调用2号 TraceManager.getBatchBaseInfo(bytes32)
 * 返回：currentState, farmName, farmOrigin, farmTime, checkResult, fileHash, processTime
 */
export async function getBatchBaseInfoFromChain(chainBatchId) {
  const walletAddress = fiscoClient.systemWallet?.address;
  try {
    const result = await fiscoClient.callReadOnlyFrom(
      'TraceManager', 'getBatchBaseInfo', [chainBatchId], walletAddress
    );
    return result;
  } catch (err) {
    logger.warn({ chainBatchId, error: err.message }, 'getBatchBaseInfo failed');
    return null;
  }
}

/**
 * 调用2号 TraceManager.getBatchLogisticInfo(bytes32)
 * 返回：temperature, logisticsTime, expiryDate, retailTime
 */
export async function getBatchLogisticInfoFromChain(chainBatchId) {
  const walletAddress = fiscoClient.systemWallet?.address;
  try {
    const result = await fiscoClient.callReadOnlyFrom(
      'TraceManager', 'getBatchLogisticInfo', [chainBatchId], walletAddress
    );
    return result;
  } catch (err) {
    logger.warn({ chainBatchId, error: err.message }, 'getBatchLogisticInfo failed');
    return null;
  }
}

/**
 * 链路自检：验证 WeBASE-Front 连通性、合约可读性
 * 整个后端不直连区块链节点 RPC（详见 docs/后端/合约调用指南.md），
 * 所有链上操作均通过 WeBASE-Front REST API 转发。
 */
export async function selfCheckChain() {
  const results = [];
  // 1. 链连通性（通过 WeBASE-Front 获取区块高度）
  try {
    const blockNum = await fiscoClient.getBlockNumber();
    results.push({ check: 'blockNumber', ok: true, value: blockNum });
  } catch (e) {
    results.push({ check: 'blockNumber', ok: false, error: e.message });
  }

  // 2. RoleManager 读取
  try {
    const admin = await fiscoClient.callReadOnlyFrom('RoleManager', 'admin', [], fiscoClient.systemWallet?.address);
    results.push({ check: 'RoleManager.admin', ok: true, value: admin });
  } catch (e) {
    results.push({ check: 'RoleManager.admin', ok: false, error: e.message });
  }

  // 3. 角色检查
  const walletAddress = fiscoClient.systemWallet?.address || '0x0000000000000000000000000000000000000000';
  try {
    const isFarmer = await fiscoClient.callReadOnlyFrom('RoleManager', 'checkRole', [walletAddress, 1], walletAddress);
    results.push({ check: 'checkRole(farmer)', ok: true, value: isFarmer });
  } catch (e) {
    results.push({ check: 'checkRole(farmer)', ok: false, error: e.message });
  }

  // 4. generateBatchId
  try {
    const testId = await fiscoClient.callReadOnlyFrom('TraceManager', 'generateBatchId', ['test', 'test', '2026-01-01', 1], walletAddress);
    results.push({ check: 'generateBatchId', ok: true, value: testId });
  } catch (e) {
    results.push({ check: 'generateBatchId', ok: false, error: e.message });
  }

  return results;
}
