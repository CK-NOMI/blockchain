import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import {
  getAbnormalList,
  getEvidenceChain,
  flagAbnormal,
  submitAudit,
  resolveAudit,
  getAuditLogs,
} from '../controllers/auditController.js';

const router = Router();
router.use(authMiddleware);
router.use(roleGuard('REGULATOR'));

router.get('/abnormal', getAbnormalList);
router.get('/:batchId/evidence', getEvidenceChain);
router.post('/:batchId/flag', flagAbnormal);
router.post('/:batchId/audit', submitAudit);
router.post('/:batchId/resolve', resolveAudit);
router.get('/logs', getAuditLogs);

export default router;
