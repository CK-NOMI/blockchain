import crypto from 'crypto';

export function sha256(data) {
  return '0x' + crypto.createHash('sha256').update(data).digest('hex');
}

export function sha256File(buffer) {
  return '0x' + crypto.createHash('sha256').update(buffer).digest('hex');
}
