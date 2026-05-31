import { BatchIndex, FarmDetail } from '../models/index.js';

export async function readStore() {
  const batches = {};
  const idList = [];
  const rows = await BatchIndex.findAll({ order: [['createdAt', 'ASC']] });
  // 批量预查 farm_detail
  const farmMap = {};
  try {
    const allFd = await FarmDetail.findAll({ order: [['createdAt', 'DESC']] });
    for (const fd of allFd) {
      if (!farmMap[fd.batchId]) {
        farmMap[fd.batchId] = {
          plantDate: fd.plantDate || '',
          sowingDate: fd.sowingDate || '',
          harvestDate: fd.harvestDate || '',
          fertilizerRecord: fd.fertilizerRecord || '',
          pesticideRecord: fd.pesticideRecord || '',
          principalName: fd.principalName || '',
        };
      }
    }
  } catch { /* ignore */ }
  for (const row of rows) {
    const b = row.get({ plain: true });
    const fm = farmMap[b.batchId] || {};
    const batch = {
      batchId: b.batchId,
      chainBatchId: b.chainBatchId,
      nonce: b.nonce,
      productName: b.productName,
      variety: b.variety,
      origin: b.origin,
      category: b.category,
      quantity: b.quantity,
      fileHash: b.fileHash || '',
      reportFile: b.reportFile || '',
      plantDate: fm.plantDate || '',
      sowingDate: fm.sowingDate || '',
      harvestDate: fm.harvestDate || '',
      fertilizerRecord: fm.fertilizerRecord || '',
      pesticideRecord: fm.pesticideRecord || '',
      principalName: fm.principalName || '',
      currentState: b.currentState || 0,
      transactionHash: b.transactionHash,
      blockNumber: b.blockNumber,
      createdAt: new Date(b.createdAt).getTime(),
      updatedAt: new Date(b.updatedAt).getTime(),
    };
    batches[b.batchId] = batch;
    idList.push(b.batchId);
  }
  return { batches, idList };
}

export async function getBatch(batchId) {
  const row = await BatchIndex.findOne({ where: { batchId } });
  if (!row) return null;
  const b = row.get({ plain: true });
  // 从 farm_detail 补充农事字段
  let plantDate = '', sowingDate = '', harvestDate = '', fertilizerRecord = '', pesticideRecord = '', principalName = '';
  try {
    const fd = await FarmDetail.findOne({ where: { batchId }, order: [['createdAt', 'DESC']] });
    if (fd) {
      plantDate = fd.plantDate || '';
      sowingDate = fd.sowingDate || '';
      harvestDate = fd.harvestDate || '';
      fertilizerRecord = fd.fertilizerRecord || '';
      pesticideRecord = fd.pesticideRecord || '';
      principalName = fd.principalName || '';
    }
  } catch { /* ignore */ }
  return {
    batchId: b.batchId,
    chainBatchId: b.chainBatchId,
    nonce: b.nonce,
    productName: b.productName,
    variety: b.variety,
    origin: b.origin,
    category: b.category,
    quantity: b.quantity,
    plantDate,
    sowingDate,
    harvestDate,
    fertilizerRecord,
    pesticideRecord,
    principalName,
    fileHash: b.fileHash || '',
    reportFile: b.reportFile || '',
    currentState: b.currentState || 0,
    transactionHash: b.transactionHash,
    blockNumber: b.blockNumber,
    createdAt: new Date(b.createdAt).getTime(),
    updatedAt: new Date(b.updatedAt).getTime(),
  };
}

export async function saveBatch(batch) {
  await BatchIndex.upsert({
    batchId: batch.batchId,
    chainBatchId: batch.chainBatchId || '',
    nonce: batch.nonce || 0,
    productName: batch.productName || '',
    variety: batch.variety || '',
    origin: batch.origin || '',
    category: batch.category || '',
    quantity: batch.quantity || 0,
    fileHash: batch.fileHash || '',
    reportFile: batch.reportFile || '',
    transactionHash: batch.transactionHash || '',
    blockNumber: batch.blockNumber ?? null,
    currentState: batch.currentState ?? 0,
    createdBy: batch.createdBy || '',
  });
}

export async function getAllIds() {
  const rows = await BatchIndex.findAll({ attributes: ['batchId'], order: [['createdAt', 'ASC']] });
  return rows.map((r) => r.batchId);
}

export async function isFarmSubmitted(batchId) {
  const batch = await getBatch(batchId);
  return batch ? (batch.currentState >= 1) : false;
}

export async function getAllBatches() {
  const store = await readStore();
  return store.idList.map((id) => store.batches[id]).filter(Boolean);
}
