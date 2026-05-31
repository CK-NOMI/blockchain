import http from './http'
import { generateMockRows } from '../config/mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// ===== Mock 内存存储（仅 mock 模式演示用，真实后端联调时不生效） =====
const mockStore = {
  batches: [], // { batchId, productName, origin, category, quantity, status, ... }
  farmRecords: {}, // batchId -> [{ plantDate, sowingDate, ... }]
}

function mockCreateBatch(payload) {
  const batchId = payload.batchId || `BATCH_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const batch = {
    batchId,
    productName: payload.productName || '',
    origin: payload.origin || '',
    category: payload.category || '',
    quantity: payload.quantity || 0,
    status: '批次已创建',
    statusCode: 'Created',
    chainStatusCode: 0,
    statusClass: 'bg-amber-100 text-amber-700',
    farmer: '0x_current_user',
    owner: '当前农户',
    createdAt: now,
    updatedAt: now,
    plantDate: payload.plantDate || '',
    sowingDate: '',
    harvestDate: '',
    fertilizerRecord: '',
    pesticideRecord: '',
    principalName: '',
    saleStatus: '--',
    storeLocation: '--',
    timeline: [
      { stage: '批次创建', time: now, detail: `农户创建批次，产品：${payload.productName}，产地：${payload.origin || '未填写'}`, txHash: `0x${batchId.slice(0, 8).toLowerCase()}...mock` },
    ],
  }
  mockStore.batches.unshift(batch)
  return { batchId, txHash: `0xmock_${batchId}_${Date.now().toString(16)}`, blockNumber: 100 + mockStore.batches.length }
}

function mockAddFarmRecord(batchId, payload) {
  const batch = mockStore.batches.find((b) => b.batchId === batchId)
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  if (batch) {
    batch.status = '农事记录已提交'
    batch.statusCode = 'Farming'
    batch.chainStatusCode = 1
    batch.statusClass = 'bg-emerald-100 text-emerald-700'
    batch.updatedAt = now
    batch.plantDate = payload.plantDate || batch.plantDate
    batch.sowingDate = payload.sowingDate || batch.sowingDate
    batch.harvestDate = payload.harvestDate || batch.harvestDate
    batch.fertilizerRecord = payload.fertilizerRecord || batch.fertilizerRecord
    batch.pesticideRecord = payload.pesticideRecord || batch.pesticideRecord
    batch.principalName = payload.principalName || batch.principalName
    batch.timeline.push({
      stage: '农户阶段',
      time: now,
      detail: `提交农事记录：种植${payload.plantDate || '--'}、播种${payload.sowingDate || '--'}、采收${payload.harvestDate || '--'}`,
      txHash: `0xmock_farm_${Date.now().toString(16)}`,
    })
  }
  if (!mockStore.farmRecords[batchId]) mockStore.farmRecords[batchId] = []
  mockStore.farmRecords[batchId].push({ ...payload, time: now })
  return { txHash: `0xmock_farm_${Date.now().toString(16)}`, blockNumber: 100 + mockStore.batches.length }
}

function mockGetDashboardRows() {
  return mockStore.batches.map((b) => ({
    id: b.batchId,
    product: b.productName,
    origin: b.origin,
    owner: b.owner,
    status: b.status,
    statusCode: b.statusCode || '',
    chainStatusCode: b.chainStatusCode ?? -1,
    statusClass: b.statusClass,
    updatedAt: b.updatedAt,
  }))
}

function mockGetBatchDetailById(batchId) {
  return mockStore.batches.find((b) => b.batchId === batchId) || null
}
// ===== Mock 内存存储结束 =====

// 根据 batchId 判断是否为异常批次（与 generateMockRows 的 seed 逻辑对齐）
function isAbnormalBatch(batchId) {
  const id = String(batchId || '')
  return id.includes('0003') || id.includes('0006') || id.toLowerCase().includes('abnormal')
}

// 每条批次的独立 mock 详情
const MOCK_DETAILS = {
  SC20260001: {
    productName: '鲜番茄',
    origin: '山东寿光',
    category: '蔬菜',
    quantity: 2000,
    status: '批次已创建',
    statusCode: 'Created',
    chainStatusCode: 0,
    statusClass: 'bg-amber-100 text-amber-700',
    farmer: '0x_farmer_wang',
    owner: '王农户',
    createdAt: '2026-04-17 09:01',
    updatedAt: '2026-04-17 09:01',
    plantDate: '2026-02-20',
    sowingDate: '2026-02-25',
    harvestDate: '',
    fertilizerRecord: '',
    pesticideRecord: '',
    principalName: '王大明',
    saleStatus: '--',
    storeLocation: '--',
    timeline: [
      { stage: '批次创建', time: '2026-04-17 09:01', detail: '农户创建批次，产品：鲜番茄，产地：山东寿光，等待录入农事记录', txHash: '0x1a2b3c...4d5e' },
    ],
  },
  SC20260002: {
    productName: '绿茶',
    origin: '浙江杭州',
    category: '茶叶',
    quantity: 500,
    status: '农事记录已提交',
    statusCode: 'Farming',
    chainStatusCode: 1,
    statusClass: 'bg-emerald-100 text-emerald-700',
    farmer: '0x_farmer_chen',
    owner: '陈农户',
    createdAt: '2026-04-10 08:00',
    updatedAt: '2026-04-15 14:18',
    plantDate: '2026-03-01',
    sowingDate: '2026-03-05',
    harvestDate: '2026-04-12',
    fertilizerRecord: '2026-03-10 施用茶树专用有机肥100kg/亩；2026-03-25 追施磷钾肥30kg/亩',
    pesticideRecord: '2026-03-20 喷施石硫合剂防治茶尺蠖，安全间隔期14天，已满足',
    principalName: '陈茶农',
    saleStatus: '--',
    storeLocation: '--',
    timeline: [
      { stage: '批次创建', time: '2026-04-10 08:00', detail: '农户创建批次，产品：绿茶（龙井43号），产地：浙江杭州', txHash: '0x2b3c4d...5e6f' },
      { stage: '农户阶段', time: '2026-04-15 14:18', detail: '提交农事记录：种植3/1、播种3/5、采收4/12，施肥与农药记录完整，附件哈希已上链', txHash: '0x3c4d5e...6f7a' },
    ],
  },
  SC20260003: {
    productName: '蓝莓',
    origin: '云南昆明',
    category: '水果',
    quantity: 800,
    status: '异常',
    statusCode: 'Abnormal',
    chainStatusCode: 10,
    statusClass: 'bg-rose-100 text-rose-700',
    farmer: '0x_farmer_li',
    owner: '李农户',
    createdAt: '2026-04-05 08:30',
    updatedAt: '2026-04-13 19:35',
    plantDate: '2026-02-15',
    sowingDate: '2026-02-20',
    harvestDate: '2026-04-01',
    fertilizerRecord: '2026-02-28 施用有机肥150kg/亩',
    pesticideRecord: '未记录（农药记录缺失，触发异常规则）',
    principalName: '李农户',
    saleStatus: '已暂停销售',
    storeLocation: '--',
    abnormalInfo: {
      reason: '冷链运输温度超标 + 农药使用记录缺失',
      detectedAt: '2026-04-13 19:35',
      detectedBy: '系统自动检测',
      riskLevel: '高',
      evidenceHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
      handlingStatus: '等待监管处理',
      rules: [
        '规则1：冷链温度超出阈值（实测12.5°C，阈值0~8°C，持续2小时）',
        '规则2：农药使用记录缺失，无法验证安全间隔期',
      ],
    },
    timeline: [
      { stage: '批次创建', time: '2026-04-05 08:30', detail: '农户创建批次，产品：蓝莓，产地：云南昆明', txHash: '0xa1b2c3...d4e5' },
      { stage: '农户阶段', time: '2026-04-06 10:00', detail: '提交种植与采收记录，施肥记录已上链，农药记录未填写', txHash: '0xb2c3d4...e5f6' },
      { stage: '加工阶段', time: '2026-04-08 14:20', detail: '清洗分拣完成，质检合格，报告哈希已上链', txHash: '0xc3d4e5...f6a7' },
      { stage: '物流阶段', time: '2026-04-10 09:00', detail: '冷藏车出发，预设温控0~8°C', txHash: '0xd4e5f6...a7b8' },
      { stage: '⚠️ 异常检测', time: '2026-04-11 03:15', detail: '温湿度传感器报警：车厢温度升至12.5°C，持续2小时，超出安全阈值', txHash: '0xe5f6a7...b8c9' },
      { stage: '⚠️ 异常标记', time: '2026-04-13 19:35', detail: '监管系统标记异常：冷链断链+农药记录缺失，证据哈希已上链，暂停后续流转', txHash: '0xf6a7b8...c9d0' },
    ],
  },
  SC20260004: {
    productName: '有机苹果',
    origin: '陕西洛川',
    category: '水果',
    quantity: 3000,
    status: '已提交待加工',
    statusCode: 'Submitted',
    chainStatusCode: 2,
    statusClass: 'bg-sky-100 text-sky-700',
    farmer: '0x_farmer_zhao',
    owner: '赵农户',
    createdAt: '2026-04-08 07:30',
    updatedAt: '2026-04-11 12:52',
    plantDate: '2026-01-15',
    sowingDate: '2026-01-20',
    harvestDate: '2026-04-05',
    fertilizerRecord: '2026-02-01 施用苹果专用有机肥300kg/亩；2026-03-15 追施钾肥50kg/亩',
    pesticideRecord: '2026-03-01 喷施波尔多液预防病害，安全间隔期21天，已满足',
    principalName: '赵果农',
    saleStatus: '--',
    storeLocation: '--',
    timeline: [
      { stage: '批次创建', time: '2026-04-08 07:30', detail: '农户创建批次，产品：有机苹果（红富士），产地：陕西洛川', txHash: '0x4a5b6c...7d8e' },
      { stage: '农户阶段', time: '2026-04-09 16:00', detail: '提交农事记录：种植1/15、采收4/5，施肥与农药记录完整', txHash: '0x5b6c7d...8e9f' },
      { stage: '状态变更', time: '2026-04-11 12:52', detail: '农户确认提交，状态变更为"已提交待加工"，等待加工中心接收', txHash: '0x6c7d8e...9f0a' },
    ],
  },
  SC20260005: {
    productName: '鲜番茄',
    origin: '海南三亚',
    category: '蔬菜',
    quantity: 1500,
    status: '已送达',
    statusCode: 'Delivered',
    chainStatusCode: 6,
    statusClass: 'bg-blue-100 text-blue-700',
    farmer: '0x_farmer_sun',
    owner: '孙农户',
    createdAt: '2026-04-01 06:00',
    updatedAt: '2026-04-28 17:09',
    plantDate: '2026-01-10',
    sowingDate: '2026-01-15',
    harvestDate: '2026-03-28',
    fertilizerRecord: '2026-01-25 施用有机肥200kg/亩；2026-02-20 追施复合肥60kg/亩；2026-03-10 叶面喷施微量元素',
    pesticideRecord: '2026-02-15 喷施吡虫啉防治白粉虱，安全间隔期7天，已满足',
    principalName: '孙农户',
    saleStatus: '--',
    storeLocation: '--',
    timeline: [
      { stage: '批次创建', time: '2026-04-01 06:00', detail: '农户创建批次，产品：鲜番茄（圣女果），产地：海南三亚', txHash: '0x7d8e9f...0a1b' },
      { stage: '农户阶段', time: '2026-04-03 11:30', detail: '提交农事记录：种植1/10、采收3/28，施肥3次、农药1次，记录完整', txHash: '0x8e9f0a...1b2c' },
      { stage: '加工阶段', time: '2026-04-10 09:45', detail: '清洗包装完成，质检合格（农残未检出），报告哈希已上链', txHash: '0x9f0a1b...2c3d' },
      { stage: '物流阶段', time: '2026-04-15 08:00', detail: '冷藏车出发，海南→广州，温控2~6°C', txHash: '0xa01b2c...3d4e' },
      { stage: '物流送达', time: '2026-04-28 17:09', detail: '已送达广州配送中心，全程温控正常（平均4.1°C），等待零售入库', txHash: '0xb12c3d...4e5f' },
    ],
  },
  SC20260006: {
    productName: '绿茶',
    origin: '福建武夷山',
    category: '茶叶',
    quantity: 300,
    status: '异常',
    statusCode: 'Abnormal',
    chainStatusCode: 10,
    statusClass: 'bg-rose-100 text-rose-700',
    farmer: '0x_farmer_huang',
    owner: '黄农户',
    createdAt: '2026-04-02 09:00',
    updatedAt: '2026-04-26 10:26',
    plantDate: '2026-02-01',
    sowingDate: '2026-02-05',
    harvestDate: '2026-04-18',
    fertilizerRecord: '2026-02-15 施用茶树有机肥80kg/亩',
    pesticideRecord: '2026-04-10 喷施甲维盐防治茶小绿叶蝉，安全间隔期14天',
    principalName: '黄茶农',
    saleStatus: '已暂停销售',
    storeLocation: '--',
    abnormalInfo: {
      reason: '质检不合格仍继续流转 + 农药安全间隔期不满足',
      detectedAt: '2026-04-26 10:26',
      detectedBy: '监管员人工复核',
      riskLevel: '中',
      evidenceHash: '0x1f2e3d4c5b6a7980a1b2c3d4e5f6a7b8c9d0e1f2',
      handlingStatus: '监管员已介入调查',
      rules: [
        '规则1：质检结果"不合格"但状态仍推进至物流阶段',
        '规则2：农药喷施4/10，采收4/18，间隔仅8天，未满足14天安全间隔期',
      ],
    },
    timeline: [
      { stage: '批次创建', time: '2026-04-02 09:00', detail: '农户创建批次，产品：绿茶（大红袍），产地：福建武夷山', txHash: '0xc23d4e...5f6a' },
      { stage: '农户阶段', time: '2026-04-04 15:30', detail: '提交农事记录：种植2/1、采收4/18，施肥1次、农药1次', txHash: '0xd34e5f...6a7b' },
      { stage: '加工阶段', time: '2026-04-20 10:00', detail: '加工完成，但质检结果：农残超标（甲维盐残留0.8mg/kg，限值0.5mg/kg）', txHash: '0xe45f6a...7b8c' },
      { stage: '⚠️ 违规流转', time: '2026-04-22 08:30', detail: '质检不合格但状态被强制推进至物流阶段（违反状态机规则）', txHash: '0xf56a7b...8c9d' },
      { stage: '⚠️ 异常标记', time: '2026-04-26 10:26', detail: '监管员复核发现：质检不合格+安全间隔期不足，标记异常并暂停流转', txHash: '0xa67b8c...9d0e' },
    ],
  },
}

function getMockBatchDetail(batchId) {
  const id = String(batchId || '')
  const matched = MOCK_DETAILS[id]
  if (matched) {
    return { batchId: id, ...matched }
  }

  // 未匹配到的 batchId，根据是否包含异常关键字返回通用数据
  if (isAbnormalBatch(id)) {
    return { batchId: id, ...MOCK_DETAILS.SC20260003, productName: '未知产品' }
  }
  return { batchId: id, ...MOCK_DETAILS.SC20260002, productName: '未知产品' }
}

export const authApi = {
  async login(payload) {
    if (USE_MOCK) {
      await delay()
      if (!payload.username || !payload.password) throw new Error('用户名和密码不能为空')
      return {
        token: `mock-token-${Date.now()}`,
        user: {
          id: `U_${Date.now()}`,
          username: payload.username,
          role: payload.role || 'FARMER',
          roleLabel: payload.role || '农户',
        },
      }
    }
    return await http.post('/auth/login', payload)
  },

  async register(payload) {
    if (USE_MOCK) {
      await delay()
      if (!payload.username || !payload.password || !payload.organization) throw new Error('注册信息不完整')
      return { requestId: `REQ_${Date.now()}`, status: 'PENDING' }
    }
    return await http.post('/auth/register', payload)
  },

  async getProfile() {
    return await http.get('/auth/profile')
  },
}

export const batchApi = {
  async getDashboardRows(role) {
    if (USE_MOCK) {
      await delay(200)
      const map = {
        FARMER: 'farmerBatch',
        PROCESSOR: 'processorBatch',
        LOGISTICS: 'logisticsBatch',
        RETAIL: 'retailBatch',
        REGULATOR: 'regulatorBatch',
        ADMIN: 'adminLog',
      }
      const staticRows = generateMockRows(map[role] || 'farmerBatch', 6)
      if (role === 'FARMER') {
        const dynamicRows = mockGetDashboardRows()
        return [...dynamicRows, ...staticRows]
      }
      return staticRows
    }
    return await http.get('/batches/dashboard', { params: { role } })
  },

  async getBatchList(params) {
    return await http.get('/batches', { params })
  },

  async getBatchDetail(batchId) {
    if (USE_MOCK) {
      await delay(200)
      const dynamic = mockGetBatchDetailById(batchId)
      if (dynamic) return { ...dynamic }
      return getMockBatchDetail(batchId)
    }
    return await http.get(`/batches/${batchId}`)
  },

  async createBatch(payload) {
    if (USE_MOCK) {
      await delay()
      return mockCreateBatch(payload)
    }
    return await http.post('/batches/create', payload)
  },

  async addFarmRecord(batchId, payload) {
    if (USE_MOCK) {
      await delay()
      return mockAddFarmRecord(batchId, payload)
    }
    return await http.post(`/batches/${batchId}/farm-record`, payload)
  },

  async addProcessRecord(batchId, payload) {
    if (USE_MOCK) {
      await delay()
      return { txHash: `0xmock_process_${Date.now()}` }
    }
    return await http.post(`/batches/${batchId}/process-record`, payload)
  },

  async addLogisticsRecord(batchId, payload) {
    if (USE_MOCK) {
      await delay()
      return { txHash: `0xmock_logistics_${Date.now()}` }
    }
    return await http.post(`/batches/${batchId}/logistics-record`, payload)
  },

  async addRetailRecord(batchId, payload) {
    if (USE_MOCK) {
      await delay()
      return { txHash: `0xmock_retail_${Date.now()}` }
    }
    return await http.post(`/batches/${batchId}/retail-record`, payload)
  },

  async updateBatchStatus(batchId, status) {
    if (USE_MOCK) {
      await delay()
      return { txHash: `0xmock_status_${Date.now()}` }
    }
    return await http.put(`/batches/${batchId}/status`, { status })
  },

  async uploadFile(batchId, formData) {
    if (USE_MOCK) {
      await delay()
      return { fileHash: `0xmock_file_${Date.now()}` }
    }
    return await http.post(`/batches/${batchId}/upload-file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  async updateReportHash(batchId, reportHash) {
    return await http.put(`/batches/${batchId}/report-hash`, { reportHash })
  },
}

export const traceApi = {
  async search(batchId) {
    if (USE_MOCK) {
      await delay(200)
      const dynamic = mockGetBatchDetailById(batchId)
      if (dynamic) return { ...dynamic }
      return getMockBatchDetail(batchId)
    }
    return await http.get(`/trace/${batchId}`)
  },

  async verifyFileHash(batchId, fileHash) {
    return await http.post(`/trace/${batchId}/verify`, { fileHash })
  },

  async submitFeedback(batchId, payload) {
    return await http.post(`/trace/${batchId}/feedback`, payload)
  },
}

export const adminApi = {
  async getUsers(params) { return await http.get('/admin/users', { params }) },
  async approveUser(addr) { return await http.put(`/admin/users/${addr}/approve`) },
  async suspendUser(addr) { return await http.put(`/admin/users/${addr}/suspend`) },
  async getNodeStatus() { return await http.get('/admin/node-status') },
  async getChainInfo() { return await http.get('/admin/chain-info') },
  async getContractConfig() { return await http.get('/admin/contract-config') },
}

export const auditApi = {
  async getAbnormalList(params) { return await http.get('/audit/abnormal', { params }) },
  async getEvidenceChain(batchId) { return await http.get(`/audit/${batchId}/evidence`) },
  async flagAbnormal(batchId, payload) { return await http.post(`/audit/${batchId}/flag`, payload) },
  async submitAudit(batchId, payload) { return await http.post(`/audit/${batchId}/audit`, payload) },
  async resolveAudit(batchId, auditId) { return await http.post(`/audit/${batchId}/resolve`, { auditId }) },
}
