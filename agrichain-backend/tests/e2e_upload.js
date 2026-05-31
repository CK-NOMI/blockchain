// 文件上传模块端到端测试
// 用法: node test/e2e_upload.js
// 依赖: 后端运行中 (http://127.0.0.1:3001)

const BASE = process.env.API_BASE || 'http://127.0.0.1:3001';

async function login(username, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json();
  if (!res.ok || body.code !== 0) throw new Error(`登录失败: ${body.msg || res.status}`);
  return body.data;
}

async function main() {
  let pass = 0, fail = 0, warn = 0;

  function check(cond, msg) {
    if (!cond) { throw new Error(msg); }
  }

  // 0. 准备：farmer1 登录并创建一个新批次
  let batchId;
  let TOKEN;
  try {
    const farmer = await login('farmer1', '123456');
    TOKEN = farmer.token;
    const res = await fetch(`${BASE}/api/batches/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName: '上传测试', origin: '测试产地', category: '测试', quantity: 10 }),
    });
    const body = await res.json();
    check(body.code === 0, `创建批次应成功: ${body.msg}`);
    check(body.data?.transactionHash, `创建批次应有 transactionHash`);
    batchId = body.data.batchId;
    console.log('PASS  创建测试批次: %s', batchId);
    pass++;
  } catch (e) {
    console.log('FAIL  准备测试批次:', e.message);
    fail++;
    process.exit(1);
  }

  // 1. 上传文本文件
  try {
    const content = JSON.stringify({ test: 'file upload test', time: Date.now() });
    const blob = new Blob([content], { type: 'application/json' });
    const formData = new FormData();
    formData.append('file', blob, 'test_upload.json');

    const res = await fetch(`${BASE}/api/batches/${batchId}/upload-file`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: formData,
    });
    const body = await res.json();
    check(body.code === 0, `文件上传应成功: ${body.msg}`);
    check(body.data?.fileHash && body.data.fileHash.length > 0, `应有 fileHash: ${body.data?.fileHash}`);
    check(body.data?.fileName === 'test_upload.json', `文件名应匹配: ${body.data?.fileName}`);
    console.log('PASS  上传文件成功: %s, hash=%s', body.data?.fileName, body.data?.fileHash);
    pass++;
  } catch (e) {
    console.log('FAIL  上传文件:', e.message);
    fail++;
  }

  // 2. 上传空文件（测试边界情况）
  try {
    const blob = new Blob([''], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, 'empty.txt');

    const res = await fetch(`${BASE}/api/batches/${batchId}/upload-file`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: formData,
    });
    const body = await res.json();
    check(body.code === 0, `空文件上传应成功: ${body.msg}`);
    check(body.data?.fileHash, `空文件也应有哈希: ${body.data?.fileHash}`);
    console.log('PASS  上传空文件成功, hash=%s', body.data?.fileHash);
    pass++;
  } catch (e) {
    console.log('FAIL  上传空文件:', e.message);
    fail++;
  }

  // 3. 不传文件（验证错误处理）
  try {
    const formData = new FormData();
    const res = await fetch(`${BASE}/api/batches/${batchId}/upload-file`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: formData,
    });
    const body = await res.json();
    check(body.code !== 0, '不传文件应返回错误');
    console.log('PASS  无文件上传被拒绝: %s', body.msg);
    pass++;
  } catch (e) {
    console.log('FAIL  无文件上传验证:', e.message);
    fail++;
  }

  console.log('\n==== upload e2e: %d pass, %d fail, %d warn ====', pass, fail, warn);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.log('FATAL:', e.message);
  process.exit(1);
});
