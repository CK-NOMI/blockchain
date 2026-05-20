import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import config from './config/index.js';
import logger from './utils/logger.js';

import authRoutes from './routes/auth.js';
import batchRoutes from './routes/batches.js';
import traceRoutes from './routes/trace.js';
import auditRoutes from './routes/audit.js';
import adminRoutes from './routes/admin.js';

import errorHandler from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// 安全头
app.use(helmet({ contentSecurityPolicy: false }));

// 跨域
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 公开溯源接口限流
const traceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { code: 429, data: null, msg: '请求过于频繁，请稍后再试' },
});

// 静态文件 - 上传目录
const uploadDir = path.resolve(__dirname, '..', config.upload.dir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/trace', traceLimiter, traceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ code: 0, data: { status: 'ok', time: Date.now() }, msg: 'ok' });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ code: 404, data: null, msg: '接口不存在' });
});

// 错误处理
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`AgriChain backend running on http://127.0.0.1:${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`FISCO RPC: ${config.fisco.rpcUrls[0]}`);
});

export default app;
