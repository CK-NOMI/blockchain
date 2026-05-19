import { Router } from 'express';
import { login, register, getProfile } from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/profile', authMiddleware, getProfile);

export default router;
