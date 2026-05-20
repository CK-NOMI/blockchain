import fiscoClient from './fiscoClient.js';

export async function createBatch(batchId, productName, origin, category, quantity) {
  return fiscoClient.callContract('TraceManager', 'createBatch', [
    batchId, productName, origin, category, quantity,
  ]);
}

export async function addFarmRecord(batchId, recordType, description, fileHash) {
  return fiscoClient.callContract('TraceManager', 'addFarmRecord', [
    batchId, recordType, description, fileHash || '',
  ]);
}

export async function addProcessRecord(batchId, processType, description, reportHash) {
  return fiscoClient.callContract('TraceManager', 'addProcessRecord', [
    batchId, processType, description, reportHash || '',
  ]);
}

export async function addLogisticsRecord(batchId, vehicleInfo, routeInfo, tempHumidity, fileHash) {
  return fiscoClient.callContract('TraceManager', 'addLogisticsRecord', [
    batchId, vehicleInfo, routeInfo, tempHumidity, fileHash || '',
  ]);
}

export async function addRetailRecord(batchId, storeLocation, saleStatus, fileHash) {
  return fiscoClient.callContract('TraceManager', 'addRetailRecord', [
    batchId, storeLocation, saleStatus, fileHash || '',
  ]);
}

export async function updateBatchStatus(batchId, newStatus) {
  return fiscoClient.callContract('TraceManager', 'updateBatchStatus', [batchId, newStatus]);
}

export async function markBatchAbnormal(batchId) {
  return fiscoClient.callContract('TraceManager', 'markAbnormal', [batchId]);
}

export async function getBatchRaw(batchId) {
  return fiscoClient.callReadOnly('TraceManager', 'getBatchDetail', [batchId]);
}

export async function getFarmRecords(batchId) {
  return fiscoClient.callReadOnly('TraceManager', 'getFarmRecords', [batchId]);
}

export async function getProcessRecords(batchId) {
  return fiscoClient.callReadOnly('TraceManager', 'getProcessRecords', [batchId]);
}

export async function getLogisticsRecords(batchId) {
  return fiscoClient.callReadOnly('TraceManager', 'getLogisticsRecords', [batchId]);
}

export async function getRetailRecords(batchId) {
  return fiscoClient.callReadOnly('TraceManager', 'getRetailRecords', [batchId]);
}

export async function verifyFileHash(batchId, fileHash) {
  return fiscoClient.callReadOnly('TraceManager', 'verifyFileHash', [batchId, fileHash]);
}

export async function getBatchesByFarmer(farmerAddr) {
  return fiscoClient.callReadOnly('TraceManager', 'getBatchesByFarmer', [farmerAddr]);
}

export async function getAllBatchIds() {
  return fiscoClient.callReadOnly('TraceManager', 'getAllBatchIds', []);
}

export async function getBatchCount() {
  return fiscoClient.callReadOnly('TraceManager', 'getBatchCount', []);
}

function statusToString(status) {
  const map = ['Created', 'Farming', 'Submitted', 'Processing', 'Processed', 'Transporting', 'Delivered', 'Stored', 'OnSale', 'SoldOut', 'Abnormal'];
  return map[status] || 'Unknown';
}

export async function getBatchDetail(batchId) {
  const raw = await getBatchRaw(batchId);
  return {
    batchId: raw.batchId,
    productName: raw.productName,
    origin: raw.origin,
    category: raw.category,
    quantity: Number(raw.quantity),
    farmer: raw.farmer,
    status: statusToString(raw.status),
    statusCode: Number(raw.status),
    createdAt: Number(raw.createdAt),
    updatedAt: Number(raw.updatedAt),
  };
}

export async function getBatchTimeline(batchId) {
  const [batch, fRecords, pRecords, lRecords, rRecords] = await Promise.all([
    getBatchRaw(batchId),
    getFarmRecords(batchId).catch(() => []),
    getProcessRecords(batchId).catch(() => []),
    getLogisticsRecords(batchId).catch(() => []),
    getRetailRecords(batchId).catch(() => []),
  ]);

  const timeline = [];

  timeline.push({
    stage: '批次创建',
    time: Number(batch.createdAt),
    actor: batch.farmer,
    description: `创建批次 ${batch.batchId}`,
    fileHash: '',
    completed: true,
  });

  for (const r of fRecords) {
    timeline.push({
      stage: `农事记录 - ${r.recordType}`,
      time: Number(r.timestamp),
      actor: r.operator,
      description: r.description,
      fileHash: r.fileHash,
      completed: true,
    });
  }

  for (const r of pRecords) {
    timeline.push({
      stage: `加工质检 - ${r.processType}`,
      time: Number(r.timestamp),
      actor: r.operator,
      description: r.description,
      fileHash: r.reportHash,
      completed: true,
    });
  }

  for (const r of lRecords) {
    timeline.push({
      stage: '物流运输记录',
      time: Number(r.timestamp),
      actor: r.operator,
      description: `${r.vehicleInfo} | ${r.routeInfo}`,
      fileHash: r.fileHash,
      completed: true,
    });
  }

  for (const r of rRecords) {
    timeline.push({
      stage: `零售记录 - ${r.saleStatus}`,
      time: Number(r.timestamp),
      actor: r.operator,
      description: r.storeLocation,
      fileHash: r.fileHash,
      completed: true,
    });
  }

  timeline.sort((a, b) => a.time - b.time);
  return timeline;
}

const STATUS_POOLS = {
  FARMER: [0, 2],
  PROCESSOR: [2, 4],
  LOGISTICS: [4, 6],
  RETAIL: [6, 8],
};

export async function getDashboardBatches(role) {
  try {
    const allIds = await getAllBatchIds();
    const statusRange = STATUS_POOLS[role] || [0, 10];
    const result = [];
    for (const id of allIds.slice(-20)) {
      try {
        const batch = await getBatchRaw(id);
        const s = Number(batch.status);
        if (s >= statusRange[0] && s <= (statusRange[1] || statusRange[0])) {
          result.push({
            id: batch.batchId,
            product: batch.productName,
            origin: batch.origin,
            farmer: batch.farmer,
            status: statusToString(s),
            statusCode: s,
            updatedAt: Number(batch.updatedAt),
          });
        }
      } catch { /* skip */ }
    }
    return result;
  } catch {
    return [];
  }
}
