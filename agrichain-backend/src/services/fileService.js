import crypto from 'crypto';
import fs from 'fs';

export function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve('0x' + hash.digest('hex')));
    stream.on('error', reject);
  });
}

export function calculateBufferHash(buffer) {
  return '0x' + crypto.createHash('sha256').update(buffer).digest('hex');
}

export function calculateStringHash(str) {
  return '0x' + crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

export function verifyHash(originalHash, computedHash) {
  return originalHash.toLowerCase() === computedHash.toLowerCase();
}
