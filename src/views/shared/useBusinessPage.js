import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBatchStore } from '../../stores'
import { adminApi } from '../../services/api'
import { generateMockRows } from '../../config/mock'

const ROLE_NAME = {
  ADMIN: '平台',
  FARMER: '农户',
  PROCESSOR: '加工方',
  LOGISTICS: '物流方',
  RETAIL: '零售方',
  REGULATOR: '监管方',
}

const createStats = (seed, role) => [
  { label: '批次总数', value: 120 + seed * 7, trend: 6 - seed },
  { label: '进行中任务', value: 18 + seed * 3, trend: 2 + seed },
  { label: `${ROLE_NAME[role] || ''}告警`, value: 2 + seed, trend: seed % 2 === 0 ? -1 : 3 },
  { label: '上链交易数', value: 860 + seed * 113, trend: 8 + seed },
]

const LIVE_BATCH_PAGES = new Set(['A01', 'G01', 'G02'])
const LIVE_ADMIN_PAGES = new Set(['A02', 'A03', 'A04', 'A05', 'A06'])

function statusClassFor(row) {
  const code = Number(row.statusCode ?? row.chainStatusCode ?? -1)
  const text = String(row.statusLabel || row.status || '')
  if (code === 10 || text.includes('异常') || text.toLowerCase().includes('abnormal')) return 'bg-rose-100 text-rose-700'
  if ([8, 9].includes(code) || text.includes('上架') || text.includes('售罄') || text.toLowerCase().includes('onsale')) return 'bg-emerald-100 text-emerald-700'
  if ([1, 2, 3].includes(code)) return 'bg-blue-100 text-blue-700'
  return 'bg-slate-100 text-slate-700'
}

function riskLevelFor(row) {
  const code = Number(row.statusCode ?? row.chainStatusCode ?? -1)
  const text = String(row.statusLabel || row.status || '')
  if (code === 10 || text.includes('异常') || text.toLowerCase().includes('abnormal')) return '高'
  return '低'
}

function normalizeDashboardRow(row) {
  const batchId = row.batchId || row.id || ''
  return {
    ...row,
    id: batchId,
    batchId,
    product: row.product || row.productName || '',
    owner: row.owner || row.farmer || row.principalName || '--',
    status: row.statusLabel || row.status || '',
    statusClass: row.statusClass || statusClassFor(row),
    riskLevel: row.riskLevel || riskLevelFor(row),
    updatedAt: row.updatedAt || '',
  }
}

function createLiveStats(rows, role) {
  const abnormal = rows.filter((row) => riskLevelFor(row) === '高').length
  const active = rows.filter((row) => ![9, 10].includes(Number(row.statusCode ?? row.chainStatusCode ?? -1))).length
  return [
    { label: '批次总数', value: rows.length, trend: 0 },
    { label: '进行中任务', value: active, trend: 0 },
    { label: role === 'ADMIN' ? '平台告警' : '监管告警', value: abnormal, trend: 0 },
    { label: '真实批次记录', value: rows.length, trend: 0 },
  ]
}

const USER_STATUS_LABELS = {
  PENDING: '待审核',
  ACTIVE: '启用',
  SUSPENDED: '停用',
  REJECTED: '已驳回',
}

const ADMIN_ACTION_LABELS = {
  approve: '用户审批通过',
  reject: '用户驳回',
  suspend: '用户停用',
  changeRole: '角色变更',
}

function formatDate(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ').slice(0, 16)
  const pad = (num) => String(num).padStart(2, '0')
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
}

function shortAddress(address) {
  const text = String(address || '')
  if (text.length <= 18) return text
  return text.slice(0, 10) + '...' + text.slice(-6)
}

function adminStatusClass(status) {
  const text = String(status || '').toLowerCase()
  if (text.includes('pending') || text.includes('待审核') || text.includes('告警')) return 'bg-amber-100 text-amber-700'
  if (text.includes('active') || text.includes('启用') || text.includes('online') || text.includes('在线') || text.includes('deployed') || text.includes('已部署') || text.includes('成功')) return 'bg-emerald-100 text-emerald-700'
  if (text.includes('suspended') || text.includes('rejected') || text.includes('停用') || text.includes('驳回') || text.includes('offline') || text.includes('离线') || text.includes('失败')) return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

function normalizeAdminUser(user) {
  const statusCode = user.status || (user.isActive ? 'ACTIVE' : 'SUSPENDED')
  const status = USER_STATUS_LABELS[statusCode] || statusCode || '--'
  return {
    id: shortAddress(user.address || user.id),
    address: user.address || user.id || '',
    user: user.username || '--',
    role: user.roleLabel || ROLE_NAME[user.role] || user.role || '--',
    roleCode: user.role || '',
    organization: user.organization || '--',
    status,
    statusCode,
    statusClass: adminStatusClass(status),
    updatedAt: formatDate(user.updatedAt || user.createdAt),
  }
}

function normalizeNodeStatus(info = {}) {
  const status = info.status === 'online' ? '在线' : '离线'
  return [{
    id: String(info.chainId || 'group-1'),
    node: 'FISCO BCOS 本地节点',
    network: 'group-1',
    nodeCount: info.nodeCount || 1,
    status,
    statusCode: info.status || 'offline',
    statusClass: adminStatusClass(status),
    height: info.blockHeight ?? '--',
    updatedAt: formatDate(new Date()),
  }]
}

function normalizeContract(contract) {
  const rawStatus = contract.status || '--'
  const status = rawStatus === 'deployed' ? '已部署' : rawStatus
  return {
    id: contract.name || contract.address,
    name: contract.name || '--',
    address: contract.address || '--',
    version: contract.version || '--',
    status,
    statusCode: rawStatus,
    statusClass: adminStatusClass(status),
    updatedAt: formatDate(new Date()),
  }
}

function normalizeAdminLog(log) {
  const action = ADMIN_ACTION_LABELS[log.action] || log.action || '管理操作'
  const target = log.targetUsername
    ? log.targetUsername + ' (' + shortAddress(log.targetAddr) + ')'
    : shortAddress(log.targetAddr || log.target || '')
  return {
    id: log.id || (log.action || 'LOG') + '_' + (log.createdAt || Date.now()),
    operator: log.operator || '--',
    action,
    target: target || '--',
    status: '成功',
    statusClass: adminStatusClass('成功'),
    updatedAt: formatDate(log.createdAt || log.updatedAt),
  }
}

function createAdminStats(code, rows) {
  if (code === 'A02' || code === 'A03') {
    const pending = rows.filter((row) => row.statusCode === 'PENDING').length
    const active = rows.filter((row) => row.statusCode === 'ACTIVE').length
    const disabled = rows.filter((row) => ['SUSPENDED', 'REJECTED'].includes(row.statusCode)).length
    return [
      { label: '用户总数', value: rows.length, trend: 0 },
      { label: '待审核', value: pending, trend: 0 },
      { label: '启用账号', value: active, trend: 0 },
      { label: '停用/驳回', value: disabled, trend: 0 },
    ]
  }
  if (code === 'A04') {
    const node = rows[0] || {}
    return [
      { label: '节点数量', value: node.nodeCount || rows.length, trend: 0 },
      { label: '最新区块', value: node.height || 0, trend: 0 },
      { label: '链 ID', value: node.id || '--', trend: 0 },
      { label: '运行状态', value: node.status || '--', trend: 0 },
    ]
  }
  if (code === 'A05') {
    const deployed = rows.filter((row) => row.status === '已部署').length
    return [
      { label: '合约数量', value: rows.length, trend: 0 },
      { label: '已部署', value: deployed, trend: 0 },
      { label: '待配置', value: rows.length - deployed, trend: 0 },
      { label: '配置来源', value: '后端环境', trend: 0 },
    ]
  }
  const approveCount = rows.filter((row) => row.action.includes('审批')).length
  return [
    { label: '日志总数', value: rows.length, trend: 0 },
    { label: '成功操作', value: rows.length, trend: 0 },
    { label: '审批操作', value: approveCount, trend: 0 },
    { label: '最近记录', value: rows[0]?.updatedAt || '--', trend: 0 },
  ]
}

const kindMap = {
  A01: 'regulatorBatch', A02: 'userAudit', A03: 'userRole', A04: 'nodeStatus', A05: 'contractConfig', A06: 'adminLog',
  F03: 'farmerBatch', F04: 'farmerBatch', F05: 'farmerBatch',
  M01: 'processorBatch', M02: 'processorBatch', M03: 'processorBatch', M04: 'processorBatch', M05: 'processorBatch',
  L01: 'logisticsBatch', L02: 'logisticsBatch', L03: 'logisticsBatch', L04: 'logisticsBatch', L05: 'logisticsBatch',
  R01: 'retailBatch', R02: 'retailBatch', R03: 'retailBatch', R04: 'retailBatch', R05: 'retailBatch', R06: 'retailBatch',
  G01: 'regulatorBatch', G02: 'regulatorBatch', G03: 'regulatorBatch', G04: 'regulatorBatch', G05: 'regulatorBatch',
  G06: 'regulatorBatch', G07: 'regulatorBatch', G08: 'auditLog', G09: 'auditLog',
}

const colMap = {
  userAudit: [
    { key: 'id', label: 'ID' }, { key: 'user', label: '用户名' }, { key: 'role', label: '角色' },
    { key: 'organization', label: '所属机构' }, { key: 'status', label: '状态' }, { key: 'updatedAt', label: '更新时间' },
  ],
  userRole: [
    { key: 'id', label: 'ID' }, { key: 'user', label: '用户名' }, { key: 'role', label: '角色' },
    { key: 'organization', label: '所属机构' }, { key: 'status', label: '状态' }, { key: 'updatedAt', label: '更新时间' },
  ],
  nodeStatus: [
    { key: 'id', label: 'ID' }, { key: 'node', label: '节点' }, { key: 'network', label: '网络组' },
    { key: 'status', label: '状态' }, { key: 'height', label: '区块高度' }, { key: 'updatedAt', label: '更新时间' },
  ],
  adminLog: [
    { key: 'id', label: 'ID' }, { key: 'operator', label: '操作人' }, { key: 'action', label: '操作' },
    { key: 'target', label: '对象' }, { key: 'status', label: '状态' }, { key: 'updatedAt', label: '更新时间' },
  ],
  contractConfig: [
    { key: 'name', label: '合约' }, { key: 'address', label: '合约地址' }, { key: 'version', label: '版本' },
    { key: 'status', label: '状态' }, { key: 'updatedAt', label: '更新时间' },
  ],
  farmerBatch: [
    { key: 'id', label: '批次号' }, { key: 'product', label: '产品' }, { key: 'owner', label: '所属方' },
    { key: 'status', label: '状态' }, { key: 'updatedAt', label: '更新时间' },
  ],
  processorBatch: [
    { key: 'id', label: '批次号' }, { key: 'product', label: '产品' }, { key: 'owner', label: '加工方' },
    { key: 'status', label: '状态' }, { key: 'updatedAt', label: '更新时间' },
  ],
  logisticsBatch: [
    { key: 'id', label: '批次号' }, { key: 'product', label: '产品' }, { key: 'owner', label: '物流方' },
    { key: 'status', label: '状态' }, { key: 'updatedAt', label: '更新时间' },
  ],
  retailBatch: [
    { key: 'id', label: '批次号' }, { key: 'product', label: '产品' }, { key: 'owner', label: '零售节点' },
    { key: 'status', label: '状态' }, { key: 'updatedAt', label: '更新时间' },
  ],
  regulatorBatch: [
    { key: 'id', label: '批次号' }, { key: 'product', label: '产品' }, { key: 'owner', label: '当前责任方' },
    { key: 'status', label: '状态' }, { key: 'riskLevel', label: '风险等级' }, { key: 'updatedAt', label: '更新时间' },
  ],
  auditLog: [
    { key: 'id', label: '审计单号' }, { key: 'batchId', label: '批次号' }, { key: 'owner', label: '责任方' },
    { key: 'status', label: '状态' }, { key: 'riskLevel', label: '风险等级' }, { key: 'updatedAt', label: '更新时间' },
  ],
}

const pageMap = {
  A01: { title: '平台总览', desc: '监控账号审核队列、真实批次与联盟链运行状态。', role: 'ADMIN', actions: [{ label: '刷新真实批次', action: 'refresh', primary: true }, { label: '进入用户审核', action: 'push', to: '/admin/user-audit' }, { label: '查看节点状态', action: 'push', to: '/admin/node-status' }] },
  A02: { title: '用户审核中心', desc: '审核各机构提交的注册申请。', role: 'ADMIN', actions: [{ label: '刷新用户', action: 'refresh', primary: true }] },
  A03: { title: '用户与角色', desc: '管理账号状态、角色与重置密码操作。', role: 'ADMIN', actions: [{ label: '刷新用户', action: 'refresh', primary: true }] },
  A04: { title: '联盟链节点状态', desc: '跟踪 BCOS 节点健康与最新区块信息。', role: 'ADMIN', actions: [{ label: '刷新节点', action: 'refresh', primary: true }] },
  A05: { title: '合约配置', desc: '查看已部署合约地址与环境参数。', role: 'ADMIN', actions: [{ label: '刷新配置', action: 'refresh', primary: true }] },
  A06: { title: '操作日志', desc: '审计平台关键操作并留痕。', role: 'ADMIN', actions: [{ label: '刷新日志', action: 'refresh', primary: true }] },

  F03: { title: '农事生产记录', desc: '上链前记录种植与采收信息。', role: 'FARMER', actions: [{ label: '提交上链', action: 'push', to: '/farmer/batches', primary: true, confirm: true, confirmText: '确认提交本条农事记录并上链？' }, { label: '保存草稿', action: 'notify', message: '草稿已保存。' }] },
  F04: { title: '我的批次', desc: '追踪从源头到上架的全生命周期。', role: 'FARMER', actions: [{ label: '新建批次', action: 'push', to: '/farmer/batch-create', primary: true }, { label: '刷新', action: 'refresh' }] },
  F05: { title: '农户批次详情', desc: '查看本批次的上链回执与最新状态。', role: 'FARMER', actions: [{ label: '查看农事记录', action: 'push', to: '/farmer/records/SC20240521001', primary: true }, { label: '复制批次号', action: 'copy', text: 'SC20240521001' }] },

  M01: { title: '加工方工作台', desc: '查看待加工任务与质检状态。', role: 'PROCESSOR', actions: [{ label: '进入待加工列表', action: 'push', to: '/processor/pending', primary: true }, { label: '刷新', action: 'refresh' }] },
  M02: { title: '待加工批次', desc: '认领批次并启动加工/质检记录流程。', role: 'PROCESSOR', actions: [{ label: '开始加工', action: 'push', to: '/processor/process-record/SC20240521001', primary: true }, { label: '导出数据', action: 'notify', message: '已导出。' }] },
  M03: { title: '加工与质检记录', desc: '填写加工过程与质量检验结果。', role: 'PROCESSOR', actions: [{ label: '上传报告', action: 'push', to: '/processor/file-upload/SC20240521001', primary: true, confirm: true, confirmText: '确认提交质检记录并上传报告？' }, { label: '保存草稿', action: 'notify', message: '草稿已保存。' }] },
  M04: { title: '质检报告上传与验真', desc: '上传文件、计算哈希并验证不可篡改记录。', role: 'PROCESSOR', actions: [{ label: '完成本环节', action: 'push', to: '/processor/batch-detail/SC20240521001', primary: true, confirm: true, confirmText: '确认文件哈希并完成本阶段？' }, { label: '重新计算哈希', action: 'notify', message: '哈希已计算。' }] },
  M05: { title: '加工方批次详情', desc: '查看加工侧全流程详情与回执。', role: 'PROCESSOR', actions: [{ label: '返回待加工', action: 'push', to: '/processor/pending', primary: true }, { label: '复制交易哈希', action: 'copy', text: '0xaba4...9f23' }] },

  L01: { title: '物流方工作台', desc: '监控运输任务与节点级遥测信息。', role: 'LOGISTICS', actions: [{ label: '待运输批次', action: 'push', to: '/logistics/pending', primary: true }, { label: '刷新', action: 'refresh' }] },
  L02: { title: '待运输批次', desc: '认领并执行每个批次的运输流程。', role: 'LOGISTICS', actions: [{ label: '填写运输记录', action: 'push', to: '/logistics/transport-record/SC20240521001', primary: true }, { label: '导出数据', action: 'notify', message: '已导出。' }] },
  L03: { title: '运输任务录入', desc: '记录出发地、目的地、承运方与车辆信息。', role: 'LOGISTICS', actions: [{ label: '下一步', action: 'push', to: '/logistics/temp-record/SC20240521001', primary: true }, { label: '保存草稿', action: 'notify', message: '草稿已保存。' }] },
  L04: { title: '温湿度与节点记录', desc: '上传遥测数据与运输节点信息。', role: 'LOGISTICS', actions: [{ label: '提交记录', action: 'push', to: '/logistics/batch-detail/SC20240521001', primary: true, confirm: true, confirmText: '确认提交运输遥测并上链？' }, { label: '重试上传', action: 'notify', message: '已重试上传。' }] },
  L05: { title: '物流批次详情', desc: '查看运输链路证据与最新状态。', role: 'LOGISTICS', actions: [{ label: '返回待运输', action: 'push', to: '/logistics/pending', primary: true }, { label: '复制批次号', action: 'copy', text: 'SC20240521001' }] },

  R01: { title: '零售方工作台', desc: '跟踪入库流程与批次可售状态。', role: 'RETAIL', actions: [{ label: '进入待入库', action: 'push', to: '/retail/pending', primary: true }, { label: '刷新', action: 'refresh' }] },
  R02: { title: '待入库批次', desc: '准备上架信息与商品元数据。', role: 'RETAIL', actions: [{ label: '入库录入', action: 'push', to: '/retail/retail-record/SC20240521001', primary: true }, { label: '导出数据', action: 'notify', message: '已导出。' }] },
  R03: { title: '入库与上架录入', desc: '完善零售侧数据并准备生成二维码。', role: 'RETAIL', actions: [{ label: '生成二维码', action: 'push', to: '/retail/qrcode/SC20240521001', primary: true }, { label: '保存草稿', action: 'notify', message: '草稿已保存。' }] },
  R04: { title: '销售状态管理', desc: '实时更新上架与销售状态。', role: 'RETAIL', actions: [{ label: '标记为已售', action: 'notify', message: '状态已更新。', primary: true, confirm: true, confirmText: '确认变更销售状态？' }, { label: '返回批次详情', action: 'push', to: '/retail/batch-detail/SC20240521001' }] },
  R05: { title: '二维码生成', desc: '生成、预览并复制消费者溯源链接。', role: 'RETAIL', actions: [{ label: '预览消费者页面', action: 'push', to: '/trace/SC20240521001', primary: true }, { label: '复制链接', action: 'copy', text: 'https://trace.local/SC20240521001' }] },
  R06: { title: '零售批次详情', desc: '查看零售记录、销售状态与二维码展示。', role: 'RETAIL', actions: [{ label: '打开销售状态', action: 'push', to: '/retail/sale-status/SC20240521001', primary: true }, { label: '复制批次号', action: 'copy', text: 'SC20240521001' }] },

  G01: { title: '监管风险看板', desc: '监控真实批次、异常趋势与待审计任务。', role: 'REGULATOR', actions: [{ label: '刷新真实批次', action: 'refresh', primary: true }, { label: '进入综合检索', action: 'push', to: '/regulator/search' }] },
  G02: { title: '批次综合检索', desc: '按批次、位置、责任方与风险状态交叉检索。', role: 'REGULATOR', actions: [{ label: '刷新真实批次', action: 'refresh', primary: true }, { label: '导出结果', action: 'notify', message: '结果已导出。' }] },
  G03: { title: '异常批次列表', desc: '聚焦异常处理与审计闭环。', role: 'REGULATOR', actions: [{ label: '发起审计处理', action: 'push', to: '/regulator/audit/SC20240521001', primary: true }, { label: '查看证据链', action: 'push', to: '/regulator/evidence/SC20240521001' }] },
  G04: { title: '监管批次详情', desc: '查看全链路时间线、证据与反馈记录。', role: 'REGULATOR', actions: [{ label: '标记异常', action: 'push', to: '/regulator/flag/SC20240521001', primary: true }, { label: '查看证据链', action: 'push', to: '/regulator/evidence/SC20240521001' }] },
  G05: { title: '异常标记', desc: '提交异常证据并更新风险等级。', role: 'REGULATOR', actions: [{ label: '提交异常标记', action: 'push', to: '/regulator/batch-detail/SC20240521001', primary: true, confirm: true, confirmText: '确认提交异常标记与证据哈希？' }, { label: '取消', action: 'push', to: '/regulator/search' }] },
  G06: { title: '证据链', desc: '比对文件哈希与链上哈希、操作轨迹。', role: 'REGULATOR', actions: [{ label: '验证哈希', action: 'notify', message: '哈希验证通过。', primary: true }, { label: '返回批次详情', action: 'push', to: '/regulator/batch-detail/SC20240521001' }] },
  G07: { title: '审计处理', desc: '记录审计结论并关闭异常审计流程。', role: 'REGULATOR', actions: [{ label: '提交审计', action: 'push', to: '/regulator/audit-logs', primary: true, confirm: true, confirmText: '确认提交审计结论并关闭此案件？' }, { label: '保存草稿', action: 'notify', message: '草稿已保存。' }] },
  G08: { title: '审计日志', desc: '追踪异常处理全量审计记录。', role: 'REGULATOR', actions: [{ label: '导出日志', action: 'notify', message: '日志已导出。', primary: true }, { label: '刷新', action: 'refresh' }] },
  G09: { title: '风险统计', desc: '按区域、责任方与环节分析风险分布。', role: 'REGULATOR', actions: [{ label: '打开异常批次', action: 'push', to: '/regulator/abnormal', primary: true }, { label: '导出报表', action: 'notify', message: '统计报表已导出。' }] },
}

export const useBusinessPage = (code) => {
  const route = useRoute()
  const router = useRouter()
  const batchStore = useBatchStore()

  const config = pageMap[code]
  const kind = kindMap[code]
  const columns = colMap[kind]
  const searchableKeys = columns.map((item) => item.key)
  const isLiveBatchPage = LIVE_BATCH_PAGES.has(code)
  const isLiveAdminPage = LIVE_ADMIN_PAGES.has(code)
  const isLivePage = isLiveBatchPage || isLiveAdminPage
  const liveRows = ref([])
  const defaultRows = isLivePage ? [] : generateMockRows(kind, 8)
  const rows = computed(() => (isLivePage ? liveRows.value : defaultRows))
  const statCards = computed(() => {
    if (isLiveBatchPage) return createLiveStats(liveRows.value, config.role)
    if (isLiveAdminPage) return createAdminStats(code, liveRows.value)
    return createStats(Object.keys(pageMap).indexOf(code) % 6, config.role)
  })
  const tableTitle = computed(() => `${config.title}数据`)

  const loadLiveRows = async () => {
    if (!isLivePage) return
    try {
      if (isLiveBatchPage) {
        const data = await batchStore.loadDashboardRows(config.role)
        liveRows.value = Array.isArray(data) ? data.map(normalizeDashboardRow) : []
        return
      }
      if (code === 'A02' || code === 'A03') {
        const data = await adminApi.getUsers({})
        liveRows.value = Array.isArray(data) ? data.map(normalizeAdminUser) : []
        return
      }
      if (code === 'A04') {
        const data = await adminApi.getNodeStatus()
        liveRows.value = normalizeNodeStatus(data || {})
        return
      }
      if (code === 'A05') {
        const data = await adminApi.getContractConfig()
        const contracts = Array.isArray(data?.contracts) ? data.contracts : []
        liveRows.value = contracts.map(normalizeContract)
        return
      }
      if (code === 'A06') {
        const data = await adminApi.getLogs()
        liveRows.value = Array.isArray(data) ? data.map(normalizeAdminLog) : []
      }
    } catch (err) {
      console.error('加载真实业务数据失败', err)
      liveRows.value = []
    }
  }

  onMounted(loadLiveRows)

  const handleAction = async (action) => {
    if (action.confirm && !window.confirm(action.confirmText || `确认执行“${action.label}”？`)) {
      return
    }

    if (action.action === 'push' && action.to) {
      router.push(action.to)
      return
    }
    if (action.action === 'copy' && action.text) {
      await navigator.clipboard?.writeText(action.text)
      window.alert('已复制。')
      return
    }
    if (action.action === 'refresh') {
      if (isLivePage) await loadLiveRows()
      else await batchStore.loadDashboardRows(config.role)
      router.replace({ path: route.path, query: { ts: String(Date.now()) } })
      return
    }
    if (action.action === 'notify') {
      window.alert(action.message || '操作已完成。')
    }
  }

  const handleRowAction = async ({ action, row }) => {
    if (config.role === 'ADMIN') {
      if (action.action === 'adminView') {
        window.alert(JSON.stringify(row, null, 2))
        return
      }

      if (!row.address && ['approveUser', 'rejectUser', 'suspendUser', 'changeRole'].includes(action.action)) {
        window.alert('该行没有可操作的用户地址。')
        return
      }

      try {
        if (action.action === 'approveUser') {
          if (row.statusCode !== 'PENDING') {
            window.alert(row.user + ' 当前状态不是待审核。')
            return
          }
          await adminApi.approveUser(row.address)
          window.alert('已通过 ' + row.user + ' 的注册申请。')
          await loadLiveRows()
          return
        }

        if (action.action === 'rejectUser') {
          if (row.statusCode !== 'PENDING') {
            window.alert(row.user + ' 当前状态不是待审核。')
            return
          }
          const reason = window.prompt('请输入驳回原因', '资料不完整')
          if (reason === null) return
          await adminApi.rejectUser(row.address, reason || '管理员驳回')
          window.alert('已驳回 ' + row.user + ' 的注册申请。')
          await loadLiveRows()
          return
        }

        if (action.action === 'suspendUser') {
          if (row.roleCode === 'ADMIN') {
            window.alert('不能在演示页停用平台管理员。')
            return
          }
          await adminApi.suspendUser(row.address)
          window.alert('已停用 ' + row.user + '。')
          await loadLiveRows()
          return
        }

        if (action.action === 'changeRole') {
          if (row.roleCode === 'ADMIN') {
            window.alert('不能在演示页修改平台管理员角色。')
            return
          }
          const nextRole = window.prompt('请输入新角色：FARMER / PROCESSOR / LOGISTICS / RETAIL / REGULATOR', row.roleCode || '')
          if (!nextRole) return
          await adminApi.changeUserRole(row.address, nextRole.trim().toUpperCase())
          window.alert('已更新 ' + row.user + ' 的角色。')
          await loadLiveRows()
          return
        }
      } catch (err) {
        window.alert(err.message || '管理员操作失败。')
        return
      }
    }
    if (action.action === 'view') {
      const batchId = row.batchId || row.id || route.params.batchId || 'SC20240521001'
      const role = config.role
      if (role === 'REGULATOR') return router.push(`/regulator/batch-detail/${batchId}`)
      if (role === 'ADMIN') return router.push(`/trace/${batchId}`)
      if (role === 'FARMER') return router.push(`/farmer/batch-detail/${batchId}`)
      if (role === 'PROCESSOR') return router.push(`/processor/batch-detail/${batchId}`)
      if (role === 'LOGISTICS') return router.push(`/logistics/batch-detail/${batchId}`)
      if (role === 'RETAIL') return router.push(`/retail/batch-detail/${batchId}`)
    }

    if (action.action === 'audit') {
      const batchId = row.batchId || row.id || 'SC20240521001'
      router.push(`/regulator/audit/${batchId}`)
      return
    }

    if (action.action === 'close') {
      window.alert(`审计单 ${row.id} 已关闭。`)
      return
    }

    window.alert(`已对 ${row.id} 执行“${action.label}”`) 
  }

  const rowActions = computed(() => {
    if (code === 'A02') {
      return [
        { label: '通过', action: 'approveUser', primary: true, confirm: true, confirmText: '确认通过该用户申请？' },
        { label: '驳回', action: 'rejectUser', confirm: true, confirmText: '确认驳回该用户申请？' },
      ]
    }
    if (code === 'A03') {
      return [
        { label: '改角色', action: 'changeRole', primary: true, confirm: true, confirmText: '确认修改该用户角色？' },
        { label: '停用', action: 'suspendUser', confirm: true, confirmText: '确认停用该用户？' },
      ]
    }
    if (config.role === 'ADMIN') return [{ label: '查看', action: 'adminView', primary: true }]
    return [
      { label: '查看', action: 'view', primary: true },
      ...(config.role === 'REGULATOR' ? [{ label: '审计', action: 'audit' }] : []),
      ...(code === 'G03' || code === 'G08' ? [{ label: '关闭', action: 'close', confirm: true, confirmText: '确认关闭该审计案件？' }] : []),
    ]
  })

  return {
    config,
    columns,
    rows,
    searchableKeys,
    tableTitle,
    statCards,
    rowActions,
    handleAction,
    handleRowAction,
  }
}
