import * as traceService from '../services/traceService.js';
import { verifyHash } from '../services/fileService.js';
import logger from '../utils/logger.js';

export async function searchTrace(req, res) {
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
    logger.error(err, '溯源查询失败');
    res.status(404).json({ code: 404, data: null, msg: '批次不存在' });
  }
}

export async function verifyFile(req, res) {
  try {
    const { batchId } = req.params;
    const { fileHash } = req.body;
    if (!fileHash) return res.status(400).json({ code: 400, data: null, msg: '请提供文件哈希' });

    const result = await traceService.verifyFileHash(batchId, fileHash);
    res.json({
      code: 0,
      data: {
        found: result.found,
        recordType: result.recordType,
        message: result.found ? '验真通过，文件未被篡改' : '验真失败，链上未找到该文件哈希',
      },
      msg: 'ok',
    });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '验真失败' });
  }
}

export async function submitFeedback(req, res) {
  try {
    const { batchId } = req.params;
    const { problemType, description } = req.body;
    logger.info({ batchId, problemType, description }, '消费者反馈提交');
    res.json({
      code: 0,
      data: { feedbackId: `FB_${Date.now()}`, batchId, status: 'SUBMITTED', submittedAt: new Date().toISOString() },
      msg: '反馈已提交，监管人员将进行核查',
    });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '提交反馈失败' });
  }
}
