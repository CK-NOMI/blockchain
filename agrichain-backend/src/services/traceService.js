import { ethers } from 'ethers';
import { Op } from 'sequelize';
import fiscoClient from './fiscoClient.js';
import * as farmerStore from './farmerStore.js';
import BatchIndex from '../models/BatchIndex.js';
import User from '../models/User.js';

// 查实际部署的 TraceManager ABI 确认函数名
// recordProcessInfo, createBatch, recordRetailInfo, changeBatchState, recordLogisticsInfo
// getBatchBaseInfo, getBatchLogisticInfo, batchIds

/** 解析链上 bytes32 ID：字符串 batchId → keccak256 hex ID */
export async function resolveChainBatchId(batchId) {
  try {
    const batch = await farmerStore.getBatch(batchId);
    if (batch?.chainBatchId) return batch.chainBatchId;
  } catch { /* 不在链下存储中则直接用原 ID */ }
  return batchId;
}

// 合约状态(0-6) → 业务状态(0-11) 映射
// 合约只记录粗粒度里程碑，后端维护细粒度业务状态
// 映射: Create→Created, Farm→Farming, Process→Processed, Logistics→Transporting,
//       Retail→OnSale, Expired→Expired, Sold→SoldOut
const CONTRACT_TO_BUSINESS_STATUS = [0, 1, 4, 5, 8, 10, 9];

function _toBusinessStatus(chainStatus) {
  const n = Number(chainStatus);
  return n >= 0 && n < CONTRACT_TO_BUSINESS_STATUS.length ? CONTRACT_TO_BUSINESS_STATUS[n] : n;
}

export async function createBatch(batchId, productName, origin, category, quantity) {
  return fiscoClient.callContract('TraceManager', 'createBatch', [
    batchId, productName, origin, category, quantity || 0,
  ]);
}

export async function addFarmRecord(batchId, recordType, description, fileHash) {
  return fiscoClient.callContract('TraceManager', 'recordFarmInfo', [
    batchId, '', '', '', '', '',
  ]);
}

export async function addProcessRecord(batchId, processType, description, reportHash, wallet) {
  const chainId = await resolveChainBatchId(batchId);
  const methodArgs = [chainId, processType, description, reportHash || ''];
  if (wallet) {
    return fiscoClient.callContractAs(wallet, 'TraceManager', 'recordProcessInfo', methodArgs);
  }
  return fiscoClient.callContract('TraceManager', 'recordProcessInfo', methodArgs);
}

export async function updateProcessFileHash(batchId, fileHash, wallet) {
  const chainId = await resolveChainBatchId(batchId);
  if (wallet) {
    return fiscoClient.callContractAs(wallet, 'TraceManager', 'updateProcessFileHash', [chainId, fileHash || '']);
  }
  return fiscoClient.callContract('TraceManager', 'updateProcessFileHash', [chainId, fileHash || '']);
}

export async function addLogisticsRecord(batchId, vehicleInfo, routeInfo, tempHumidity, fileHash, wallet) {
  const chainId = await resolveChainBatchId(batchId);
  const methodArgs = [chainId, vehicleInfo || '', routeInfo || ''];
  if (wallet) {
    return fiscoClient.callContractAs(wallet, 'TraceManager', 'recordLogisticsInfo', methodArgs);
  }
  return fiscoClient.callContract('TraceManager', 'recordLogisticsInfo', methodArgs);
}

export async function addRetailRecord(batchId, storeLocation, saleStatus, fileHash, wallet) {
  const chainId = await resolveChainBatchId(batchId);
  const methodArgs = [chainId, storeLocation || '', saleStatus || ''];
  if (wallet) {
    return fiscoClient.callContractAs(wallet, 'TraceManager', 'recordRetailInfo', methodArgs);
  }
  return fiscoClient.callContract('TraceManager', 'recordRetailInfo', methodArgs);
}

export async function updateBatchStatus(batchId, newStatus, wallet) {
  const chainId = await resolveChainBatchId(batchId);
  const methodArgs = [chainId, newStatus];
  if (wallet) {
    return fiscoClient.callContractAs(wallet, 'TraceManager', 'changeBatchState', methodArgs);
  }
  return fiscoClient.callContract('TraceManager', 'changeBatchState', methodArgs);
}

export async function markBatchAbnormal(batchId, wallet) {
  const methodArgs = [batchId, 10];
  if (wallet) {
    return fiscoClient.callContractAs(wallet, 'TraceManager', 'changeBatchState', methodArgs);
  }
  return fiscoClient.callContract('TraceManager', 'changeBatchState', methodArgs);
}

export async function getBatchRaw(batchId) {
  // getBatchBaseInfo 返回: [currentState, farmName, farmOrigin, farmTime, checkResult, fileHash, processTime]
  // 这里用 getBatchBaseInfo 和 getBatchLogisticInfo 拼接
  const chainId = await resolveChainBatchId(batchId);
  const info = await fiscoClient.callReadOnly('TraceManager', 'getBatchBaseInfo', [chainId]);
  const logInfo = await fiscoClient.callReadOnly('TraceManager', 'getBatchLogisticInfo', [batchId]).catch(() => []);
  const i = Array.isArray(info) ? info : [];
  const l = Array.isArray(logInfo) ? logInfo : [];
  return {
    exists: true,
    batchId,
    productName: i[1] || '',
    origin: i[2] || '',
    category: '',
    quantity: 0,
    farmer: '',
    status: Number(i[0] ?? 0),
    businessStatus: _toBusinessStatus(i[0]),
    chainStatusCode: Number(i[0] ?? -1),
    createdAt: Number(i[3] ?? 0),
    updatedAt: Math.max(Number(i[3] ?? 0), Number(i[6] ?? 0), Number(l[1] ?? 0)),
    farmTime: Number(i[3] ?? 0),
    processTime: Number(i[6] ?? 0),
    checkResult: i[4] || '',
    fileHash: i[5] || '',
    logisticsTime: Number(l[1] ?? 0),
    temperature: l[0] || '',
    retailTime: Number(l[3] ?? 0),
    expiryDate: l[2] || '',
  };
}

export async function getFarmRecords(batchId) {
  const raw = await getBatchRaw(batchId);
  if (!raw.farmTime) return [];
  return [{ recordType: 'FARM_INFO', description: raw.origin, operator: '', timestamp: raw.farmTime, fileHash: '' }];
}

export async function getProcessRecords(batchId) {
  const raw = await getBatchRaw(batchId);
  if (!raw.processTime) return [];
  return [{ processType: 'process', description: raw.checkResult, operator: '', timestamp: raw.processTime, reportHash: raw.fileHash }];
}

export async function getLogisticsRecords(batchId) {
  const raw = await getBatchRaw(batchId);
  if (!raw.logisticsTime) return [];
  return [{ vehicleInfo: '', routeInfo: raw.temperature, operator: '', timestamp: raw.logisticsTime, fileHash: '' }];
}

export async function getRetailRecords(batchId) {
  const raw = await getBatchRaw(batchId);
  if (!raw.retailTime) return [];
  return [{ storeLocation: raw.expiryDate, saleStatus: '', operator: '', timestamp: raw.retailTime, fileHash: '' }];
}

export async function verifyFileHash(batchId, fileHash) {
  try {
    const chainId = await resolveChainBatchId(batchId);
    const info = await fiscoClient.callReadOnly('TraceManager', 'getBatchBaseInfo', [chainId]);
    const onChainHash = (Array.isArray(info) ? info[5] : info?.fileHash) || '';
    if (onChainHash === fileHash) return { found: true, recordType: 'process' };

    // 链上未匹配时，尝试查 MySQL 链下存储
    const batch = await farmerStore.getBatch(batchId);
    if (batch?.fileHash === fileHash) return { found: true, recordType: 'offchain' };

    return { found: false, recordType: '' };
  } catch {
    return { found: false, recordType: '' };
  }
}

export async function getBatchesByFarmer(farmerAddr) {
  const ids = await getAllBatchIds();
  const result = [];
  for (const id of ids) {
    try {
      const raw = await getBatchRaw(id);
      if (raw.farmer?.toLowerCase() === farmerAddr?.toLowerCase()) result.push(id);
    } catch { /* skip */ }
  }
  return result;
}

export async function getAllBatchIds() {
  const ids = [];
  for (let i = 0; i < 200; i++) {
    try {
      const id = await fiscoClient.callReadOnly('TraceManager', 'batchIds', [i]);
      if (!id || id === '0x0000000000000000000000000000000000000000000000000000000000000000') break;
      try {
        ids.push(ethers.decodeBytes32String(id));
      } catch {
        ids.push(id);
      }
    } catch { break; }
  }
  return ids;
}

export async function getBatchCount() {
  return (await getAllBatchIds()).length;
}

function statusToString(status) {
  const map = ['Created', 'Farming', 'Submitted', 'Processing', 'Processed', 'Transporting', 'Delivered', 'Stored', 'OnSale', 'SoldOut', 'Expired', 'Abnormal'];
  return map[status] || 'Unknown';
}

export async function getBatchDetail(batchId) {
  const raw = await getBatchRaw(batchId);
  const bizStatus = raw.businessStatus ?? raw.status;
  return {
    batchId: raw.batchId,
    productName: raw.productName,
    origin: raw.origin,
    category: raw.category,
    quantity: Number(raw.quantity),
    farmer: raw.farmer,
    status: statusToString(bizStatus),
    statusCode: Number(bizStatus),
    chainStatusCode: Number(raw.chainStatusCode ?? -1),
    createdAt: Number(raw.createdAt),
    updatedAt: Number(raw.updatedAt),
    checkResult: raw.checkResult || '',
    fileHash: raw.fileHash || '',
    processTime: Number(raw.processTime || 0),
    processType: raw.processType || '',
    processOperator: raw.processOperator || '',
  };
}

export async function getBatchTimeline(batchId) {
  // 解析 chainBatchId：字符串 ID → 链上 bytes32
  let chainBatchId = batchId;
  try {
    const batch = await farmerStore.getBatch(batchId);
    if (batch?.chainBatchId) chainBatchId = batch.chainBatchId;
  } catch { /* 非农户批次则直接用原 ID */ }

  const t = await fiscoClient.callReadOnly('TraceManager', 'queryTimeline', [chainBatchId]);
  const [farmTime, processTime, logisticsTime, retailTime] = Array.isArray(t) ? t : [0, 0, 0, 0];
  const timeline = [];

  if (farmTime) {
    timeline.push({
      stage: '农事记录', time: Number(farmTime), actor: '',
      description: '', fileHash: '', completed: true,
    });
  }
  if (processTime) {
    timeline.push({
      stage: '加工质检', time: Number(processTime), actor: '',
      description: '', fileHash: '', completed: true,
    });
  }
  if (logisticsTime) {
    timeline.push({
      stage: '物流运输', time: Number(logisticsTime), actor: '',
      description: '', fileHash: '', completed: true,
    });
  }
  if (retailTime) {
    timeline.push({
      stage: '零售记录', time: Number(retailTime), actor: '',
      description: '', fileHash: '', completed: true,
    });
  }

  timeline.sort((a, b) => a.time - b.time);
  return timeline;
}

// 合约原始状态（0-6）用于角色看板过滤
// 0=CREATED, 1=FARM_RECORDED, 2=PROCESS_RECORDED,
// 3=LOGISTICS_RECORDED, 4=RETAIL_RECORDED, 5=EXPIRED, 6=SOLD
const DASHBOARD_POOLS = {
  FARMER: [0, 1],         // CREATED → FARM_RECORDED（待提交 + 待加工）
  PROCESSOR: [1, 2],      // FARM_RECORDED → PROCESS_RECORDED（显示全部，前端按状态控制按钮）
  LOGISTICS: [2, 3],      // PROCESS_RECORDED → LOGISTICS_RECORDED
  RETAIL: [3, 4],         // LOGISTICS_RECORDED → RETAIL_RECORDED
};

const DASHBOARD_LABELS = {
  0: '待提交农事', 1: '待加工', 2: '已加工',
  3: '待运输', 4: '已完成', 5: '已过期', 6: '已售罄',
};

const DASHBOARD_STATUS_NAMES = {
  0: 'Created', 1: 'FarmRecorded', 2: 'ProcessRecorded',
  3: 'LogisticsRecorded', 4: 'RetailRecorded', 5: 'Expired', 6: 'Sold',
};

export async function getDashboardBatches(role) {
  try {
    const range = DASHBOARD_POOLS[role] || [0, 6];
    const dbRows = await BatchIndex.findAll({
      where: { currentState: { [Op.between]: range } },
      order: [['createdAt', 'DESC']],
      limit: 200,
    });

    // 批量查询创建者用户名
    const addresses = [...new Set(dbRows.map((r) => r.createdBy).filter(Boolean))];
    const users = addresses.length
      ? await User.findAll({ where: { address: addresses }, attributes: ['address', 'username'] })
      : [];
    const userMap = {};
    for (const u of users) userMap[u.address.toLowerCase()] = u.username;

    return dbRows.map((r) => {
      const d = r.get({ plain: true });
      const s = Number(d.currentState ?? 0);
      return {
        id: d.batchId,
        product: d.productName || '',
        origin: d.origin || '',
        farmer: userMap[(d.createdBy || '').toLowerCase()] || '',
        status: DASHBOARD_STATUS_NAMES[s] || 'Unknown',
        statusLabel: DASHBOARD_LABELS[s] || '未知',
        statusCode: s,
        chainStatusCode: s,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).getTime() : 0,
      };
    });
  } catch {
    return [];
  }
}
