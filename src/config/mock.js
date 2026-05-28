export const statusClass = (status) => {
  const text = String(status || '').toLowerCase()
  if (text.includes('异常') || text.includes('风险') || text.includes('失败') || text.includes('abnormal') || text.includes('risk') || text.includes('failed')) {
    return 'bg-rose-100 text-rose-700'
  }
  if (text.includes('待处理') || text.includes('告警') || text.includes('进行中') || text.includes('审核中') || text.includes('pending') || text.includes('warning') || text.includes('processing')) {
    return 'bg-amber-100 text-amber-700'
  }
  if (text.includes('已完成') || text.includes('正常') || text.includes('通过') || text.includes('在线') || text.includes('done') || text.includes('normal') || text.includes('pass') || text.includes('online')) {
    return 'bg-emerald-100 text-emerald-700'
  }
  return 'bg-slate-100 text-slate-700'
}

export const toQueryValue = (value) => String(value || '').trim().toLowerCase()

const pick = (seed, min, max) => {
  const range = max - min + 1
  return min + (Math.abs(seed) % range)
}

export const generateMockRows = (kind, count = 8) => {
  const kinds = {
    userAudit: ['待审核', '已通过', '已驳回'],
    userRole: ['启用', '停用'],
    nodeStatus: ['在线', '离线', '告警'],
    adminLog: ['信息', '告警', '错误'],
    farmerBatch: ['已上链', '待处理', '异常'],
    processorBatch: ['待处理', '进行中', '已完成'],
    logisticsBatch: ['待处理', '运输中', '已送达'],
    retailBatch: ['待处理', '已上架', '已售罄'],
    regulatorBatch: ['正常', '异常', '审计中'],
    auditLog: ['处理中', '已关闭', '待处理'],
  }

  const profiles = {
    userAudit: {
      idPrefix: 'UA',
      base: ['id', 'user', 'role', 'organization', 'status', 'updatedAt'],
      rolePool: ['农户', '加工方', '物流方', '零售方', '监管方'],
    },
    userRole: {
      idPrefix: 'UR',
      base: ['id', 'user', 'role', 'organization', 'status', 'updatedAt'],
      rolePool: ['平台管理员', '农户', '加工方', '物流方', '零售方', '监管方'],
    },
    nodeStatus: {
      idPrefix: 'ND',
      base: ['id', 'node', 'network', 'status', 'height', 'updatedAt'],
    },
    adminLog: {
      idPrefix: 'LOG',
      base: ['id', 'operator', 'action', 'target', 'status', 'updatedAt'],
    },
    farmerBatch: {
      idPrefix: 'SC',
      base: ['id', 'product', 'owner', 'status', 'updatedAt'],
    },
    processorBatch: {
      idPrefix: 'SC',
      base: ['id', 'product', 'owner', 'status', 'updatedAt'],
    },
    logisticsBatch: {
      idPrefix: 'SC',
      base: ['id', 'product', 'owner', 'status', 'updatedAt'],
    },
    retailBatch: {
      idPrefix: 'SC',
      base: ['id', 'product', 'owner', 'status', 'updatedAt'],
    },
    regulatorBatch: {
      idPrefix: 'SC',
      base: ['id', 'product', 'owner', 'status', 'updatedAt', 'riskLevel'],
    },
    auditLog: {
      idPrefix: 'AUD',
      base: ['id', 'batchId', 'owner', 'status', 'updatedAt', 'riskLevel'],
    },
  }

  const statusPool = kinds[kind] || ['待处理', '已完成']
  const profile = profiles[kind] || profiles.farmerBatch

  return Array.from({ length: count }).map((_, index) => {
    const seed = index * 17 + kind.length * 11
    const status = statusPool[seed % statusPool.length]
    const row = {
      id: `${profile.idPrefix}${20260000 + index + 1}`,
      status,
      updatedAt: `2026-04-${String(pick(seed, 10, 28)).padStart(2, '0')} ${String(pick(seed, 8, 19)).padStart(2, '0')}:${String(pick(seed, 0, 59)).padStart(2, '0')}`,
      statusClass: statusClass(status),
    }

    if (profile.base.includes('user')) row.user = `user_${index + 1}`
    if (profile.base.includes('role')) {
      const rolePool = profile.rolePool || ['农户', '加工方']
      row.role = rolePool[seed % rolePool.length]
    }
    if (profile.base.includes('organization')) row.organization = `机构-${pick(seed, 1, 16)}`
    if (profile.base.includes('node')) row.node = `node-${pick(seed, 1, 6)}`
    if (profile.base.includes('network')) row.network = `group-${pick(seed, 1, 4)}`
    if (profile.base.includes('height')) row.height = 310000 + pick(seed, 1, 2200)
    if (profile.base.includes('operator')) row.operator = `admin_${pick(seed, 1, 6)}`
    if (profile.base.includes('action')) row.action = ['新建', '更新', '审计', '停用'][seed % 4]
    if (profile.base.includes('target')) row.target = ['用户', '批次', '节点', '合约'][seed % 4]
    if (profile.base.includes('product')) row.product = ['有机苹果', '鲜番茄', '绿茶', '蓝莓'][seed % 4]
    if (profile.base.includes('product')) row.origin = ['陕西洛川', '山东寿光', '浙江杭州', '云南昆明'][seed % 4]
    if (profile.base.includes('owner')) row.owner = ['农户团队', '加工中心', '物流中心', '零售节点'][seed % 4]
    if (profile.base.includes('riskLevel')) row.riskLevel = ['低', '中', '高'][seed % 3]
    if (profile.base.includes('batchId')) row.batchId = `SC202405${String(100 + index).padStart(3, '0')}`

    return row
  })
}

export const filterRows = (rows, query = '', keys = []) => {
  const q = toQueryValue(query)
  if (!q) return rows
  return rows.filter((row) => keys.some((key) => toQueryValue(row[key]).includes(q)))
}
