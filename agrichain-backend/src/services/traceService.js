import { ethers } from 'ethers';
import { Op } from 'sequelize';
import fiscoClient from './fiscoClient.js';
import * as farmerStore from './farmerStore.js';
import BatchIndex from '../models/BatchIndex.js';
import FarmDetail from '../models/FarmDetail.js';
import ProcessRecord from '../models/ProcessRecord.js';
import LogisticsDetail from '../models/LogisticsDetail.js';
import RetailDetail from '../models/RetailDetail.js';
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


function _ts(value) {
  if (!value) return 0;
  const d = value instanceof Date ? value : new Date(value);
  const n = d.getTime();
  return Number.isFinite(n) ? n : 0;
}

function _statusName(status) {
  const names = ['Created', 'FarmRecorded', 'ProcessRecorded', 'LogisticsRecorded', 'RetailRecorded', 'Expired', 'Sold', 'Abnormal'];
  return names[Number(status)] || 'Unknown';
}

async function getDbBatchDetail(batchId) {
  const row = await BatchIndex.findOne({ where: { batchId } });
  if (!row) return null;
  const b = row.get({ plain: true });
  const [farm, process, logistics, retail] = await Promise.all([
    FarmDetail.findOne({ where: { batchId }, order: [['createdAt', 'DESC']] }).catch(() => null),
    ProcessRecord.findOne({ where: { batchId }, order: [['createdAt', 'DESC']] }).catch(() => null),
    LogisticsDetail.findOne({ where: { batchId }, order: [['createdAt', 'DESC']] }).catch(() => null),
    RetailDetail.findOne({ where: { batchId }, order: [['createdAt', 'DESC']] }).catch(() => null),
  ]);
  const f = farm?.get ? farm.get({ plain: true }) : {};
  const p = process?.get ? process.get({ plain: true }) : {};
  const l = logistics?.get ? logistics.get({ plain: true }) : {};
  const r = retail?.get ? retail.get({ plain: true }) : {};
  const updated = Math.max(_ts(b.updatedAt), _ts(f.createdAt), _ts(p.createdAt), _ts(l.createdAt), _ts(r.createdAt));
  return {
    batchId: b.batchId,
    productName: b.productName || '',
    origin: b.origin || '',
    category: b.category || '',
    variety: b.variety || '',
    quantity: Number(b.quantity || 0),
    farmer: f.principalName || b.createdBy || '',
    status: _statusName(b.currentState),
    statusCode: Number(b.currentState ?? 0),
    chainStatusCode: Number(b.currentState ?? 0),
    createdAt: _ts(b.createdAt),
    updatedAt: updated || _ts(b.createdAt),
    plantDate: f.plantDate || '',
    sowingDate: f.sowingDate || '',
    harvestDate: f.harvestDate || '',
    fertilizerRecord: f.fertilizerRecord || '',
    pesticideRecord: f.pesticideRecord || '',
    principalName: f.principalName || '',
    checkResult: p.description || '',
    fileHash: p.reportHash || b.fileHash || '',
    reportFile: b.reportFile || '',
    processTime: _ts(p.createdAt),
    processType: p.processType || '',
    processOperator: p.operator || '',
    vehicleInfo: l.vehicleInfo || '',
    routeInfo: l.routeInfo || '',
    tempHumidity: l.tempHumidity || '',
    logisticsTime: _ts(l.createdAt),
    storeLocation: r.storeLocation || '',
    saleStatus: r.saleStatus || '',
    retailTime: _ts(r.createdAt),
  };
}

async function getDbBatchTimeline(batchId) {
  const detail = await getDbBatchDetail(batchId);
  if (!detail) return [];
  const timeline = [];
  if (detail.createdAt) timeline.push({ stage: '批次创建', time: detail.createdAt, actor: detail.farmer || '', description: `创建批次 ${detail.productName}`, completed: true });
  if (detail.sowingDate || detail.harvestDate || detail.plantDate) timeline.push({ stage: '农事记录', time: detail.updatedAt, actor: detail.principalName || detail.farmer || '', description: `播种 ${detail.sowingDate || '--'}，采收 ${detail.harvestDate || '--'}`, completed: true });
  if (detail.processTime) timeline.push({ stage: '加工质检', time: detail.processTime, actor: detail.processOperator || '', description: detail.checkResult || detail.processType || '加工记录已提交', fileHash: detail.fileHash || '', completed: true });
  if (detail.logisticsTime) timeline.push({ stage: '物流运输', time: detail.logisticsTime, actor: detail.vehicleInfo || '', description: detail.routeInfo || detail.tempHumidity || '物流记录已提交', completed: true });
  if (detail.retailTime) timeline.push({ stage: '零售上架', time: detail.retailTime, actor: detail.storeLocation || '', description: detail.saleStatus || '零售记录已提交', completed: true });
  return timeline.sort((a, b) => Number(a.time || 0) - Number(b.time || 0));
}
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
  let raw;
  try {
    raw = await getBatchRaw(batchId);
  } catch (err) {
    const fallback = await getDbBatchDetail(batchId);
    if (fallback) return fallback;
    throw err;
  }
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
    checkResult: raw.checkResult || "",
    fileHash: raw.fileHash || "",
    processTime: Number(raw.processTime || 0),
    processType: raw.processType || "",
    processOperator: raw.processOperator || "",
  };
}

export async function getBatchTimeline(batchId) {
  let chainBatchId = batchId;
  try {
    const batch = await farmerStore.getBatch(batchId);
    if (batch?.chainBatchId) chainBatchId = batch.chainBatchId;
  } catch { /* 非农户批次则直接用原 ID */ }

  let t;
  try {
    t = await fiscoClient.callReadOnly("TraceManager", "queryTimeline", [chainBatchId]);
  } catch (err) {
    return getDbBatchTimeline(batchId);
  }
  const [farmTime, processTime, logisticsTime, retailTime] = Array.isArray(t) ? t : [0, 0, 0, 0];
  const timeline = [];

  if (farmTime) timeline.push({ stage: "农事记录", time: Number(farmTime), actor: "", description: "", fileHash: "", completed: true });
  if (processTime) timeline.push({ stage: "加工质检", time: Number(processTime), actor: "", description: "", fileHash: "", completed: true });
  if (logisticsTime) timeline.push({ stage: "物流运输", time: Number(logisticsTime), actor: "", description: "", fileHash: "", completed: true });
  if (retailTime) timeline.push({ stage: "零售记录", time: Number(retailTime), actor: "", description: "", fileHash: "", completed: true });

  return timeline.sort((a, b) => a.time - b.time);
}

// 合约原始状态（0-6）用于角色看板过滤
// 0=CREATED, 1=FARM_RECORDED, 2=PROCESS_RECORDED,
const ALL_DASHBOARD_STATES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 3=LOGISTICS_RECORDED, 4=RETAIL_RECORDED, 5=EXPIRED, 6=SOLD
// 工作台需要保留历史可见性：批次推进到后续阶段后，参与角色重新登录仍应能查看。
const DASHBOARD_POOLS = {
  FARMER: ALL_DASHBOARD_STATES,
  PROCESSOR: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  LOGISTICS: [2, 3, 4, 5, 6, 7, 8, 9, 10],
  RETAIL: [3, 4, 5, 6, 7, 8, 9, 10],
};

const DASHBOARD_LABELS = {
  0: '待提交农事', 1: '待加工', 2: '已加工',
  3: '待入库', 4: '已入库', 5: '已过期', 6: '已售罄',
  7: '已入库', 8: '已上架', 9: '已售罄', 10: '异常',
};

const DASHBOARD_STATUS_NAMES = {
  0: 'Created', 1: 'FarmRecorded', 2: 'ProcessRecorded',
  3: 'LogisticsRecorded', 4: 'RetailRecorded', 5: 'Expired', 6: 'Sold',
  7: 'Stored', 8: 'OnSale', 9: 'SoldOut', 10: 'Abnormal',
};

export async function getDashboardBatches(role) {
  try {
    const states = DASHBOARD_POOLS[role] || ALL_DASHBOARD_STATES;
    const dbRows = await BatchIndex.findAll({
      where: { currentState: { [Op.in]: states } },
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

    const rows = dbRows.map((r) => {
      const d = r.get({ plain: true });
      const s = Number(d.currentState ?? 0);
      return {
        id: d.batchId,
        batchId: d.batchId,
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

    try {
      const seen = new Set(rows.map((r) => r.id));
      const farmerBatches = await farmerStore.getAllBatches();
      for (const b of farmerBatches) {
        const s = Number(b.currentState ?? 0);
        if (!states.includes(s) || seen.has(b.batchId)) continue;
        seen.add(b.batchId);
        rows.push({
          id: b.batchId,
          batchId: b.batchId,
          product: b.productName || '',
          origin: b.origin || '',
          farmer: b.principalName || '',
          status: DASHBOARD_STATUS_NAMES[s] || 'Unknown',
          statusLabel: DASHBOARD_LABELS[s] || '未知',
          statusCode: s,
          chainStatusCode: s,
          updatedAt: Number(b.updatedAt || b.createdAt || 0),
        });
      }
    } catch { /* farmerStore fallback is best effort */ }

    return rows
      .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
      .slice(0, 200);
  } catch {
    return [];
  }
}
