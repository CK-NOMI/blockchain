import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { logisticsGuard, retailGuard } from '../middleware/roleGuard.js';
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
} from '../controllers/batchController.js';

const router = Router();

router.use(authMiddleware);

// 通用
router.get('/dashboard', getDashboard);
router.get('/', getBatchList);
router.get('/:batchId', getBatchDetail);
router.put('/:batchId/status', updateBatchStatus);
router.post('/:batchId/upload-file', uploadFile);

// 农户
router.post('/create', createBatch);
router.post('/:batchId/farm-record', addFarmRecord);

// 加工
router.post('/:batchId/process-record', addProcessRecord);

// ★ 物流（冷链）★
router.post('/:batchId/logistics-record', logisticsGuard, addLogisticsRecord);

// ★ 超市零售 ★
router.post('/:batchId/retail-record', retailGuard, addRetailRecord);

export default router;
