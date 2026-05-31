import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'agrichain-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  fisco: {
    rpcUrls: (process.env.FISCO_RPC_URLS || 'http://127.0.0.1:8545').split(',').map((u) => u.trim()),
    groupId: process.env.FISCO_GROUP_ID || 'group0',
    chainId: parseInt(process.env.FISCO_CHAIN_ID || '1', 10),
    systemPrivateKey: process.env.DEPLOYER_PRIVATE_KEY,
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  },

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'agrichain',
    user: process.env.DB_USER || 'root',
    pass: process.env.DB_PASS || '',
  },
};

export default config;
