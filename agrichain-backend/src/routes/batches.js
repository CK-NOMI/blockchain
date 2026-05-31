import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { farmerGuard, processorGuard, logisticsGuard, retailGuard } from '../middleware/roleGuard.js';
import {
  getDashboard,
  getBatchList,
  getBatchDetail,
  createBatch,
  addFarmRecord,
  addProcessRecord,
  addLogisticsRecord,
  addRetailRecord,
  updateBatchStatus,
  uploadFile,
  updateProcessReport,
} from '../controllers/batchController.js';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', getDashboard);
router.get('/', getBatchList);
router.get('/:batchId', getBatchDetail);
router.put('/:batchId/status', retailGuard, updateBatchStatus);
router.post('/:batchId/upload-file', uploadFile);
router.put('/:batchId/report-hash', updateProcessReport);

router.post('/create', farmerGuard, createBatch);
router.post('/:batchId/farm-record', farmerGuard, addFarmRecord);

router.post('/:batchId/process-record', processorGuard, addProcessRecord);
router.post('/:batchId/logistics-record', logisticsGuard, addLogisticsRecord);
router.post('/:batchId/retail-record', retailGuard, addRetailRecord);

export default router;
