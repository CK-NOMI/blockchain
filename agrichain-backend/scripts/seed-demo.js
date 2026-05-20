import http from 'http';

const BASE = 'http://127.0.0.1:3001';
let TOKEN = '';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(`${BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let buf = '';
      res.on('data', (c) => buf += c);
      res.on('end', () => {
        const json = JSON.parse(buf);
        if (json.code !== 0) reject(new Error(json.msg));
        else resolve(json.data);
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function put(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(`${BASE}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let buf = '';
      res.on('data', (c) => buf += c);
      res.on('end', () => {
        const json = JSON.parse(buf);
        if (json.code !== 0) reject(new Error(json.msg));
        else resolve(json.data);
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function login(username, password, role) {
  const data = JSON.stringify({ username, password, role });
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let buf = '';
      res.on('data', (c) => buf += c);
      res.on('end', () => {
        const json = JSON.parse(buf);
        if (json.code !== 0) reject(new Error(json.msg));
        else resolve(json.data.token);
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function wait(ms = 1500) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('=== AgriChain 全链路演示数据生成 ===\n');

  // 1. 登录 admin
  console.log('[1/12] 登录管理员...');
  TOKEN = await login('admin', 'admin123', 'ADMIN');

  // 2. 创建批次
  const BID = 'BATCH-DEMO-FULL';
  console.log(`[2/12] 创建批次 ${BID}...`);
  await post('/api/batches/create', {
    batchId: BID,
    productName: '有机葡萄',
    origin: '新疆吐鲁番',
    category: '水果',
    quantity: 1000,
  });
  await wait();
  console.log('  ✅ 批次创建成功 (Created)');

  // 3. 农事记录1 - 播种
  console.log('[3/12] 添加农事记录 - 播种...');
  await post(`/api/batches/${BID}/farm-record`, {
    recordType: '播种',
    description: '春季播种，使用有机种子，播种面积50亩',
    fileHash: 'QmFarmSeed001',
  });
  await wait();
  console.log('  ✅ 播种记录上链');

  // 4. 农事记录2 - 施肥
  console.log('[4/12] 添加农事记录 - 施肥...');
  await post(`/api/batches/${BID}/farm-record`, {
    recordType: '施肥',
    description: '施用有机肥料，每亩200kg',
    fileHash: 'QmFarmFert002',
  });
  await wait();
  console.log('  ✅ 施肥记录上链');

  // 5. 农事记录3 - 采摘
  console.log('[5/12] 添加农事记录 - 采摘...');
  await post(`/api/batches/${BID}/farm-record`, {
    recordType: '采摘',
    description: '成熟采摘，糖度检测23°，装箱1000箱',
    fileHash: 'QmFarmHarvest003',
  });
  await wait();
  console.log('  ✅ 采摘记录上链 (Farming→Submitted)');

  // 6. 更新状态为 Processing → 加工
  console.log('[6/12] 状态切换 Processing 并添加加工记录...');
  await put(`/api/batches/${BID}/status`, { status: 3 });
  await wait();
  await post(`/api/batches/${BID}/process-record`, {
    processType: '清洗分拣',
    description: '清洗、分拣、去梗，合格率98%',
    reportHash: 'QmProcClean001',
  });
  await wait();
  await post(`/api/batches/${BID}/process-record`, {
    processType: '质检',
    description: '农残检测合格，有机认证通过',
    reportHash: 'QmProcQc002',
  });
  await wait();
  console.log('  ✅ 加工记录上链 (Processing→Processed)');

  // 7. 更新状态为 Processed
  console.log('[7/12] 状态切换 Processed...');
  await put(`/api/batches/${BID}/status`, { status: 4 });
  await wait();
  console.log('  ✅ 加工完成，待物流接收');

  // 8. 物流运输记录
  console.log('[8/12] 添加物流运输记录...');
  await post(`/api/batches/${BID}/logistics-record`, {
    vehicleInfo: '冷藏车 | 京A88421 | 司机:王师傅 | 温控-5~10°C',
    routeInfo: '新疆吐鲁番 → 北京大兴 | 2026-05-15 08:00 ~ 2026-05-18 20:00',
    tempHumidity: { threshold: { minTemp: 0, maxTemp: 8 }, currentTemp: 4.2, currentHumidity: 58 },
    fileHash: 'QmLogiTrans001',
  });
  await wait();
  // 更新为 Transporting
  await put(`/api/batches/${BID}/status`, { status: 5 });
  await wait();
  console.log('  ✅ 物流运输中 (Transporting)');

  // 9. 温湿度节点
  console.log('[9/12] 添加温湿度运输节点...');
  await post(`/api/batches/${BID}/logistics-record`, {
    vehicleInfo: '节点记录 | 3个运输节点',
    routeInfo: '吐鲁番冷库→G30服务区→北京配送中心',
    tempHumidity: JSON.stringify({
      nodes: [
        { time: '2026-05-15 09:00', location: '吐鲁番冷库', temp: 4.0, humidity: 55 },
        { time: '2026-05-16 14:00', location: 'G30高速服务区', temp: 5.5, humidity: 60 },
        { time: '2026-05-18 18:00', location: '北京配送中心', temp: 6.2, humidity: 65 },
      ],
    }),
    fileHash: 'QmLogiNodes002',
  });
  await wait();
  // 更新为 Delivered
  await put(`/api/batches/${BID}/status`, { status: 6 });
  await wait();
  console.log('  ✅ 已送达 (Delivered)');

  // 10. 零售入库
  console.log('[10/12] 零售入库验收...');
  await post(`/api/batches/${BID}/retail-record`, {
    storeLocation: '北京朝阳旗舰店 | 冷库A区-货架12',
    saleStatus: '入库验收合格',
    fileHash: 'QmRetailStore001',
  });
  await wait();
  await put(`/api/batches/${BID}/status`, { status: 7 });
  await wait();
  console.log('  ✅ 入库完成 (Stored)');

  // 11. 上架
  console.log('[11/12] 上架销售...');
  await post(`/api/batches/${BID}/retail-record`, {
    storeLocation: '北京朝阳旗舰店 | 有机蔬果区',
    saleStatus: '在售',
    fileHash: 'QmRetailOnSale002',
  });
  await wait();
  await put(`/api/batches/${BID}/status`, { status: 8 });
  await wait();
  console.log('  ✅ 已上架 (OnSale)');

  // 12. 完成
  console.log('\n=== 🎉 全链路演示数据创建完成！ ===');
  console.log(`批次号: ${BID}`);
  console.log('状态流转: Created → Farming → Submitted → Processing → Processed → Transporting → Delivered → Stored → OnSale');
  console.log('\n可见页面:');
  console.log('  物流方: /logistics/dashboard (Transporting/Delivered)');
  console.log('  零售方: /retail/dashboard (Stored/OnSale)');
  console.log('  物流详情: /logistics/batch-detail/' + BID);
  console.log('  零售详情: /retail/batch-detail/' + BID);
  console.log('  零售二维码: /retail/qrcode/' + BID);
}

main().catch((err) => {
  console.error('❌ 失败:', err.message);
  process.exit(1);
});
