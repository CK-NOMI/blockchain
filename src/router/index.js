import { createRouter, createWebHistory } from 'vue-router'

import PrototypeCatalogView from '../views/prototype/PrototypeCatalogView.vue'
import PrototypeFrameView from '../views/prototype/PrototypeFrameView.vue'
import AppLayout from '../components/AppLayout.vue'

// 农户模块真实组件
import FarmerDashboardView from '../views/farmer/FarmerDashboardView.vue'
import FarmerBatchCreateView from '../views/farmer/FarmerBatchCreateView.vue'
import FarmerRecordsView from '../views/farmer/FarmerRecordsView.vue'
import FarmerBatchesView from '../views/farmer/FarmerBatchesView.vue'
import FarmerBatchDetailView from '../views/farmer/FarmerBatchDetailView.vue'

// 物流模块真实组件
import LogisticsDashboardView from '../views/logistics/LogisticsDashboardView.vue'
import LogisticsPendingView from '../views/logistics/LogisticsPendingView.vue'
import LogisticsTransportRecordView from '../views/logistics/LogisticsTransportRecordView.vue'
import LogisticsTempRecordView from '../views/logistics/LogisticsTempRecordView.vue'
import LogisticsBatchDetailView from '../views/logistics/LogisticsBatchDetailView.vue'

// 零售模块真实组件
import RetailDashboardView from '../views/retail/RetailDashboardView.vue'
import RetailPendingView from '../views/retail/RetailPendingView.vue'
import RetailRecordView from '../views/retail/RetailRecordView.vue'
import RetailSaleStatusView from '../views/retail/RetailSaleStatusView.vue'
import RetailQrcodeView from '../views/retail/RetailQrcodeView.vue'
import RetailBatchDetailView from '../views/retail/RetailBatchDetailView.vue'

// 加工方模块真实组件（5号）
import ProcessorDashboardView from '../views/processor/ProcessorDashboardView.vue'
import ProcessorPendingView from '../views/processor/ProcessorPendingView.vue'
import ProcessorProcessRecordView from '../views/processor/ProcessorProcessRecordView.vue'
import ProcessorFileUploadView from '../views/processor/ProcessorFileUploadView.vue'
import ProcessorBatchDetailView from '../views/processor/ProcessorBatchDetailView.vue'

import LoginView from '../views/public/LoginView.vue'
import RegisterView from '../views/public/RegisterView.vue'
import PendingView from '../views/public/PendingView.vue'
import { resolveLandingByRole } from '../config/auth'
import { inferSlugByPath } from '../config/prototypeFlow'
import { useAuthStore } from '../stores'

const isMock = import.meta.env.VITE_USE_MOCK === 'true'
console.log('[router] VITE_USE_MOCK =', import.meta.env.VITE_USE_MOCK, '→ isMock =', isMock)

const P = (slug) => ({
  component: PrototypeFrameView,
  props: { slug },
})

const routes = [
  { path: '/', redirect: () => isMock ? '/logistics/dashboard' : '/login' },

  { path: '/prototype', name: 'prototype-catalog', component: PrototypeCatalogView, meta: { title: '原型目录' } },
  { path: '/prototype/:slug', name: 'prototype-frame', component: PrototypeFrameView, meta: { title: '原型预览' } },
  { path: '/system/settings', ...P('a05_pc'), meta: { title: '系统设置' } },

  ...(isMock ? [
    { path: '/login', ...P('p01_pc'), meta: { title: '登录' } },
    { path: '/register', ...P('p02_pc'), meta: { title: '注册' } },
    { path: '/public/pending', ...P('p03_pc'), meta: { title: '审核中' } },
  ] : [
    { path: '/login', component: LoginView, meta: { title: '登录' } },
    { path: '/register', component: RegisterView, meta: { title: '注册' } },
    { path: '/public/pending', component: PendingView, meta: { title: '审核中' } },
  ]),
  { path: '/public/login', redirect: '/login' },
  { path: '/public/register', redirect: '/register' },
  { path: '/pending', redirect: '/public/pending' },
  { path: '/common/403', ...P('p04_pc'), meta: { title: '无权限' } },
  { path: '/common/404', ...P('p05_404_pc'), meta: { title: '页面不存在' } },
  { path: '/public/logout', ...P('p06_pc_1'), meta: { title: '退出确认' } },
  { path: '/public/logout-alt', ...P('p06_pc_2'), meta: { title: '退出确认V2' } },

  { path: '/admin/dashboard', ...P('a01_pc'), meta: { title: '平台概览', role: 'ADMIN' } },
  { path: '/admin/user-audit', ...P('a02_pc'), meta: { title: '用户审核', role: 'ADMIN' } },
  { path: '/admin/user-role', ...P('a03_pc'), meta: { title: '用户与角色', role: 'ADMIN' } },
  { path: '/admin/node-status', ...P('a04_pc'), meta: { title: '节点状态', role: 'ADMIN' } },
  { path: '/admin/contract-config', ...P('a05_pc'), meta: { title: '合约配置', role: 'ADMIN' } },
  { path: '/admin/logs', ...P('a06_pc'), meta: { title: '操作日志', role: 'ADMIN' } },

  {
    path: '/farmer',
    component: AppLayout,
    meta: { role: 'FARMER' },
    children: [
      { path: '', redirect: '/farmer/dashboard' },
      { path: 'dashboard', component: FarmerDashboardView, meta: { title: '农户工作台' } },
      { path: 'batch-create', component: FarmerBatchCreateView, meta: { title: '新建批次' } },
      { path: 'records/:batchId', component: FarmerRecordsView, meta: { title: '农事记录' } },
      { path: 'batches', component: FarmerBatchesView, meta: { title: '我的批次' } },
      { path: 'batch-detail/:batchId', component: FarmerBatchDetailView, meta: { title: '批次详情' } },
    ],
  },

  // mock 模式走原型 iframe，否则走真实组件
  ...(isMock ? [
    { path: '/processor/dashboard', ...P('m01_pc'), meta: { title: '加工方工作台', role: 'PROCESSOR' } },
    { path: '/processor/pending', ...P('m02_pc'), meta: { title: '待加工批次', role: 'PROCESSOR' } },
    { path: '/processor/process-record/:batchId', component: PrototypeFrameView, props: { slug: 'm03_pc' }, meta: { title: '加工记录', role: 'PROCESSOR' } },
    { path: '/processor/file-upload/:batchId', component: PrototypeFrameView, props: { slug: 'm04_pc' }, meta: { title: '报告上传', role: 'PROCESSOR' } },
    { path: '/processor/batch-detail/:batchId', component: PrototypeFrameView, props: { slug: 'm05_pc' }, meta: { title: '批次详情', role: 'PROCESSOR' } },
    { path: '/logistics/dashboard', ...P('l01_pc'), meta: { title: '物流方工作台', role: 'LOGISTICS' } },
    { path: '/logistics/pending', ...P('l02_pc'), meta: { title: '待运输批次', role: 'LOGISTICS' } },
    { path: '/logistics/transport-record/:batchId', component: PrototypeFrameView, props: { slug: 'l03_pc' }, meta: { title: '运输记录', role: 'LOGISTICS' } },
    { path: '/logistics/temp-record/:batchId', component: PrototypeFrameView, props: { slug: 'l04_pc' }, meta: { title: '温湿度记录', role: 'LOGISTICS' } },
    { path: '/logistics/batch-detail/:batchId', component: PrototypeFrameView, props: { slug: 'l05_pc_1' }, meta: { title: '批次详情', role: 'LOGISTICS' } },
    { path: '/retail/dashboard', ...P('r01_pc'), meta: { title: '零售方工作台', role: 'RETAIL' } },
    { path: '/retail/pending', ...P('r02_pc'), meta: { title: '待入库批次', role: 'RETAIL' } },
    { path: '/retail/retail-record/:batchId', component: PrototypeFrameView, props: { slug: 'r03_pc' }, meta: { title: '入库记录', role: 'RETAIL' } },
    { path: '/retail/sale-status/:batchId', component: PrototypeFrameView, props: { slug: 'r04_pc' }, meta: { title: '销售状态', role: 'RETAIL' } },
    { path: '/retail/qrcode/:batchId', component: PrototypeFrameView, props: { slug: 'r05_pc_1' }, meta: { title: '二维码', role: 'RETAIL' } },
    { path: '/retail/batch-detail/:batchId', component: PrototypeFrameView, props: { slug: 'r06_pc' }, meta: { title: '批次详情', role: 'RETAIL' } },
  ] : [
    {
      path: '/logistics',
      component: AppLayout,
      meta: { role: 'LOGISTICS' },
      children: [
        { path: '', redirect: '/logistics/dashboard' },
        { path: 'dashboard', component: LogisticsDashboardView, meta: { title: '物流方工作台' } },
        { path: 'pending', component: LogisticsPendingView, meta: { title: '待运输批次' } },
        { path: 'transport-record/:batchId', component: LogisticsTransportRecordView, meta: { title: '运输记录' } },
        { path: 'temp-record/:batchId', component: LogisticsTempRecordView, meta: { title: '温湿度记录' } },
        { path: 'batch-detail/:batchId', component: LogisticsBatchDetailView, meta: { title: '批次详情' } },
      ],
    },
    {
      path: '/retail',
      component: AppLayout,
      meta: { role: 'RETAIL' },
      children: [
        { path: '', redirect: '/retail/dashboard' },
        { path: 'dashboard', component: RetailDashboardView, meta: { title: '零售方工作台' } },
        { path: 'pending', component: RetailPendingView, meta: { title: '待入库批次' } },
        { path: 'retail-record/:batchId', component: RetailRecordView, meta: { title: '入库记录' } },
        { path: 'sale-status/:batchId', component: RetailSaleStatusView, meta: { title: '销售状态' } },
        { path: 'qrcode/:batchId', component: RetailQrcodeView, meta: { title: '二维码' } },
        { path: 'batch-detail/:batchId', component: RetailBatchDetailView, meta: { title: '批次详情' } },
      ],
    },
    {
      path: '/processor',
      component: AppLayout,
      meta: { role: 'PROCESSOR' },
      children: [
        { path: '', redirect: '/processor/dashboard' },
        { path: 'dashboard', component: ProcessorDashboardView, meta: { title: '加工方工作台' } },
        { path: 'pending', component: ProcessorPendingView, meta: { title: '待加工批次' } },
        { path: 'process-record/:batchId', component: ProcessorProcessRecordView, meta: { title: '加工记录' } },
        { path: 'file-upload/:batchId', component: ProcessorFileUploadView, meta: { title: '报告上传' } },
        { path: 'batch-detail/:batchId', component: ProcessorBatchDetailView, meta: { title: '批次详情' } },
      ],
    },
  ]),

  { path: '/regulator/dashboard', ...P('g01_pc'), meta: { title: '监管看板', role: 'REGULATOR' } },
  { path: '/regulator/search', ...P('g02_pc'), meta: { title: '综合检索', role: 'REGULATOR' } },
  { path: '/regulator/abnormal', ...P('g03_pc'), meta: { title: '异常批次', role: 'REGULATOR' } },
  { path: '/regulator/batch-detail/:batchId', component: PrototypeFrameView, props: { slug: 'g04_pc' }, meta: { title: '批次详情', role: 'REGULATOR' } },
  { path: '/regulator/flag/:batchId', component: PrototypeFrameView, props: { slug: 'g05_pc' }, meta: { title: '标记异常', role: 'REGULATOR' } },
  { path: '/regulator/evidence/:batchId', component: PrototypeFrameView, props: { slug: 'g06_pc_1' }, meta: { title: '证据链', role: 'REGULATOR' } },
  { path: '/regulator/evidence-v2/:batchId', component: PrototypeFrameView, props: { slug: 'g06_pc_2' }, meta: { title: '证据链V2', role: 'REGULATOR' } },
  { path: '/regulator/audit/:batchId', component: PrototypeFrameView, props: { slug: 'g07_pc' }, meta: { title: '审计处理', role: 'REGULATOR' } },
  { path: '/regulator/audit-logs', ...P('g08_pc'), meta: { title: '审计日志', role: 'REGULATOR' } },
  { path: '/regulator/stats', ...P('g09_pc'), meta: { title: '风险统计', role: 'REGULATOR' } },

  { path: '/trace/search', ...P('c01_mobile'), meta: { title: '消费者查询', isMobile: true } },
  { path: '/trace/:batchId', component: PrototypeFrameView, props: { slug: 'c02_mobile' }, meta: { title: '溯源详情', isMobile: true } },
  { path: '/trace/timeline/:batchId', component: PrototypeFrameView, props: { slug: 'c03_mobile' }, meta: { title: '溯源时间线', isMobile: true } },
  { path: '/trace/timeline-h5/:batchId', component: PrototypeFrameView, props: { slug: 'c03_mobile_h5' }, meta: { title: '溯源时间线H5', isMobile: true } },
  { path: '/trace/verify/:batchId', component: PrototypeFrameView, props: { slug: 'c04_mobile_1' }, meta: { title: '溯源验真', isMobile: true } },
  { path: '/trace/verify-v2/:batchId', component: PrototypeFrameView, props: { slug: 'c04_mobile_2' }, meta: { title: '溯源验真V2', isMobile: true } },
  { path: '/trace/feedback/:batchId', component: PrototypeFrameView, props: { slug: 'c05_mobile' }, meta: { title: '问题反馈', isMobile: true } },
  { path: '/trace/feedback/success', ...P('c06_mobile_1'), meta: { title: '反馈成功', isMobile: true } },
  { path: '/trace/feedback/success-v2', ...P('c06_mobile_2'), meta: { title: '反馈成功V2', isMobile: true } },
  { path: '/public/trace/search', redirect: '/trace/search' },
  { path: '/public/trace/:batchId', redirect: (to) => `/trace/${to.params.batchId}` },
  { path: '/public/feedback/:batchId', redirect: (to) => `/trace/feedback/${to.params.batchId}` },

  { path: '/logistics/batch-detail-v2/:batchId', component: PrototypeFrameView, props: { slug: 'l05_pc_2' }, meta: { title: '物流批次详情V2', role: 'LOGISTICS' } },
  { path: '/retail/qrcode-v2/:batchId', component: PrototypeFrameView, props: { slug: 'r05_pc_2' }, meta: { title: '零售二维码V2', role: 'RETAIL' } },

  { path: '/:pathMatch(.*)*', component: PrototypeFrameView, props: { slug: 'p05_404_pc' }, meta: { title: '页面不存在' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const isPublicPath = (path) => (
  path.startsWith('/prototype') ||
  path === '/login' ||
  path === '/register' ||
  path.startsWith('/trace') ||
  path.startsWith('/public') ||
  path.startsWith('/common')
)

const ROLE_BY_PREFIX = [
  ['/retail', 'RETAIL'],
  ['/admin', 'ADMIN'],
  ['/farmer', 'FARMER'],
  ['/processor', 'PROCESSOR'],
  ['/regulator', 'REGULATOR'],
  ['/logistics', 'LOGISTICS'],
]

const DEV_USERS = {
  ADMIN: { id: 'dev-admin', username: 'admin', role: 'ADMIN' },
  FARMER: { id: 'dev-farmer', username: 'farmer1', role: 'FARMER' },
  PROCESSOR: { id: 'dev-processor', username: 'processor1', role: 'PROCESSOR' },
  LOGISTICS: { id: 'dev-logistics', username: 'logistics1', role: 'LOGISTICS' },
  RETAIL: { id: 'dev-retail', username: 'retail1', role: 'RETAIL' },
  REGULATOR: { id: 'dev-regulator', username: 'regulator1', role: 'REGULATOR' },
}

function neededRole(path) {
  const p = path.toLowerCase()
  for (const [prefix, role] of ROLE_BY_PREFIX) {
    if (p.startsWith(prefix)) return role
  }
  return ''
}

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isDev = import.meta.env.DEV

  if (isPublicPath(to.path)) {
    next()
    return
  }

  // ===== 开发模式：URL 路径自动决定角色，后台自动获取真实 token =====
  // 修改：非 mock 模式下已改为跳转登录页手动登录，不再自动获取 token
  if (isDev) {
    // 非 mock 模式：必须通过登录页手动登录（auth_explicit），否则跳转登录页
    if (!isMock && !localStorage.getItem('auth_explicit')) {
      // 清除可能残留的旧缓存数据
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('auth_explicit')
      next('/login')
      return
    }
    const role = neededRole(to.path) || 'LOGISTICS'
    const devUser = DEV_USERS[role] || { id: 'dev', username: '开发者', role }
    if (user.role !== role || user.username !== devUser.username) {
      localStorage.setItem('user', JSON.stringify(devUser))
      // 清除旧 token，触发自动登录
      localStorage.removeItem('token')
      const authStore = useAuthStore()
      authStore.refreshFromStorage()
    }
    if (to.path === '/') { next(isMock ? resolveLandingByRole(role) : '/login'); return }
    next()
    return
  }

  // ===== 生产模式 =====
  if (!user.role) {
    next('/login')
    return
  }

  if (to.meta.role && user.role !== to.meta.role) {
    next('/common/403')
    return
  }

  if (to.path === '/') {
    next(resolveLandingByRole(user.role))
    return
  }

  next()
})

router.afterEach((to) => {
  const inferred = inferSlugByPath(to.path)
  if (inferred) {
    window.__agri_active_prototype_slug = inferred
  }
})

export default router
