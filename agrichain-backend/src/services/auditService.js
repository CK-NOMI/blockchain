import fiscoClient from './fiscoClient.js';
import { resolveChainBatchId } from './traceService.js';

/** 解析链上 bytes32 ID */
async function _resolveId(batchId) {
  return resolveChainBatchId(batchId);
}

// ========== 写函数 ==========

export async function markAbnormal(batchId, reason, evidenceHash, wallet) {
  const chainId = await _resolveId(batchId);
  const methodArgs = [chainId, reason, evidenceHash || ''];
  if (wallet) {
    return fiscoClient.callContractAs(wallet, 'AuditManager', 'markAbnormal', methodArgs);
  }
  return fiscoClient.callContract('AuditManager', 'markAbnormal', methodArgs);
}

export async function clearAbnormal(batchId, wallet) {
  const chainId = await _resolveId(batchId);
  if (wallet) {
    return fiscoClient.callContractAs(wallet, 'AuditManager', 'clearAbnormal', [chainId]);
  }
  return fiscoClient.callContract('AuditManager', 'clearAbnormal', [chainId]);
}

export async function processAudit(batchId, auditType, description, evidenceHash, wallet) {
  const chainId = await _resolveId(batchId);
  const methodArgs = [chainId, auditType, description, evidenceHash || ''];
  if (wallet) {
    return fiscoClient.callContractAs(wallet, 'AuditManager', 'processAudit', methodArgs);
  }
  return fiscoClient.callContract('AuditManager', 'processAudit', methodArgs);
}

export async function resolveAudit(batchId, auditId, wallet) {
  const chainId = await _resolveId(batchId);
  const methodArgs = [chainId, auditId];
  if (wallet) {
    return fiscoClient.callContractAs(wallet, 'AuditManager', 'resolveAudit', methodArgs);
  }
  return fiscoClient.callContract('AuditManager', 'resolveAudit', methodArgs);
}

export async function appendEvidence(batchId, evidenceHash, description, wallet) {
  const chainId = await _resolveId(batchId);
  const methodArgs = [chainId, evidenceHash, description];
  if (wallet) {
    return fiscoClient.callContractAs(wallet, 'AuditManager', 'appendEvidence', methodArgs);
  }
  return fiscoClient.callContract('AuditManager', 'appendEvidence', methodArgs);
}

// ========== 读函数 ==========

export async function getEvidenceChain(batchId) {
  const chainId = await _resolveId(batchId);
  const count = await fiscoClient.callReadOnly('AuditManager', 'getEvidenceCount', [chainId]);
  const n = Number(count || 0);
  const items = [];
  for (let i = 0; i < n; i++) {
    const item = await fiscoClient.callReadOnly('AuditManager', 'getEvidenceItem', [chainId, i]);
    if (Array.isArray(item)) {
      items.push({ evidenceHash: item[0], description: item[1], submitter: item[2], timestamp: Number(item[3]) });
    }
  }
  return items;
}

export async function getAuditRecords(batchId) {
  const chainId = await _resolveId(batchId);
  const count = await fiscoClient.callReadOnly('AuditManager', 'getAuditCount', [chainId]);
  const n = Number(count || 0);
  const records = [];
  for (let i = 0; i < n; i++) {
    const r = await fiscoClient.callReadOnly('AuditManager', 'getAuditRecord', [chainId, i]);
    if (Array.isArray(r)) {
      records.push({
        auditId: Number(r[0]),
        batchId: r[1],
        auditType: r[2],
        description: r[3],
        evidenceHash: r[4],
        auditor: r[5],
        status: Number(r[6]),
        timestamp: Number(r[7]),
      });
    }
  }
  return records;
}

export async function isBatchAbnormal(batchId) {
  const chainId = await _resolveId(batchId);
  return fiscoClient.callReadOnly('AuditManager', 'isBatchAbnormal', [chainId]);
}

export async function getAuditRecordCount(batchId) {
  const chainId = await _resolveId(batchId);
  return fiscoClient.callReadOnly('AuditManager', 'getAuditCount', [chainId]);
}
