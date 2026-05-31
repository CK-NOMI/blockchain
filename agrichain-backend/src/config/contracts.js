import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadABI(name) {
  const abiPath = path.resolve(__dirname, `../../../contract_build_info/${name}.abi`);
  if (fs.existsSync(abiPath)) {
    return JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  }
  return [];
}

// 4号原 contractsV2.js（RoleManagerV2 / TraceManagerV2 / AuditManagerV2）与此文件
// ABI 和地址完全相同，已合并至此，V2 后缀不再使用。
const contractsConfig = {
  RoleManager: {
    address: process.env.ROLE_MANAGER_ADDRESS || '',
    abi: loadABI('RoleManager'),
  },
  TraceManager: {
    address: process.env.TRACE_MANAGER_ADDRESS || '',
    abi: loadABI('TraceManager'),
  },
  AuditManager: {
    address: process.env.AUDIT_MANAGER_ADDRESS || '',
    abi: loadABI('AuditManager'),
  },
};

export default contractsConfig;
