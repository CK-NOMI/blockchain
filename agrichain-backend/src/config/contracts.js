import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadABI(name) {
  const abiPath = path.resolve(__dirname, `../contracts/abis/src_contracts_${name}_sol_${name}.abi`);
  if (fs.existsSync(abiPath)) {
    return JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  }
  return [];
}

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
