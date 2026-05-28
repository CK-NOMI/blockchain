import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config.js';
import router from './routes.js';
import { initUsers } from './userStore.js';

initUsers();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/api', router);

app.get('/api/health', (_req, res) => {
  res.json({ code: 0, data: { status: 'ok', time: Date.now() }, msg: 'ok' });
});

app.use((_req, res) => {
  res.status(404).json({ code: 404, data: null, msg: '接口不存在' });
});

app.listen(config.port, '127.0.0.1', () => {
  console.log(`Task 3 auth-admin service running at http://127.0.0.1:${config.port}`);
});

export default app;
