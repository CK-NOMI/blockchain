// 4号农户模块专用：与2号已部署合约（Solidity 0.4.25 / FISCO BCOS 2.x）交互
// 隔离于 traceService.js，不影响其他模块
import fiscoClient from './fiscoClient.js';
import logger from '../utils/logger.js';

/**
 * 检查当前签名账户是否拥有 Farmer 角色（RoleType=1）
 * 返回 { chainAvailable: bool, isFarmer: bool }
 * - chainAvailable=false 表示节点不可达（网络错误），不应当作权限拒绝处理
 * - chainAvailable=true, isFarmer=false 表示节点正常但账户无农户角色
 */
export async function checkFarmerRole() {
  const walletAddress = fiscoClient.systemWallet?.address;
  if (!walletAddress) return { chainAvailable: false, isFarmer: false };
  try {
    const result = await fiscoClient.callReadOnlyFrom(
      'RoleManagerV2', 'checkRole', [walletAddress, 1], walletAddress
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
      'TraceManagerV2', 'generateBatchId',
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
 * 调用2号 TraceManager.createBatch(bytes32, name, variety, origin, plantDate, harvestDate)
 * 这是写交易，会改变链上状态
 */
export async function createBatchOnChain(bytes32Id, name, variety, origin, plantDate, harvestDate) {
  return fiscoClient.callContractV2('TraceManagerV2', 'createBatch', [
    bytes32Id, name, variety, origin, plantDate, harvestDate
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
      'TraceManagerV2', 'getBatchBaseInfo', [chainBatchId], walletAddress
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
      'TraceManagerV2', 'getBatchLogisticInfo', [chainBatchId], walletAddress
    );
    return result;
  } catch (err) {
    logger.warn({ chainBatchId, error: err.message }, 'getBatchLogisticInfo failed');
    return null;
  }
}

/**
 * 链路自检：验证 RPC 连通性、合约可读性
 */
export async function selfCheckChain() {
  const results = [];
  // 1. RPC 连通
  try {
    const blockNum = await fiscoClient.rpc('eth_blockNumber');
    results.push({ check: 'eth_blockNumber', ok: true, value: parseInt(blockNum, 16) });
  } catch (e) {
    results.push({ check: 'eth_blockNumber', ok: false, error: e.message });
  }

  // 2. RoleManager 读取
  try {
    const admin = await fiscoClient.callReadOnlyFrom('RoleManagerV2', 'admin', [], fiscoClient.systemWallet?.address);
    results.push({ check: 'RoleManagerV2.admin', ok: true, value: admin });
  } catch (e) {
    results.push({ check: 'RoleManagerV2.admin', ok: false, error: e.message });
  }

  // 3. 角色检查
  const walletAddress = fiscoClient.systemWallet?.address || '0x0000000000000000000000000000000000000000';
  try {
    const isFarmer = await fiscoClient.callReadOnlyFrom('RoleManagerV2', 'checkRole', [walletAddress, 1], walletAddress);
    results.push({ check: 'checkRole(farmer)', ok: true, value: isFarmer });
  } catch (e) {
    results.push({ check: 'checkRole(farmer)', ok: false, error: e.message });
  }

  // 4. generateBatchId
  try {
    const testId = await fiscoClient.callReadOnlyFrom('TraceManagerV2', 'generateBatchId', ['test', 'test', '2026-01-01', 1], walletAddress);
    results.push({ check: 'generateBatchId', ok: true, value: testId });
  } catch (e) {
    results.push({ check: 'generateBatchId', ok: false, error: e.message });
  }

  return results;
}
