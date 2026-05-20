import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { calculateFileHash } from '../services/fileService.js';
import * as traceService from '../services/traceService.js';
import logger from '../utils/logger.js';

// 文件上传配置
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

export const uploadFile = [
  upload.single('file'),
  async (req, res) => {
    try {
      const { batchId } = req.params;
      if (!req.file) return res.status(400).json({ code: 400, data: null, msg: '请选择文件' });

      const fileHash = await calculateFileHash(req.file.path);
      logger.info({ batchId, fileName: req.file.originalname, fileHash }, '文件上传');

      res.json({
        code: 0,
        data: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileHash,
          filePath: `/uploads/${req.file.filename}`,
          uploadedAt: new Date().toISOString(),
        },
        msg: '文件上传成功',
      });
    } catch (err) {
      logger.error(err, '文件上传失败');
      res.status(500).json({ code: 500, data: null, msg: err.message || '文件上传失败' });
    }
  },
];

function formatDashboardRow(batch) {
  return {
    id: batch.id || batch.batchId,
    product: batch.product || batch.productName,
    origin: batch.origin || '',
    owner: batch.farmer || batch.owner || '',
    status: batch.status,
    saleStatus: batch.saleStatus || '',
    updatedAt: typeof batch.updatedAt === 'number'
      ? new Date(Number(batch.updatedAt)).toISOString().slice(0, 16).replace('T', ' ')
      : batch.updatedAt,
  };
}

export async function getDashboard(req, res) {
  try {
    const { role } = req.query;
    const batches = await traceService.getDashboardBatches(role || 'FARMER');
    const rows = batches.map(formatDashboardRow);
    res.json({ code: 0, data: rows, msg: 'ok' });
  } catch (err) {
    logger.error(err, '获取工作台数据失败');
    res.json({ code: 0, data: [], msg: '链上暂无数据' });
  }
}

export async function getBatchList(req, res) {
  try {
    const allIds = await traceService.getAllBatchIds();
    const result = [];
    for (const id of allIds.slice(-50)) {
      try {
        const batch = await traceService.getBatchRaw(id);
        result.push(formatDashboardRow({
          id: batch.batchId,
          product: batch.productName,
          origin: batch.origin,
          farmer: batch.farmer,
          status: ['Created', 'Farming', 'Submitted', 'Processing', 'Processed', 'Transporting', 'Delivered', 'Stored', 'OnSale', 'SoldOut', 'Abnormal'][batch.status] || 'Unknown',
          updatedAt: Number(batch.updatedAt),
        }));
      } catch { /* skip */ }
    }
    result.reverse();
    res.json({ code: 0, data: result, msg: 'ok' });
  } catch (err) {
    logger.error(err, '获取批次列表失败');
    res.json({ code: 0, data: [], msg: '链上暂无数据' });
  }
}

export async function getBatchDetail(req, res) {
  try {
    const { batchId } = req.params;
    const [detail, timeline] = await Promise.all([
      traceService.getBatchDetail(batchId),
      traceService.getBatchTimeline(batchId).catch(() => []),
    ]);

    res.json({
      code: 0,
      data: {
        ...detail,
        timeline: timeline.map((t) => ({
          ...t,
          time: new Date(Number(t.time)).toISOString().slice(0, 16).replace('T', ' '),
        })),
      },
      msg: 'ok',
    });
  } catch (err) {
    logger.error(err, '获取批次详情失败');
    res.status(404).json({ code: 404, data: null, msg: err.message || '批次不存在' });
  }
}

export async function createBatch(req, res) {
  try {
    const { batchId, productName, origin, category, quantity } = req.body;
    const result = await traceService.createBatch(batchId, productName, origin, category, quantity || 0);
    logger.info({ batchId, productName }, '批次创建');
    res.json({ code: 0, data: { batchId, ...result }, msg: '批次创建成功' });
  } catch (err) {
    logger.error(err, '创建批次失败');
    res.status(500).json({ code: 500, data: null, msg: err.message || '创建批次失败' });
  }
}

export async function addFarmRecord(req, res) {
  try {
    const { batchId } = req.params;
    const { recordType, description, fileHash } = req.body;
    const result = await traceService.addFarmRecord(batchId, recordType, description, fileHash);
    logger.info({ batchId, recordType }, '农事记录添加');
    res.json({ code: 0, data: result, msg: '农事记录提交成功' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '提交失败' });
  }
}

export async function addProcessRecord(req, res) {
  try {
    const { batchId } = req.params;
    const { processType, description, reportHash } = req.body;
    const result = await traceService.addProcessRecord(batchId, processType, description, reportHash);
    logger.info({ batchId, processType }, '加工记录添加');
    res.json({ code: 0, data: result, msg: '加工记录提交成功' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '提交失败' });
  }
}

// ★★★ 物流（冷链）核心接口 ★★★
export async function addLogisticsRecord(req, res) {
  try {
    const { batchId } = req.params;
    const { vehicleInfo, routeInfo, tempHumidity, fileHash } = req.body;
    const tempData = typeof tempHumidity === 'object' ? JSON.stringify(tempHumidity) : (tempHumidity || '');
    const result = await traceService.addLogisticsRecord(batchId, vehicleInfo, routeInfo, tempData, fileHash);
    logger.info({ batchId, vehicleInfo, routeInfo }, '物流运输记录添加');
    res.json({ code: 0, data: result, msg: '物流记录提交成功' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '提交失败' });
  }
}

// ★★★ 超市零售核心接口 ★★★
export async function addRetailRecord(req, res) {
  try {
    const { batchId } = req.params;
    const { storeLocation, saleStatus, fileHash } = req.body;
    const result = await traceService.addRetailRecord(batchId, storeLocation, saleStatus, fileHash);
    logger.info({ batchId, storeLocation, saleStatus }, '零售记录添加');
    res.json({ code: 0, data: result, msg: '零售记录提交成功' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '提交失败' });
  }
}

export async function updateBatchStatus(req, res) {
  try {
    const { batchId } = req.params;
    const { status } = req.body;
    const result = await traceService.updateBatchStatus(batchId, Number(status));
    logger.info({ batchId, newStatus: status }, '批次状态更新');
    res.json({ code: 0, data: result, msg: '状态更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '状态更新失败' });
  }
}
