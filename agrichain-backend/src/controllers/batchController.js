import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { calculateFileHash } from '../services/fileService.js';
import * as traceService from '../services/traceService.js';
import * as farmerStore from '../services/farmerStore.js';
import * as farmerChain from '../services/farmerChainAdapter.js';
import fiscoClient from '../services/fiscoClient.js';
import logger from '../utils/logger.js';
import { BatchIndex, FarmDetail, ProcessRecord, LogisticsDetail, RetailDetail } from '../models/index.js';

const MSG_FILE_REQUIRED = '请选择文件';
const MSG_FILE_UPLOAD_SUCCESS = '文件上传成功';
const MSG_FILE_UPLOAD_FAILED = '文件上传失败';
const MSG_NO_CHAIN_DATA = '链上暂无数据';
const MSG_BATCH_NOT_FOUND = '批次不存在';
const MSG_BATCH_CREATE_SUCCESS = '批次创建成功';
const MSG_BATCH_CREATE_FAILED = '创建批次失败';
const MSG_BATCH_ID_EMPTY = '批次号不能为空';
const MSG_BATCH_ID_INVALID = '批次号格式不合法';
const MSG_BATCH_ID_EXISTS = '批次号已存在';
const MSG_BATCH_ID_GENERATE_FAILED = '无法生成批次号';
const MSG_PRODUCT_NAME_EMPTY = '产品名称不能为空';
const MSG_DATE_INVALID = '日期参数不合法';
const MSG_QUANTITY_INVALID = '数量参数不合法';
const MSG_FARM_RECORD_EMPTY = '农事记录不能为空';
const MSG_FARM_RECORD_SUCCESS = '农事记录提交成功';
const MSG_FARM_RECORD_FAILED = '提交失败';
const MSG_FARM_RECORD_DUPLICATED = '农户阶段已提交，不能重复录入';
const MSG_STATUS_UPDATE_SUCCESS = '状态更新成功';
const MSG_STATUS_UPDATE_FAILED = '状态更新失败';
const MSG_SUBMIT_FAILED = '提交失败';
const FARM_RECORD_TYPE = 'FARM_INFO';
const BATCH_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{3,63}$/;

// 状态机显示映射（与链上 currentState 对应）
const STATE_LABELS = [
  { status: '批次已创建', code: 'Created', cls: 'bg-amber-100 text-amber-700' },
  { status: '农事记录已提交', code: 'FarmRecorded', cls: 'bg-emerald-100 text-emerald-700' },
  { status: '加工记录已提交', code: 'ProcessRecorded', cls: 'bg-emerald-100 text-emerald-700' },
  { status: '物流记录已提交', code: 'LogisticsRecorded', cls: 'bg-emerald-100 text-emerald-700' },
  { status: '零售记录已提交', code: 'RetailRecorded', cls: 'bg-emerald-100 text-emerald-700' },
  { status: '已过期', code: 'Expired', cls: 'bg-rose-100 text-rose-700' },
  { status: '已售出', code: 'Sold', cls: 'bg-slate-100 text-slate-700' },
  { status: '已入库', code: 'Stored', cls: 'bg-blue-100 text-blue-700' },
  { status: '已上架', code: 'OnSale', cls: 'bg-emerald-100 text-emerald-700' },
  { status: '已售罄', code: 'SoldOut', cls: 'bg-slate-100 text-slate-700' },
  { status: '异常', code: 'Abnormal', cls: 'bg-rose-100 text-rose-700' },
];
function stateInfo(s) {
  const label = STATE_LABELS[s] || STATE_LABELS[0];
  return { status: label.status, statusCode: label.code, chainStatusCode: s, statusClass: label.cls };
}

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
  return {    batchId: batch.batchId || batch.id,
    product: batch.product || batch.productName || '',
    origin: batch.origin || '',
    owner: batch.owner || batch.farmer || '',
    status: batch.status,
    statusLabel: batch.statusLabel || '',
    statusCode: batch.statusCode ?? '',
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
    transactionHash: txResult?.transactionHash || '',
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

const MSG_FARM_REQUIRED_FIELDS = '播种日期、采收日期、责任人为必填项';

function buildFarmDescription(fields) {
  return [
    `种植时间:${fields.plantDate || '未记录'}`,
    `播种日期:${fields.sowingDate}`,
    `采收日期:${fields.harvestDate}`,
    `施肥:${fields.fertilizerRecord || '未记录'}`,
    `农药:${fields.pesticideRecord || '未记录'}`,
    `责任人:${fields.principalName}`,
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
      const filePath = `/uploads/${req.file.filename}`;

      // 保存文件路径到 batch_index
      await BatchIndex.update({ reportFile: filePath, fileHash }, { where: { batchId } })
        .catch(err => logger.warn({ batchId, error: err.message }, 'batch_index reportFile 更新失败（非致命）'));

      logger.info({ batchId, fileName: req.file.originalname, fileHash }, 'file uploaded');

      return res.json({
        code: 0,
        data: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileHash,
          filePath,
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
      const farmerBatches = await farmerStore.getAllBatches();
      const rows = farmerBatches.map((b) => ({
        id: b.batchId,
        product: b.productName || '',
        origin: b.origin || '',
        owner: b.principalName || '',
        ...stateInfo(b.currentState || 0),
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
    const farmerBatches = await farmerStore.getAllBatches();
    const farmerRows = farmerBatches.map((b) => ({
      id: b.batchId,
      product: b.productName || '',
      origin: b.origin || '',
      owner: b.principalName || '',
      ...stateInfo(b.currentState || 0),
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
    // 获取当前最新区块高度（非致命）
    let latestBlockNumber = 0;
    try { latestBlockNumber = await fiscoClient.getBlockNumber(); } catch {}

    // 4号农户模块：优先从链下 farmerStore 读取
    const farmerBatch = await farmerStore.getBatch(batchId);
    if (farmerBatch) {
      const now = farmerBatch.updatedAt || farmerBatch.createdAt || Date.now();
      const timeline = [
        {
          stage: '批次创建',
          time: new Date(farmerBatch.createdAt).toISOString().slice(0, 16).replace('T', ' '),
          detail: `创建批次，产品：${farmerBatch.productName}，产地：${farmerBatch.origin}`,
          transactionHash: '',
        },
      ];
      if ((farmerBatch.currentState || 0) >= 1) {
        timeline.push({
          stage: '农户阶段',
          time: new Date(farmerBatch.updatedAt).toISOString().slice(0, 16).replace('T', ' '),
          detail: `提交农事记录：播种${farmerBatch.sowingDate || '--'}、采收${farmerBatch.harvestDate || '--'}，责任人：${farmerBatch.principalName}`,
          transactionHash: farmerBatch.transactionHash || '',
        });
      }
      if ((farmerBatch.currentState || 0) >= 2) {
        const pr = await ProcessRecord.findOne({ where: { batchId }, order: [['createdAt', 'DESC']] }).catch(() => null);
        timeline.push({
          stage: '加工完成',
          time: pr ? formatDateTime(pr.createdAt.getTime()) : formatDateTime(now),
          detail: '加工记录已提交',
          transactionHash: pr?.transactionHash || '',
        });
      }
      if ((farmerBatch.currentState || 0) >= 3) {
        const lr = await LogisticsDetail.findOne({ where: { batchId }, order: [['createdAt', 'DESC']] }).catch(() => null);
        timeline.push({
          stage: '物流阶段',
          time: lr ? formatDateTime(lr.createdAt.getTime()) : formatDateTime(now),
          detail: '物流记录已提交',
          transactionHash: lr?.transactionHash || '',
        });
      }
      if ((farmerBatch.currentState || 0) >= 4) {
        const rr = await RetailDetail.findOne({ where: { batchId }, order: [['createdAt', 'DESC']] }).catch(() => null);
        timeline.push({
          stage: '零售阶段',
          time: rr ? formatDateTime(rr.createdAt.getTime()) : formatDateTime(now),
          detail: '零售记录已提交',
          transactionHash: rr?.transactionHash || '',
        });
      }

      // 如果批次已加工（state >= 2），从链上获取质检数据和文件哈希
      let chainCheckResult = '', chainFileHash = '', chainProcessTime = 0;
      if ((farmerBatch.currentState || 0) >= 2) {
        try {
          const chainDetail = await traceService.getBatchDetail(batchId);
          chainCheckResult = chainDetail.checkResult || '';
          chainFileHash = chainDetail.fileHash || '';
          chainProcessTime = chainDetail.processTime || 0;
        } catch { /* 链不可达时忽略 */ }
      }
      // 从 ProcessRecord 获取加工方式和操作员
      const pr = (farmerBatch.currentState || 0) >= 2
        ? await ProcessRecord.findOne({ where: { batchId }, order: [['createdAt', 'DESC']] }).catch(() => null)
        : null;
      // 从 LogisticsDetail 获取物流信息
      const lr = (farmerBatch.currentState || 0) >= 3
        ? await LogisticsDetail.findOne({ where: { batchId }, order: [['createdAt', 'DESC']] }).catch(() => null)
        : null;

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
          transactionHash: farmerBatch.transactionHash || '',
          blockNumber: farmerBatch.blockNumber,
          latestBlockNumber,
          checkResult: chainCheckResult,
          fileHash: chainFileHash,
          reportFile: farmerBatch.reportFile || '',
          processTime: chainProcessTime,
          processType: pr?.processType || '',
          processOperator: pr?.operator || '',
          vehicleInfo: lr?.vehicleInfo || '',
          routeInfo: lr?.routeInfo || '',
          tempHumidity: lr?.tempHumidity || '',
          logisticsTxHash: lr?.transactionHash || '',
          ...stateInfo(farmerBatch.currentState || 0),
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

    // 从DB补充 reportFile / blockNumber / processType / logistics
    const dbRow = await BatchIndex.findOne({ where: { batchId }, attributes: ['reportFile', 'blockNumber'] }).catch(() => null);
    const fbPr = await ProcessRecord.findOne({ where: { batchId }, order: [['createdAt', 'DESC']] }).catch(() => null);
    const fbLr = await LogisticsDetail.findOne({ where: { batchId }, order: [['createdAt', 'DESC']] }).catch(() => null);

    return res.json({
      code: 0,
      data: {
        ...formatDetailResponse(detail, timeline),
        reportFile: dbRow?.reportFile || '',
        blockNumber: dbRow?.blockNumber ?? 0,
        latestBlockNumber,
        processType: fbPr?.processType || '',
        processOperator: fbPr?.operator || '',
        vehicleInfo: fbLr?.vehicleInfo || '',
        routeInfo: fbLr?.routeInfo || '',
        tempHumidity: fbLr?.tempHumidity || '',
        logisticsTxHash: fbLr?.transactionHash || '',
      },
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
      return sendError(res, 400, '产地不能为空');
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      return sendError(res, 422, MSG_QUANTITY_INVALID);
    }
    if (!validateDateFields(farmFields)) {
      return sendError(res, 422, MSG_DATE_INVALID);
    }

    // 生成批次号
    const finalBatchId = generateBatchId();
    if (await farmerStore.getBatch(finalBatchId)) {
      return sendError(res, 409, MSG_BATCH_ID_EXISTS);
    }

    // 上链
    let chainBatchId = '';
    let transactionHash = '';
    let blockNumber = null;
    try {
      const chainIds = await farmerChain.generateChainBatchId(
        normalizedProductName, normalizedOrigin, farmFields.plantDate || ''
      );
      chainBatchId = chainIds.bytes32Id;
      const txResult = await farmerChain.createBatchOnChain(
        chainIds.bytes32Id,
        normalizedProductName,
        normalizedCategory,
        normalizedOrigin,
        farmFields.plantDate || '',
        '', // harvestDate 创建时未知
        req.user.address
      );
      const txData = txResult.data || txResult;
      transactionHash = txData.transactionHash || '';
      blockNumber = txData.blockNumber != null ? txData.blockNumber : null;
    } catch (chainErr) {
      logger.warn({ batchId: finalBatchId, error: chainErr.message }, '上链失败，仅保存本地草稿');
    }

    // 存链下草稿（含链上信息）
    const now = Date.now();
    await farmerStore.saveBatch({
      batchId: finalBatchId,
      chainBatchId,
      nonce: chainBatchId ? Date.now() : 0,
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
      currentState: 0,
      createdBy: req.user.address || '',
      transactionHash,
      blockNumber,
      createdAt: now,
      updatedAt: now,
    });

    logger.info({ batchId: finalBatchId, chainBatchId, transactionHash, productName: normalizedProductName },
      chainBatchId ? 'batch created on-chain' : 'batch created (off-chain draft)');

    return res.json({
      code: 0,
      data: {
        batchId: finalBatchId,
        chainBatchId,
        productName: normalizedProductName,
        origin: normalizedOrigin,
        category: normalizedCategory,
        quantity,
        status: '批次已创建',
        statusCode: 'Created',
        chainStatusCode: 0,
        statusClass: 'bg-amber-100 text-amber-700',
        chainPending: !chainBatchId,
        transactionHash,
        blockNumber,
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
    const batch = await farmerStore.getBatch(batchId);
    if (!batch) {
      return sendError(res, 404, MSG_BATCH_NOT_FOUND);
    }

    // 链上角色预检查（区分「链不可达」和「无权限」）
    const { chainAvailable, isFarmer } = await farmerChain.checkFarmerRole(req.user.address);
    if (chainAvailable && !isFarmer) {
      return sendError(res, 403, '链上账户未授权农户角色，请联系管理员授权');
    }

    const plantDate = farmFields.plantDate || batch.plantDate || '';
    let bytes32Id = batch.chainBatchId || '';
    let txResult = null;

    if (chainAvailable) {
      // 链可达：走真实上链流程
      try {
        if (!bytes32Id) {
          const chainIds = await farmerChain.generateChainBatchId(
            batch.productName, batch.origin, plantDate
          );
          bytes32Id = chainIds.bytes32Id;
        }
        txResult = await farmerChain.recordFarmInfoOnChain(
          bytes32Id,
          batch.productName,
          batch.variety || batch.category || '',
          batch.origin,
          plantDate,
          farmFields.harvestDate || '',
          req.user.address
        );
      } catch (chainErr) {
        logger.warn({ batchId, error: chainErr.message }, 'on-chain write failed, falling back to off-chain');
        bytes32Id = '';
        txResult = null;
      }
    } else {
      logger.info({ batchId }, 'chain unavailable, saving farm record off-chain only');
    }

    // 写本地 JSON（链上结果不影响持久化）
    const now = Date.now();
    await farmerStore.saveBatch({
      ...batch,
      chainBatchId: bytes32Id,
      plantDate,
      sowingDate: farmFields.sowingDate || '',
      harvestDate: farmFields.harvestDate || '',
      fertilizerRecord: farmFields.fertilizerRecord || '未记录',
      pesticideRecord: farmFields.pesticideRecord || '未记录',
      principalName: farmFields.principalName || '',
      fileHash: farmFields.fileHash || '',
      currentState: 1,
      transactionHash: txResult?.transactionHash || '',
      blockNumber: txResult?.blockNumber ?? null,
      updatedAt: now,
    });

    // 写 MySQL 农事明细
    await FarmDetail.create({
      batchId,
      plantDate: farmFields.plantDate || '',
      sowingDate: farmFields.sowingDate || '',
      harvestDate: farmFields.harvestDate || '',
      fertilizerRecord: farmFields.fertilizerRecord || '未记录',
      pesticideRecord: farmFields.pesticideRecord || '未记录',
      principalName: farmFields.principalName || '',
      fileHash: farmFields.fileHash || '',
      operator: req.user.address || '',
      transactionHash: txResult?.transactionHash || '',
    }).catch(err => logger.warn({ batchId, error: err.message }, 'FarmDetail 写入失败（非致命）'));

    logger.info({ batchId, chainBatchId: bytes32Id, transactionHash: txResult?.transactionHash, chainAvailable }, 'farm record saved');

    return res.json({
      code: 0,
      data: {
        batchId,
        chainBatchId: bytes32Id,
        transactionHash: txResult?.transactionHash || '',
        blockNumber: txResult?.blockNumber ?? null,
        status: '农事记录已提交',
        statusCode: 'FarmRecorded',
        chainStatusCode: 1,
        statusClass: 'bg-emerald-100 text-emerald-700',
        chainPending: !txResult,
      },
      msg: MSG_FARM_RECORD_SUCCESS,
    });
  } catch (err) {
    logger.error(err, 'add farm record failed');
    if (err.message?.includes('未授权')) {
      return sendError(res, 403, err.message);
    }
    return sendError(res, 500, MSG_FARM_RECORD_FAILED);
  }
}

/** 检查链上状态是否允许提交（未提交过则返回 true） */
async function _checkStageNotSubmitted(batchId, stageName, expectedState) {
  try {
    const raw = await traceService.getBatchRaw(batchId);
    const currentState = Number(raw?.status ?? -1);
    if (currentState > expectedState) {
      throw new Error(`${stageName}记录已提交，不能重复提交（当前链上状态=${currentState}）`);
    }
    if (currentState < expectedState) {
      throw new Error(`前置阶段未完成，无法提交${stageName}记录（当前链上状态=${currentState}，需要>=${expectedState}）`);
    }
    return true;
  } catch (err) {
    if (err.message.includes('记录已提交') || err.message.includes('前置阶段未完成')) throw err;
    // 查询失败（链不可达等），继续尝试提交
    return true;
  }
}

export async function addProcessRecord(req, res) {
  const { batchId } = req.params;
  try {
    const { processType, description, reportHash } = req.body;
    await _checkStageNotSubmitted(batchId, '加工', 1);
    const result = await traceService.addProcessRecord(batchId, processType, description, reportHash, req.user.address);

    // 写 MySQL 加工明细
    await ProcessRecord.create({
      batchId,
      processType: processType || '',
      description: description || '',
      reportHash: reportHash || '',
      operator: req.user.address || '',
      transactionHash: result?.transactionHash || '',
    }).catch(err => logger.warn({ batchId, error: err.message }, 'ProcessRecord 写入失败（非致命）'));

    // 更新 batch_index currentState + fileHash
    await BatchIndex.update({ currentState: 2, fileHash: reportHash || '' }, { where: { batchId } })
      .catch(err => logger.warn({ batchId, error: err.message }, 'batch_index currentState 更新失败（非致命）'));

    logger.info({ batchId, processType }, 'process record added');
    return res.json({ code: 0, data: result, msg: '加工记录提交成功' });
  } catch (err) {
    logger.warn({ batchId, error: err.message }, 'addProcessRecord failed');
    return sendError(res, 500, err.message?.includes('已提交') || err.message?.includes('前置阶段') ? err.message : MSG_SUBMIT_FAILED + ': ' + (err.message?.split('msg=')[1] || err.message));
  }
}

export async function updateProcessReport(req, res) {
  const { batchId } = req.params;
  try {
    const { reportHash } = req.body;
    if (!reportHash) {
      return sendError(res, 400, '文件哈希不能为空');
    }

    // 链上更新文件哈希
    await traceService.updateProcessFileHash(batchId, reportHash, req.user.address);

    // 更新 MySQL 记录
    await ProcessRecord.update({ reportHash }, { where: { batchId } })
      .catch(err => logger.warn({ batchId, error: err.message }, 'ProcessRecord reportHash 更新失败（非致命）'));

    await BatchIndex.update({ fileHash: reportHash }, { where: { batchId } })
      .catch(err => logger.warn({ batchId, error: err.message }, 'BatchIndex fileHash 更新失败（非致命）'));

    logger.info({ batchId, reportHash }, 'process report hash updated');
    return res.json({ code: 0, data: { reportHash }, msg: '报告哈希已提交' });
  } catch (err) {
    logger.warn({ batchId, error: err.message }, 'updateProcessReport failed');
    return sendError(res, 500, '哈希提交失败: ' + (err.message || ''));
  }
}

export async function addLogisticsRecord(req, res) {
  const { batchId } = req.params;
  try {
    const { vehicleInfo, routeInfo, tempHumidity, fileHash } = req.body;
    const tempData = typeof tempHumidity === 'object' ? JSON.stringify(tempHumidity) : (tempHumidity || '');

    // 先检查链上状态：已提交过物流（state>=3）则仅补充 MySQL，不再调链上
    let alreadySubmitted = false;
    try {
      const raw = await traceService.getBatchRaw(batchId);
      const currentState = Number(raw?.status ?? -1);
      if (currentState >= 3) alreadySubmitted = true;
    } catch { /* 链不可达时继续尝试 */ }

    let result = null;
    if (!alreadySubmitted) {
      await _checkStageNotSubmitted(batchId, '物流', 2);
      result = await traceService.addLogisticsRecord(batchId, vehicleInfo, routeInfo, tempData, fileHash, req.user.address);
    }

    // 写 MySQL 物流明细
    await LogisticsDetail.create({
      batchId,
      vehicleInfo: vehicleInfo || '',
      routeInfo: routeInfo || '',
      tempHumidity: tempData || '',
      fileHash: fileHash || '',
      operator: req.user.address || '',
      transactionHash: result?.transactionHash || '',
    }).catch(err => logger.warn({ batchId, error: err.message }, 'LogisticsDetail 写入失败（非致命）'));

    // 更新 batch_index currentState（仅首次提交时推进状态）
    if (!alreadySubmitted) {
      await BatchIndex.update({ currentState: 3 }, { where: { batchId } })
        .catch(err => logger.warn({ batchId, error: err.message }, 'batch_index currentState 更新失败（非致命）'));
    }

    logger.info({ batchId, vehicleInfo, routeInfo, alreadySubmitted }, 'logistics record added');
    return res.json({ code: 0, data: result || {}, msg: alreadySubmitted ? '温湿度记录已补充' : '物流记录提交成功' });
  } catch (err) {
    logger.warn({ batchId, error: err.message }, 'addLogisticsRecord failed');
    return sendError(res, 500, err.message?.includes('已提交') || err.message?.includes('前置阶段') ? err.message : MSG_SUBMIT_FAILED + ': ' + (err.message?.split('msg=')[1] || err.message));
  }
}

export async function addRetailRecord(req, res) {
  const { batchId } = req.params;
  try {
    const { storeLocation, saleStatus, fileHash } = req.body;
    await _checkStageNotSubmitted(batchId, '零售', 3);
    const result = await traceService.addRetailRecord(batchId, storeLocation, saleStatus, fileHash, req.user.address);

    // 写 MySQL 零售明细
    await RetailDetail.create({
      batchId,
      storeLocation: storeLocation || '',
      saleStatus: saleStatus || '',
      fileHash: fileHash || '',
      operator: req.user.address || '',
      transactionHash: result?.transactionHash || '',
    }).catch(err => logger.warn({ batchId, error: err.message }, 'RetailDetail 写入失败（非致命）'));

    // 更新 batch_index currentState
    await BatchIndex.update({ currentState: 4 }, { where: { batchId } })
      .catch(err => logger.warn({ batchId, error: err.message }, 'batch_index currentState 更新失败（非致命）'));

    logger.info({ batchId, storeLocation, saleStatus }, 'retail record added');
    return res.json({ code: 0, data: result, msg: '零售记录提交成功' });
  } catch (err) {
    logger.warn({ batchId, error: err.message }, 'addRetailRecord failed');
    return sendError(res, 500, err.message?.includes('已提交') || err.message?.includes('前置阶段') ? err.message : MSG_SUBMIT_FAILED + ': ' + (err.message?.split('msg=')[1] || err.message));
  }
}

export async function updateBatchStatus(req, res) {
  try {
    const { batchId } = req.params;
    const { status } = req.body;
    const result = await traceService.updateBatchStatus(batchId, Number(status), req.user.address);
    await BatchIndex.update({ currentState: Number(status) }, { where: { batchId } })
      .catch(err => logger.warn({ batchId, error: err.message }, 'batch_index status 更新失败（非致命）'));
    logger.info({ batchId, newStatus: status }, 'batch status updated');
    return res.json({ code: 0, data: result, msg: MSG_STATUS_UPDATE_SUCCESS });
  } catch (err) {
    return sendError(res, 500, MSG_STATUS_UPDATE_FAILED);
  }
}
