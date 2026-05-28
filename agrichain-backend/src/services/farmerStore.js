// 4号农户模块链下存储：读写 data/farmer-batches.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.resolve(__dirname, '../../data/farmer-batches.json');

function ensureFile() {
  if (!fs.existsSync(DATA_PATH)) {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify({ batches: {}, idList: [] }), 'utf8');
  }
}

export function readStore() {
  ensureFile();
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

export function writeStore(data) {
  ensureFile();
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function getBatch(batchId) {
  const store = readStore();
  return store.batches[batchId] || null;
}

export function saveBatch(batch) {
  const store = readStore();
  store.batches[batch.batchId] = batch;
  if (!store.idList.includes(batch.batchId)) {
    store.idList.push(batch.batchId);
  }
  writeStore(store);
}

export function getAllIds() {
  const store = readStore();
  return store.idList || [];
}

export function isFarmSubmitted(batchId) {
  const batch = getBatch(batchId);
  return batch?.farmSubmitted === true;
}

export function getAllBatches() {
  const store = readStore();
  return store.idList.map((id) => store.batches[id]).filter(Boolean);
}
