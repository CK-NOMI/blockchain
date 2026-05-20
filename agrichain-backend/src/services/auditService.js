import fiscoClient from './fiscoClient.js';

export async function markAbnormal(batchId, reason, evidenceHash) {
  return fiscoClient.callContract('AuditManager', 'markAbnormal', [
    batchId, reason, evidenceHash || '',
  ]);
}

export async function clearAbnormal(batchId) {
  return fiscoClient.callContract('AuditManager', 'clearAbnormal', [batchId]);
}

export async function processAudit(batchId, auditType, description, evidenceHash) {
  return fiscoClient.callContract('AuditManager', 'processAudit', [
    batchId, auditType, description, evidenceHash || '',
  ]);
}

export async function resolveAudit(batchId, auditId) {
  return fiscoClient.callContract('AuditManager', 'resolveAudit', [batchId, auditId]);
}

export async function appendEvidence(batchId, evidenceHash, description) {
  return fiscoClient.callContract('AuditManager', 'appendEvidence', [
    batchId, evidenceHash, description,
  ]);
}

export async function getEvidenceChain(batchId) {
  return fiscoClient.callReadOnly('AuditManager', 'getEvidenceChain', [batchId]);
}

export async function getAuditRecords(batchId) {
  return fiscoClient.callReadOnly('AuditManager', 'getAuditRecords', [batchId]);
}

export async function isBatchAbnormal(batchId) {
  return fiscoClient.callReadOnly('AuditManager', 'isBatchAbnormal', [batchId]);
}

export async function getAuditRecordCount(batchId) {
  return fiscoClient.callReadOnly('AuditManager', 'getAuditCount', [batchId]);
}
