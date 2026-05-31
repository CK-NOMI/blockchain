import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const LOG_FILE = path.join(DATA_DIR, 'admin-logs.json');

function readLogs() {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeLogs(logs) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}

/**
 * 记录一条管理员操作日志
 * @param {string} action 操作类型: approve/reject/suspend/changeRole
 * @param {string} targetAddr 目标用户地址
 * @param {string} targetUsername 目标用户名
 * @param {string} operator 操作人用户名
 * @param {object} extra 额外信息（如角色变更、驳回原因等）
 */
export function addLog(action, targetAddr, targetUsername, operator, extra = {}) {
  const logs = readLogs();
  logs.push({
    id: `ADMIN_LOG_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    action,
    targetAddr,
    targetUsername,
    operator,
    ...extra,
    createdAt: new Date().toISOString(),
  });
  writeLogs(logs);
}

export function listLogs() {
  return readLogs().reverse(); // 最新的在前
}
