import { ROLE_OPTIONS } from '../config/auth'
import { generateMockRows } from '../config/mock'
import http from './http'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const fallbackLogin = async ({ username, password, role }) => {
  await delay()
  if (!username || !password) {
    throw new Error('用户名和密码不能为空。')
  }
  const selectedRole = role || 'FARMER'
  const roleObj = ROLE_OPTIONS.find((item) => item.value === selectedRole)
  if (!roleObj) {
    throw new Error('不支持的角色。')
  }
  return {
    token: `mock-token-${Date.now()}`,
    user: {
      id: `U_${Date.now()}`,
      username,
      role: roleObj.value,
      roleLabel: roleObj.label,
    },
  }
}

const fallbackRegister = async (payload) => {
  await delay()
  if (!payload.username || !payload.password || !payload.organization) {
    throw new Error('注册信息不完整。')
  }
  return { requestId: `REQ_${Date.now()}`, status: 'PENDING' }
}

const fallbackGetDashboard = async (role) => {
  await delay(200)
  const map = {
    FARMER: generateMockRows('farmerBatch', 6),
    PROCESSOR: generateMockRows('processorBatch', 6),
    LOGISTICS: generateMockRows('logisticsBatch', 6),
    RETAIL: generateMockRows('retailBatch', 6),
    REGULATOR: generateMockRows('regulatorBatch', 6),
    ADMIN: generateMockRows('adminLog', 6),
  }
  return map[role] || []
}

const fallbackGetBatchDetail = async (batchId) => {
  await delay(200)
  return {
    batchId,
    productName: '有机葡萄',
    origin: '云南',
    status: '已上链',
    timeline: [
      { stage: '批次创建', time: '2026-04-20 08:30', actor: '农户团队', completed: true },
      { stage: '农事记录', time: '2026-04-21 06:45', actor: '农户团队', completed: true },
      { stage: '加工质检', time: '2026-04-21 14:20', actor: '加工中心', completed: true },
      { stage: '物流运输', time: '2026-04-22 09:20', actor: '物流中心', completed: false },
    ],
  }
}

const fallbackSearchTrace = async (batchId) => {
  await delay(200)
  return fallbackGetBatchDetail(batchId)
}

export const authApi = {
  async login(payload) {
    if (USE_MOCK) return fallbackLogin(payload)
    const { data } = await http.post('/auth/login', payload)
    return data
  },

  async register(payload) {
    if (USE_MOCK) return fallbackRegister(payload)
    const { data } = await http.post('/auth/register', payload)
    return data
  },
}

export const batchApi = {
  async getDashboardRows(role) {
    if (USE_MOCK) return fallbackGetDashboard(role)
    const { data } = await http.get(`/batches/dashboard`, { params: { role } })
    return data
  },

  async getBatchDetail(batchId) {
    if (USE_MOCK) return fallbackGetBatchDetail(batchId)
    const { data } = await http.get(`/batches/${batchId}`)
    return data
  },
}

export const traceApi = {
  async search(batchId) {
    if (USE_MOCK) return fallbackSearchTrace(batchId)
    const { data } = await http.get(`/trace/${batchId}`)
    return data
  },
}
