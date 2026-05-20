import http from './http'
import { generateMockRows } from '../config/mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// ===== Auth API =====
export const authApi = {
  async login(payload) {
    if (USE_MOCK) {
      await delay()
      if (!payload.username || !payload.password) throw new Error('用户名和密码不能为空。')
      return {
        token: `mock-token-${Date.now()}`,
        user: { id: `U_${Date.now()}`, username: payload.username, role: payload.role || 'FARMER', roleLabel: payload.role || '农户' },
      }
    }
    const { data } = await http.post('/auth/login', payload)
    return data
  },

  async register(payload) {
    if (USE_MOCK) {
      await delay()
      if (!payload.username || !payload.password || !payload.organization) throw new Error('注册信息不完整。')
      return { requestId: `REQ_${Date.now()}`, status: 'PENDING' }
    }
    const { data } = await http.post('/auth/register', payload)
    return data
  },

  async getProfile() {
    const { data } = await http.get('/auth/profile')
    return data
  },
}

// ===== Batch API =====
export const batchApi = {
  async getDashboardRows(role) {
    if (USE_MOCK) {
      await delay(200)
      const map = { FARMER: 'farmerBatch', PROCESSOR: 'processorBatch', LOGISTICS: 'logisticsBatch', RETAIL: 'retailBatch', REGULATOR: 'regulatorBatch', ADMIN: 'adminLog' }
      return generateMockRows(map[role] || 'farmerBatch', 6)
    }
    const { data } = await http.get('/batches/dashboard', { params: { role } })
    return data
  },

  async getBatchList(params) {
    const { data } = await http.get('/batches', { params })
    return data
  },

  async getBatchDetail(batchId) {
    if (USE_MOCK) {
      await delay(200)
      return {
        batchId,
        productName: '有机葡萄',
        origin: '新疆吐鲁番',
        status: '运输中',
        saleStatus: '--',
        storeLocation: '--',
        timeline: [
          { type: '生产批次创建', time: '2026-04-15 09:00', detail: '农户张三创建批次，产品：有机葡萄，产地：新疆吐鲁番', txHash: '0x3a1b2c...d4e5' },
          { type: '农事记录提交', time: '2026-04-18 14:30', detail: '施肥、灌溉、农药施用记录，附检测报告哈希', txHash: '0x7f8e9a...1b2c' },
          { type: '加工质检记录', time: '2026-04-20 10:15', detail: '有机食品加工中心质检合格，清洗分拣包装', txHash: '0x4d5e6f...7a8b' },
          { type: '加工报告上传', time: '2026-04-20 16:45', detail: '质检报告上传，文件SHA-256上链存证', txHash: '0x9c0d1e...3f4a' },
          { type: '物流运输录入', time: '2026-04-22 08:00', detail: '冷链车VL-0042 京A12345，司机李四，出发地新疆→目的地北京', txHash: '0x5b6c7d...8e9f' },
          { type: '温湿度节点记录', time: '2026-04-22 09:20', detail: '加工中心冷库出发，温度4.5°C，湿度55%', txHash: '0x2a1b3c...4d5e' },
          { type: '温湿度节点记录', time: '2026-04-22 11:30', detail: 'G30高速服务区A，温度6.0°C，湿度60%', txHash: '0x6f7e8d...9a0b' },
          { type: '温湿度节点记录', time: '2026-04-22 15:45', detail: '配送中心B，温度7.8°C，湿度68%', txHash: '0x1c2d3e...4f5a' },
        ],
      }
    }
    const { data } = await http.get(`/batches/${batchId}`)
    return data
  },

  async createBatch(payload) {
    if (USE_MOCK) { await delay(); return { txHash: '0xmock_creation_' + Date.now() } }
    const { data } = await http.post('/batches/create', payload)
    return data
  },

  async addFarmRecord(batchId, payload) {
    if (USE_MOCK) { await delay(); return { txHash: '0xmock_farm_' + Date.now() } }
    const { data } = await http.post(`/batches/${batchId}/farm-record`, payload)
    return data
  },

  async addProcessRecord(batchId, payload) {
    if (USE_MOCK) { await delay(); return { txHash: '0xmock_process_' + Date.now() } }
    const { data } = await http.post(`/batches/${batchId}/process-record`, payload)
    return data
  },

  // ★ 物流：添加运输记录
  async addLogisticsRecord(batchId, payload) {
    if (USE_MOCK) { await delay(); return { txHash: '0xmock_logistics_' + Date.now() } }
    const { data } = await http.post(`/batches/${batchId}/logistics-record`, payload)
    return data
  },

  // ★ 零售：添加入库/上架记录
  async addRetailRecord(batchId, payload) {
    if (USE_MOCK) { await delay(); return { txHash: '0xmock_retail_' + Date.now() } }
    const { data } = await http.post(`/batches/${batchId}/retail-record`, payload)
    return data
  },

  async updateBatchStatus(batchId, status) {
    if (USE_MOCK) { await delay(); return { txHash: '0xmock_status_' + Date.now() } }
    const { data } = await http.put(`/batches/${batchId}/status`, { status })
    return data
  },

  async uploadFile(batchId, formData) {
    if (USE_MOCK) { await delay(); return { fileHash: '0xmock_file_' + Date.now() } }
    const { data } = await http.post(`/batches/${batchId}/upload-file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}

// ===== Trace API（消费者公开接口）=====
export const traceApi = {
  async search(batchId) {
    if (USE_MOCK) {
      await delay(200)
      return { batchId, productName: '有机葡萄', origin: '云南', status: '已上链', timeline: [] }
    }
    const { data } = await http.get(`/trace/${batchId}`)
    return data
  },

  async verifyFileHash(batchId, fileHash) {
    const { data } = await http.post(`/trace/${batchId}/verify`, { fileHash })
    return data
  },

  async submitFeedback(batchId, payload) {
    const { data } = await http.post(`/trace/${batchId}/feedback`, payload)
    return data
  },
}

// ===== Admin API =====
export const adminApi = {
  async getUsers(params) { const { data } = await http.get('/admin/users', { params }); return data },
  async approveUser(addr) { const { data } = await http.put(`/admin/users/${addr}/approve`); return data },
  async suspendUser(addr) { const { data } = await http.put(`/admin/users/${addr}/suspend`); return data },
  async getNodeStatus() { const { data } = await http.get('/admin/node-status'); return data },
  async getChainInfo() { const { data } = await http.get('/admin/chain-info'); return data },
  async getContractConfig() { const { data } = await http.get('/admin/contract-config'); return data },
}

// ===== Audit API =====
export const auditApi = {
  async getAbnormalList(params) { const { data } = await http.get('/audit/abnormal', { params }); return data },
  async getEvidenceChain(batchId) { const { data } = await http.get(`/audit/${batchId}/evidence`); return data },
  async flagAbnormal(batchId, payload) { const { data } = await http.post(`/audit/${batchId}/flag`, payload); return data },
  async submitAudit(batchId, payload) { const { data } = await http.post(`/audit/${batchId}/audit`, payload); return data },
  async resolveAudit(batchId, auditId) { const { data } = await http.post(`/audit/${batchId}/resolve`, { auditId }); return data },
}
