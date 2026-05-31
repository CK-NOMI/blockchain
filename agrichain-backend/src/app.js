import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import config from './config/index.js';
import fiscoConfig from './config/fisco.js';
import logger from './utils/logger.js';

import { ethers } from 'ethers';
import { sequelize } from './models/index.js';
import { initUsers } from './services/userStore.js';
import authRoutes from './routes/auth.js';
import batchRoutes from './routes/batches.js';
import traceRoutes from './routes/trace.js';
import auditRoutes from './routes/audit.js';
import adminRoutes from './routes/admin.js';

import errorHandler from './middleware/errorHandler.js';
import { selfCheckChain } from './services/farmerChainAdapter.js';

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

// 数据库初始化 + 种子用户（先完成，引导循环依赖此完成）
const dbInit = (async () => {
  try {
    await sequelize.sync();
    logger.info('数据库表已同步');
    await initUsers();
  } catch (err) {
    logger.warn({ error: err.message }, '数据库初始化失败，部分功能不可用');
  }
})();

// 启动时只导入部署者密钥（供 fiscoClient.callContract 签名用），用户密钥在各户登录时按需导入
(async () => {
  await dbInit;
  const WEBASE = fiscoConfig.webaseFront.url;
  try {
    const health = await fetch(`${WEBASE}/${fiscoConfig.webaseFront.groupId}/web3/blockNumber`);
    if (!health.ok) throw new Error(`HTTP ${health.status}`);
    logger.info('WeBASE-Front 已就绪');

    const deployerPk = fiscoConfig.fisco.systemPrivateKey;
    if (deployerPk) {
      const deployerWallet = new ethers.Wallet(deployerPk);
      try {
        await fetch(`${WEBASE}/privateKey/import?privateKey=${deployerPk}&userName=deployer_admin`, { method: 'GET' });
        logger.info(`[bootstrap] 部署者密钥已导入 WeBASE: ${deployerWallet.address}`);
      } catch (e) {
        logger.warn(`[bootstrap] 部署者密钥导入失败: ${e.message}`);
      }
    }
  } catch (e) {
    logger.warn(`WeBASE-Front 未就绪（${e.message}），用户链上引导延后至登录时`);
  }
})();

app.listen(config.port, () => {
  logger.info(`AgriChain backend running on http://127.0.0.1:${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`FISCO RPC: ${config.fisco.rpcUrls[0]}`);
  // 链路自检（异步，不阻塞启动）
  selfCheckChain().then((results) => {
    for (const r of results) {
      if (r.ok) logger.info({ check: r.check, value: r.value }, 'chain self-check PASS');
      else logger.warn({ check: r.check, error: r.error }, 'chain self-check FAIL');
    }
  }).catch((err) => {
    logger.warn({ error: err.message }, 'chain self-check skipped');
  });
  logger.info(`WeBASE-Front: ${fiscoConfig.webaseFront.url}`);

});

export default app;
