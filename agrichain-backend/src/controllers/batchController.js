import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { calculateFileHash } from '../services/fileService.js';
import * as traceService from '../services/traceService.js';
import * as farmerStore from '../services/farmerStore.js';
import * as farmerChain from '../services/farmerChainAdapter.js';
import logger from '../utils/logger.js';

const MSG_FILE_REQUIRED = '\u8bf7\u9009\u62e9\u6587\u4ef6';
const MSG_FILE_UPLOAD_SUCCESS = '\u6587\u4ef6\u4e0a\u4f20\u6210\u529f';
const MSG_FILE_UPLOAD_FAILED = '\u6587\u4ef6\u4e0a\u4f20\u5931\u8d25';
const MSG_NO_CHAIN_DATA = '\u94fe\u4e0a\u6682\u65e0\u6570\u636e';
const MSG_BATCH_NOT_FOUND = '\u6279\u6b21\u4e0d\u5b58\u5728';
const MSG_BATCH_CREATE_SUCCESS = '\u6279\u6b21\u521b\u5efa\u6210\u529f';
const MSG_BATCH_CREATE_FAILED = '\u521b\u5efa\u6279\u6b21\u5931\u8d25';
const MSG_BATCH_ID_EMPTY = '\u6279\u6b21\u53f7\u4e0d\u80fd\u4e3a\u7a7a';
const MSG_BATCH_ID_INVALID = '\u6279\u6b21\u53f7\u683c\u5f0f\u4e0d\u5408\u6cd5';
const MSG_BATCH_ID_EXISTS = '\u6279\u6b21\u53f7\u5df2\u5b58\u5728';
const MSG_BATCH_ID_GENERATE_FAILED = '\u65e0\u6cd5\u751f\u6210\u6279\u6b21\u53f7';
const MSG_PRODUCT_NAME_EMPTY = '\u4ea7\u54c1\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a';
const MSG_DATE_INVALID = '\u65e5\u671f\u53c2\u6570\u4e0d\u5408\u6cd5';
const MSG_QUANTITY_INVALID = '\u6570\u91cf\u53c2\u6570\u4e0d\u5408\u6cd5';
const MSG_FARM_RECORD_EMPTY = '\u519c\u4e8b\u8bb0\u5f55\u4e0d\u80fd\u4e3a\u7a7a';
const MSG_FARM_RECORD_SUCCESS = '\u519c\u4e8b\u8bb0\u5f55\u63d0\u4ea4\u6210\u529f';
const MSG_FARM_RECORD_FAILED = '\u63d0\u4ea4\u5931\u8d25';
const MSG_FARM_RECORD_DUPLICATED = '\u519c\u6237\u9636\u6bb5\u5df2\u63d0\u4ea4\uff0c\u4e0d\u80fd\u91cd\u590d\u5f55\u5165';
const MSG_STATUS_UPDATE_SUCCESS = '\u72b6\u6001\u66f4\u65b0\u6210\u529f';
const MSG_STATUS_UPDATE_FAILED = '\u72b6\u6001\u66f4\u65b0\u5931\u8d25';
const MSG_SUBMIT_FAILED = '\u63d0\u4ea4\u5931\u8d25';
const FARM_RECORD_TYPE = 'FARM_INFO';
const BATCH_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{3,63}$/;

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function sendError(res, status, msg) {
  return res.status(status).json({ code: status, data: null, msg });
}

function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatDateTime(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return '';
  return new Date(numeric).toISOString().slice(0, 16).replace('T', ' ');
}

function formatTimeline(timeline = []) {
  return timeline.map((item) => ({
    ...item,
    time: formatDateTime(item.time),
  }));
}

function formatDashboardRow(batch) {
  return {
    id: batch.id || batch.batchId,
    product: batch.product || batch.productName || '',
    origin: batch.origin || '',
    owner: batch.owner || batch.farmer || '',
    status: batch.status,
    statusCode: batch.statusCode || '',
    chainStatusCode: batch.chainStatusCode ?? -1,
    statusClass: batch.statusClass || '',
    saleStatus: batch.saleStatus || '',
    updatedAt: typeof batch.updatedAt === 'number' ? formatDateTime(batch.updatedAt) : (batch.updatedAt || ''),
  };
}

function formatDetailResponse(detail, timeline) {
  return {
    ...detail,
    createdAt: formatDateTime(detail.createdAt),
    updatedAt: formatDateTime(detail.updatedAt),
    timeline: formatTimeline(timeline),
  };
}

function formatMutationResponse(detail, txResult, extra = {}) {
  const formattedDetail = detail
    ? {
        ...detail,
        createdAt: formatDateTime(detail.createdAt),
        updatedAt: formatDateTime(detail.updatedAt),
      }
    : {};

  return {
    ...formattedDetail,
    ...extra,
    txHash: txResult?.txHash || '',
    blockNumber: txResult?.blockNumber ?? null,
  };
}

function isValidDateString(value) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function toDateValue(value) {
  return new Date(`${value}T00:00:00.000Z`).getTime();
}

function validateDateFields(fields) {
  const { plantDate, sowingDate, harvestDate } = fields;
  if (!isValidDateString(plantDate) || !isValidDateString(sowingDate) || !isValidDateString(harvestDate)) {
    return false;
  }
  if (plantDate && sowingDate && toDateValue(plantDate) > toDateValue(sowingDate)) {
    return false;
  }
  if (harvestDate && sowingDate && toDateValue(harvestDate) < toDateValue(sowingDate)) {
    return false;
  }
  return true;
}

function normalizeFarmFields(body = {}) {
  return {
    plantDate: trimText(body.plantDate),
    sowingDate: trimText(body.sowingDate),
    harvestDate: trimText(body.harvestDate),
    fertilizerRecord: trimText(body.fertilizerRecord),
    pesticideRecord: trimText(body.pesticideRecord),
    principalName: trimText(body.principalName),
    fileHash: trimText(body.fileHash),
  };
}

function hasFarmInput(fields) {
  // 必填字段：sowingDate、harvestDate、principalName
  if (!fields.sowingDate || !fields.harvestDate || !fields.principalName) {
    return false;
  }
  return true;
}

const MSG_FARM_REQUIRED_FIELDS = '\u64ad\u79cd\u65e5\u671f\u3001\u91c7\u6536\u65e5\u671f\u3001\u8d23\u4efb\u4eba\u4e3a\u5fc5\u586b\u9879';

function buildFarmDescription(fields) {
  return [
    `\u79cd\u690d\u65f6\u95f4:${fields.plantDate || '\u672a\u8bb0\u5f55'}`,
    `\u64ad\u79cd\u65e5\u671f:${fields.sowingDate}`,
    `\u91c7\u6536\u65e5\u671f:${fields.harvestDate}`,
    `\u65bd\u80a5:${fields.fertilizerRecord || '\u672a\u8bb0\u5f55'}`,
    `\u519c\u836f:${fields.pesticideRecord || '\u672a\u8bb0\u5f55'}`,
    `\u8d23\u4efb\u4eba:${fields.principalName}`,
  ].join(';');
}

function isDuplicateBatchError(err) {
  const message = String(err?.message || '');
  return message.includes('batch already exists') || message.includes('already exists');
}

function isBatchNotFoundError(err) {
  const message = String(err?.message || '');
  return message.includes('batch not found') || message.includes('not found');
}

function isFarmStageSubmitted(detail, farmRecords) {
  const records = Array.isArray(farmRecords) ? farmRecords : Array.from(farmRecords || []);
  const statusCode = Number(detail?.chainStatusCode ?? -1);
  const sc = String(detail?.statusCode || '');
  // 只要已有农事记录，或状态已不是 Created，就禁止再次提交
  if (records.length > 0) return true;
  if (statusCode >= 1) return true;
  if (sc && sc !== 'Created') return true;
  return false;
}

async function batchExistsOnChain(batchId) {
  try {
    const batch = await traceService.getBatchRaw(batchId);
    return Boolean(batch?.batchId);
  } catch {
    return false;
  }
}

function generateBatchId() {
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const random = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `BATCH_${timestamp}_${random}`;
}

async function resolveBatchId(body = {}) {
  const hasBatchId = Object.prototype.hasOwnProperty.call(body, 'batchId');
  if (hasBatchId) {
    const batchId = trimText(body.batchId);
    if (!batchId) {
      return { error: { status: 400, msg: MSG_BATCH_ID_EMPTY } };
    }
    if (!BATCH_ID_PATTERN.test(batchId)) {
      return { error: { status: 400, msg: MSG_BATCH_ID_INVALID } };
    }
    if (await batchExistsOnChain(batchId)) {
      return { error: { status: 409, msg: MSG_BATCH_ID_EXISTS } };
    }
    return { batchId };
  }

  for (let i = 0; i < 5; i += 1) {
    const candidate = generateBatchId();
    if (!(await batchExistsOnChain(candidate))) {
      return { batchId: candidate };
    }
  }

  return { error: { status: 500, msg: MSG_BATCH_ID_GENERATE_FAILED } };
}

export const uploadFile = [
  upload.single('file'),
  async (req, res) => {
    try {
      const { batchId } = req.params;
      if (!req.file) {
        return sendError(res, 400, MSG_FILE_REQUIRED);
      }

      const fileHash = await calculateFileHash(req.file.path);
      logger.info({ batchId, fileName: req.file.originalname, fileHash }, 'file uploaded');

      return res.json({
        code: 0,
        data: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileHash,
          filePath: `/uploads/${req.file.filename}`,
          uploadedAt: new Date().toISOString(),
        },
        msg: MSG_FILE_UPLOAD_SUCCESS,
      });
    } catch (err) {
      logger.error(err, 'upload file failed');
      return sendError(res, 500, MSG_FILE_UPLOAD_FAILED);
    }
  },
];

export async function getDashboard(req, res) {
  try {
    const { role } = req.query;

    // 4号农户模块：优先从链下 farmerStore 读取
    if (role === 'FARMER' || !role) {
      const farmerBatches = farmerStore.getAllBatches();
      const rows = farmerBatches.map((b) => ({
        id: b.batchId,
        product: b.productName || '',
        origin: b.origin || '',
        owner: b.principalName || '',
        status: b.farmSubmitted ? '\u519c\u4e8b\u8bb0\u5f55\u5df2\u63d0\u4ea4' : '\u6279\u6b21\u5df2\u521b\u5efa',
        statusCode: b.farmSubmitted ? 'FarmRecorded' : 'Created',
        chainStatusCode: b.farmSubmitted ? 1 : 0,
        statusClass: b.farmSubmitted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
        updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString().slice(0, 16).replace('T', ' ') : '',
      }));
      rows.reverse();
      return res.json({ code: 0, data: rows, msg: 'ok' });
    }

    // 其他角色走原逻辑
    const batches = await traceService.getDashboardBatches(role);
    const rows = batches.map(formatDashboardRow);
    return res.json({ code: 0, data: rows, msg: 'ok' });
  } catch (err) {
    logger.error(err, 'get dashboard failed');
    return res.json({ code: 0, data: [], msg: MSG_NO_CHAIN_DATA });
  }
}

export async function getBatchList(_req, res) {
  try {
    // 优先从 farmerStore 读取农户批次
    const farmerBatches = farmerStore.getAllBatches();
    const farmerRows = farmerBatches.map((b) => ({
      id: b.batchId,
      product: b.productName || '',
      origin: b.origin || '',
      owner: b.principalName || '',
      status: b.farmSubmitted ? '\u519c\u4e8b\u8bb0\u5f55\u5df2\u63d0\u4ea4' : '\u6279\u6b21\u5df2\u521b\u5efa',
      statusCode: b.farmSubmitted ? 'FarmRecorded' : 'Created',
      chainStatusCode: b.farmSubmitted ? 1 : 0,
      statusClass: b.farmSubmitted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
      updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString().slice(0, 16).replace('T', ' ') : '',
    })).reverse();

    // 合并其他模块的批次（fallback）
    let otherRows = [];
    try {
      const allIds = await traceService.getAllBatchIds();
      for (const id of Array.from(allIds || []).slice(-50)) {
        if (farmerBatches.some((b) => b.chainBatchId === id || b.batchId === id)) continue;
        try {
          const detail = await traceService.getBatchDetail(id);
          otherRows.push(formatDashboardRow(detail));
        } catch { /* skip */ }
      }
    } catch { /* chain unavailable, skip */ }

    return res.json({ code: 0, data: [...farmerRows, ...otherRows], msg: 'ok' });
  } catch (err) {
    logger.error(err, 'get batch list failed');
    return res.json({ code: 0, data: [], msg: MSG_NO_CHAIN_DATA });
  }
}

export async function getBatchDetail(req, res) {
  try {
    const { batchId } = req.params;

    // 4号农户模块：优先从链下 farmerStore 读取
    const farmerBatch = farmerStore.getBatch(batchId);
    if (farmerBatch) {
      const now = farmerBatch.updatedAt || farmerBatch.createdAt || Date.now();
      const timeline = [
        {
          stage: '\u6279\u6b21\u521b\u5efa',
          time: new Date(farmerBatch.createdAt).toISOString().slice(0, 16).replace('T', ' '),
          detail: `\u521b\u5efa\u6279\u6b21\uff0c\u4ea7\u54c1\uff1a${farmerBatch.productName}\uff0c\u4ea7\u5730\uff1a${farmerBatch.origin}`,
          txHash: '',
        },
      ];
      if (farmerBatch.farmSubmitted) {
        timeline.push({
          stage: '\u519c\u6237\u9636\u6bb5',
          time: new Date(farmerBatch.updatedAt).toISOString().slice(0, 16).replace('T', ' '),
          detail: `\u63d0\u4ea4\u519c\u4e8b\u8bb0\u5f55\uff1a\u64ad\u79cd${farmerBatch.sowingDate || '--'}\u3001\u91c7\u6536${farmerBatch.harvestDate || '--'}\uff0c\u8d23\u4efb\u4eba\uff1a${farmerBatch.principalName}`,
          txHash: farmerBatch.txHash || '',
        });
      }

      return res.json({
        code: 0,
        data: {
          batchId: farmerBatch.batchId,
          productName: farmerBatch.productName,
          origin: farmerBatch.origin,
          category: farmerBatch.category,
          variety: farmerBatch.variety,
          quantity: farmerBatch.quantity,
          plantDate: farmerBatch.plantDate,
          sowingDate: farmerBatch.sowingDate,
          harvestDate: farmerBatch.harvestDate,
          fertilizerRecord: farmerBatch.fertilizerRecord,
          pesticideRecord: farmerBatch.pesticideRecord,
          principalName: farmerBatch.principalName,
          farmer: farmerBatch.principalName,
          owner: farmerBatch.principalName,
          chainBatchId: farmerBatch.chainBatchId || '',
          txHash: farmerBatch.txHash || '',
          blockNumber: farmerBatch.blockNumber,
          status: farmerBatch.farmSubmitted ? '\u519c\u4e8b\u8bb0\u5f55\u5df2\u63d0\u4ea4' : '\u6279\u6b21\u5df2\u521b\u5efa',
          statusCode: farmerBatch.farmSubmitted ? 'FarmRecorded' : 'Created',
          chainStatusCode: farmerBatch.farmSubmitted ? 1 : 0,
          statusClass: farmerBatch.farmSubmitted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
          createdAt: new Date(farmerBatch.createdAt).toISOString().slice(0, 16).replace('T', ' '),
          updatedAt: new Date(now).toISOString().slice(0, 16).replace('T', ' '),
          timeline,
        },
        msg: 'ok',
      });
    }

    // fallback：其他模块创建的批次走原逻辑
    const [detail, timeline] = await Promise.all([
      traceService.getBatchDetail(batchId),
      traceService.getBatchTimeline(batchId).catch(() => []),
    ]);

    return res.json({
      code: 0,
      data: formatDetailResponse(detail, timeline),
      msg: 'ok',
    });
  } catch (err) {
    logger.error(err, 'get batch detail failed');
    return sendError(res, 404, MSG_BATCH_NOT_FOUND);
  }
}

export async function createBatch(req, res) {
  try {
    const { productName, origin, category } = req.body;
    const normalizedProductName = trimText(productName);
    const normalizedOrigin = trimText(origin);
    const normalizedCategory = trimText(category);
    const quantity = req.body.quantity === undefined || req.body.quantity === null || req.body.quantity === ''
      ? 0
      : Number(req.body.quantity);
    const farmFields = normalizeFarmFields(req.body);

    if (!normalizedProductName) {
      return sendError(res, 400, MSG_PRODUCT_NAME_EMPTY);
    }
    if (!normalizedOrigin) {
      return sendError(res, 400, '\u4ea7\u5730\u4e0d\u80fd\u4e3a\u7a7a');
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      return sendError(res, 422, MSG_QUANTITY_INVALID);
    }
    if (!validateDateFields(farmFields)) {
      return sendError(res, 422, MSG_DATE_INVALID);
    }

    // 生成字符串 batchId（不查链上，只查链下是否重复）
    const finalBatchId = generateBatchId();
    if (farmerStore.getBatch(finalBatchId)) {
      return sendError(res, 409, MSG_BATCH_ID_EXISTS);
    }

    // 只存链下草稿，不上链
    const now = Date.now();
    farmerStore.saveBatch({
      batchId: finalBatchId,
      chainBatchId: '',
      nonce: 0,
      productName: normalizedProductName,
      variety: normalizedCategory,
      origin: normalizedOrigin,
      category: normalizedCategory,
      quantity,
      plantDate: farmFields.plantDate || '',
      sowingDate: '',
      harvestDate: '',
      fertilizerRecord: '',
      pesticideRecord: '',
      principalName: '',
      fileHash: '',
      farmSubmitted: false,
      txHash: '',
      blockNumber: null,
      createdAt: now,
      updatedAt: now,
    });

    logger.info({ batchId: finalBatchId, productName: normalizedProductName }, 'batch created (off-chain draft)');

    return res.json({
      code: 0,
      data: {
        batchId: finalBatchId,
        productName: normalizedProductName,
        origin: normalizedOrigin,
        category: normalizedCategory,
        quantity,
        status: '\u6279\u6b21\u5df2\u521b\u5efa',
        statusCode: 'Created',
        chainStatusCode: 0,
        statusClass: 'bg-amber-100 text-amber-700',
        chainPending: true,
        createdAt: new Date(now).toISOString().slice(0, 16).replace('T', ' '),
        updatedAt: new Date(now).toISOString().slice(0, 16).replace('T', ' '),
      },
      msg: MSG_BATCH_CREATE_SUCCESS,
    });
  } catch (err) {
    logger.error(err, 'create batch failed');
    return sendError(res, 500, MSG_BATCH_CREATE_FAILED);
  }
}

export async function addFarmRecord(req, res) {
  try {
    const batchId = trimText(req.params.batchId);
    const farmFields = normalizeFarmFields(req.body);

    if (!batchId) {
      return sendError(res, 400, MSG_BATCH_ID_EMPTY);
    }
    if (!hasFarmInput(farmFields)) {
      return sendError(res, 400, MSG_FARM_REQUIRED_FIELDS);
    }
    if (!validateDateFields(farmFields)) {
      return sendError(res, 422, MSG_DATE_INVALID);
    }

    // 从链下存储读取批次
    const batch = farmerStore.getBatch(batchId);
    if (!batch) {
      return sendError(res, 404, MSG_BATCH_NOT_FOUND);
    }

    // 重复提交保护
    if (batch.farmSubmitted) {
      return sendError(res, 409, MSG_FARM_RECORD_DUPLICATED);
    }

    // 链上角色预检查（区分「链不可达」和「无权限」）
    const { chainAvailable, isFarmer } = await farmerChain.checkFarmerRole();
    if (chainAvailable && !isFarmer) {
      return sendError(res, 403, '\u94fe\u4e0a\u8d26\u6237\u672a\u6388\u6743\u519c\u6237\u89d2\u8272\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458\u6388\u6743');
    }

    const plantDate = farmFields.plantDate || batch.plantDate || '';
    let bytes32Id = '';
    let nonce = 0;
    let txResult = null;

    if (chainAvailable) {
      // 链可达：走真实上链流程
      try {
        const chainIds = await farmerChain.generateChainBatchId(
          batch.productName, batch.origin, plantDate
        );
        bytes32Id = chainIds.bytes32Id;
        nonce = chainIds.nonce;
        txResult = await farmerChain.createBatchOnChain(
          bytes32Id,
          batch.productName,
          batch.variety || batch.category || '',
          batch.origin,
          plantDate,
          farmFields.harvestDate || ''
        );
      } catch (chainErr) {
        logger.warn({ batchId, error: chainErr.message }, 'on-chain write failed, falling back to off-chain');
        // 上链失败时降级为链下存储，不抛错
        bytes32Id = '';
        txResult = null;
      }
    } else {
      logger.info({ batchId }, 'chain unavailable, saving farm record off-chain only');
    }

    // 无论上链成功与否，都持久化到本地 JSON（核心：保证数据不丢失）
    const now = Date.now();
    farmerStore.saveBatch({
      ...batch,
      chainBatchId: bytes32Id,
      nonce,
      plantDate,
      sowingDate: farmFields.sowingDate || '',
      harvestDate: farmFields.harvestDate || '',
      fertilizerRecord: farmFields.fertilizerRecord || '\u672a\u8bb0\u5f55',
      pesticideRecord: farmFields.pesticideRecord || '\u672a\u8bb0\u5f55',
      principalName: farmFields.principalName || '',
      fileHash: farmFields.fileHash || '',
      farmSubmitted: true,
      txHash: txResult?.txHash || '',
      blockNumber: txResult?.blockNumber ?? null,
      updatedAt: now,
    });

    logger.info({ batchId, chainBatchId: bytes32Id, txHash: txResult?.txHash, chainAvailable }, 'farm record saved');

    return res.json({
      code: 0,
      data: {
        batchId,
        chainBatchId: bytes32Id,
        txHash: txResult?.txHash || '',
        blockNumber: txResult?.blockNumber ?? null,
        status: '\u519c\u4e8b\u8bb0\u5f55\u5df2\u63d0\u4ea4',
        statusCode: 'FarmRecorded',
        chainStatusCode: 1,
        statusClass: 'bg-emerald-100 text-emerald-700',
        chainPending: !txResult,
      },
      msg: MSG_FARM_RECORD_SUCCESS,
    });
  } catch (err) {
    logger.error(err, 'add farm record failed');
    if (err.message?.includes('\u672a\u6388\u6743')) {
      return sendError(res, 403, err.message);
    }
    return sendError(res, 500, MSG_FARM_RECORD_FAILED);
  }
}

export async function addProcessRecord(req, res) {
  try {
    const { batchId } = req.params;
    const { processType, description, reportHash } = req.body;
    const result = await traceService.addProcessRecord(batchId, processType, description, reportHash);
    logger.info({ batchId, processType }, 'process record added');
    return res.json({ code: 0, data: result, msg: '\u52a0\u5de5\u8bb0\u5f55\u63d0\u4ea4\u6210\u529f' });
  } catch (err) {
    return sendError(res, 500, MSG_SUBMIT_FAILED);
  }
}

export async function addLogisticsRecord(req, res) {
  try {
    const { batchId } = req.params;
    const { vehicleInfo, routeInfo, tempHumidity, fileHash } = req.body;
    const tempData = typeof tempHumidity === 'object' ? JSON.stringify(tempHumidity) : (tempHumidity || '');
    const result = await traceService.addLogisticsRecord(batchId, vehicleInfo, routeInfo, tempData, fileHash);
    logger.info({ batchId, vehicleInfo, routeInfo }, 'logistics record added');
    return res.json({ code: 0, data: result, msg: '\u7269\u6d41\u8bb0\u5f55\u63d0\u4ea4\u6210\u529f' });
  } catch (err) {
    return sendError(res, 500, MSG_SUBMIT_FAILED);
  }
}

export async function addRetailRecord(req, res) {
  try {
    const { batchId } = req.params;
    const { storeLocation, saleStatus, fileHash } = req.body;
    const result = await traceService.addRetailRecord(batchId, storeLocation, saleStatus, fileHash);
    logger.info({ batchId, storeLocation, saleStatus }, 'retail record added');
    return res.json({ code: 0, data: result, msg: '\u96f6\u552e\u8bb0\u5f55\u63d0\u4ea4\u6210\u529f' });
  } catch (err) {
    return sendError(res, 500, MSG_SUBMIT_FAILED);
  }
}

export async function updateBatchStatus(req, res) {
  try {
    const { batchId } = req.params;
    const { status } = req.body;
    const result = await traceService.updateBatchStatus(batchId, Number(status));
    logger.info({ batchId, newStatus: status }, 'batch status updated');
    return res.json({ code: 0, data: result, msg: MSG_STATUS_UPDATE_SUCCESS });
  } catch (err) {
    return sendError(res, 500, MSG_STATUS_UPDATE_FAILED);
  }
}
