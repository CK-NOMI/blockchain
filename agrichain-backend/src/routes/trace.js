import { Router } from 'express';
import { searchTrace, verifyFile, submitFeedback } from '../controllers/traceController.js';

const router = Router();

router.get('/:batchId', searchTrace);
router.post('/:batchId/verify', verifyFile);
router.post('/:batchId/feedback', submitFeedback);

export default router;
