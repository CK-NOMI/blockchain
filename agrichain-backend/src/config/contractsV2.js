// 4号农户模块专用：加载2号交付的已部署合约 ABI 和地址
// 与旧 contracts.js 隔离，不影响其他模块
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadV2ABI(name) {
  const abiPath = path.resolve(__dirname, `../contracts/abis/${name}.abi`);
  if (fs.existsSync(abiPath)) {
    return JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  }
  return [];
}

const contractsV2 = {
  RoleManagerV2: {
    address: process.env.ROLE_MANAGER_ADDRESS || '',
    abi: loadV2ABI('RoleManager'),
  },
  TraceManagerV2: {
    address: process.env.TRACE_MANAGER_ADDRESS || '',
    abi: loadV2ABI('TraceManager'),
  },
  AuditManagerV2: {
    address: process.env.AUDIT_MANAGER_ADDRESS || '',
    abi: loadV2ABI('AuditManager'),
  },
};

export default contractsV2;
