import * as auditService from '../services/auditService.js';
import * as traceService from '../services/traceService.js';
import logger from '../utils/logger.js';

export async function getAbnormalList(req, res) {
  try {
    const allIds = await traceService.getAllBatchIds();
    const abnormal = [];
    for (const id of allIds.slice(-50)) {
      const isAb = await auditService.isBatchAbnormal(id);
      if (isAb) {
        const batch = await traceService.getBatchRaw(id);
        abnormal.push({ id, product: batch.productName, status: 'Abnormal', updatedAt: Number(batch.updatedAt) });
      }
    }
    res.json({ code: 0, data: abnormal, msg: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '获取异常列表失败' });
  }
}

export async function getEvidenceChain(req, res) {
  try {
    const { batchId } = req.params;
    const chain = await auditService.getEvidenceChain(batchId);
    res.json({ code: 0, data: chain, msg: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '获取证据链失败' });
  }
}

export async function flagAbnormal(req, res) {
  try {
    const { batchId } = req.params;
    const { reason, evidenceHash } = req.body;
    const result = await auditService.markAbnormal(batchId, reason, evidenceHash, req.user.address);
    await traceService.markBatchAbnormal(batchId, req.user.address).catch(() => {});
    logger.info({ batchId, reason }, '异常批次标记');
    res.json({ code: 0, data: result, msg: '异常标记成功' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '标记失败' });
  }
}

export async function submitAudit(req, res) {
  try {
    const { batchId } = req.params;
    const { auditType, description, evidenceHash } = req.body;
    const result = await auditService.processAudit(batchId, auditType, description, evidenceHash, req.user.address);
    logger.info({ batchId, auditType }, '审计提交');
    res.json({ code: 0, data: result, msg: '审计提交成功' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '审计提交失败' });
  }
}

export async function resolveAudit(req, res) {
  try {
    const { batchId } = req.params;
    const { auditId } = req.body;
    const result = await auditService.resolveAudit(batchId, auditId, req.user.address);
    logger.info({ batchId, auditId }, '审计解决');
    res.json({ code: 0, data: result, msg: '审计已关闭' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '关闭审计失败' });
  }
}

export async function clearAbnormal(req, res) {
  try {
    const { batchId } = req.params;
    const result = await auditService.clearAbnormal(batchId, req.user.address);
    logger.info({ batchId }, '异常清除');
    res.json({ code: 0, data: result, msg: '异常已清除' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '清除异常失败' });
  }
}

export async function appendEvidence(req, res) {
  try {
    const { batchId } = req.params;
    const { evidenceHash, description } = req.body;
    const result = await auditService.appendEvidence(batchId, evidenceHash, description, req.user.address);
    logger.info({ batchId, evidenceHash }, '证据补充');
    res.json({ code: 0, data: result, msg: '证据已补充' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '补充证据失败' });
  }
}

export async function getAuditRecordCount(req, res) {
  try {
    const { batchId } = req.params;
    const count = await auditService.getAuditRecordCount(batchId);
    res.json({ code: 0, data: { count }, msg: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '获取审计记录数失败' });
  }
}

export async function getAuditLogs(_req, res) {
  try {
    const allIds = await traceService.getAllBatchIds();
    const logs = [];
    for (const id of allIds.slice(-20)) {
      const records = await auditService.getAuditRecords(id);
      for (const r of records) {
        logs.push({
          auditId: r.auditId,
          batchId: r.batchId,
          auditType: r.auditType,
          description: r.description,
          auditor: r.auditor,
          status: Number(r.status),
          timestamp: Number(r.timestamp),
        });
      }
    }
    logs.sort((a, b) => b.timestamp - a.timestamp);
    res.json({ code: 0, data: logs.slice(0, 50), msg: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '获取审计日志失败' });
  }
}
