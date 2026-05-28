import fs from 'fs';
import path from 'path';

function loadEnvFile(file = '.env') {
  if (!fs.existsSync(file)) return;

  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'));

const config = {
  port: Number.parseInt(process.env.PORT || '3003', 10),
  jwtSecret: process.env.JWT_SECRET || 'task3-auth-admin-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

export default config;
