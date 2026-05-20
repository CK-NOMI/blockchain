import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import {
  getUsers,
  approveUser,
  suspendUser,
  getNodeStatus,
  getChainInfo,
  getContractConfig,
  getLogs,
} from '../controllers/adminController.js';

const router = Router();
router.use(authMiddleware);
router.use(roleGuard('ADMIN'));

router.get('/users', getUsers);
router.put('/users/:addr/approve', approveUser);
router.put('/users/:addr/suspend', suspendUser);
router.get('/node-status', getNodeStatus);
router.get('/chain-info', getChainInfo);
router.get('/contract-config', getContractConfig);
router.get('/logs', getLogs);

export default router;
