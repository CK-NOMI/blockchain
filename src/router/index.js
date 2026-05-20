import { createRouter, createWebHistory } from 'vue-router'

import PrototypeCatalogView from '../views/prototype/PrototypeCatalogView.vue'
import PrototypeFrameView from '../views/prototype/PrototypeFrameView.vue'
import AppLayout from '../components/AppLayout.vue'

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

import { resolveLandingByRole } from '../config/auth'
import { inferSlugByPath } from '../config/prototypeFlow'
import { useAuthStore } from '../stores'

const P = (slug) => ({
  component: PrototypeFrameView,
  props: { slug },
})

const routes = [
  { path: '/', redirect: '/logistics/dashboard' },

  { path: '/prototype', name: 'prototype-catalog', component: PrototypeCatalogView, meta: { title: '原型目录' } },
  { path: '/prototype/:slug', name: 'prototype-frame', component: PrototypeFrameView, meta: { title: '原型预览' } },
  { path: '/system/settings', ...P('a05_pc'), meta: { title: '系统设置' } },

  { path: '/login', ...P('p01_pc'), meta: { title: '登录' } },
  { path: '/public/login', redirect: '/login' },
  { path: '/register', ...P('p02_pc'), meta: { title: '注册' } },
  { path: '/public/register', redirect: '/register' },
  { path: '/public/pending', ...P('p03_pc'), meta: { title: '审核中' } },
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

  { path: '/farmer/dashboard', ...P('f01_pc'), meta: { title: '农户工作台', role: 'FARMER' } },
  { path: '/farmer/batch-create', ...P('f02_pc'), meta: { title: '新建批次', role: 'FARMER' } },
  { path: '/farmer/records/:batchId', component: PrototypeFrameView, props: { slug: 'f03_pc' }, meta: { title: '农事记录', role: 'FARMER' } },
  { path: '/farmer/batches', ...P('f04_pc'), meta: { title: '我的批次', role: 'FARMER' } },
  { path: '/farmer/batch-detail/:batchId', component: PrototypeFrameView, props: { slug: 'f05_pc' }, meta: { title: '批次详情', role: 'FARMER' } },

  { path: '/processor/dashboard', ...P('m01_pc'), meta: { title: '加工方工作台', role: 'PROCESSOR' } },
  { path: '/processor/pending', ...P('m02_pc'), meta: { title: '待加工批次', role: 'PROCESSOR' } },
  { path: '/processor/process-record/:batchId', component: PrototypeFrameView, props: { slug: 'm03_pc' }, meta: { title: '加工记录', role: 'PROCESSOR' } },
  { path: '/processor/file-upload/:batchId', component: PrototypeFrameView, props: { slug: 'm04_pc' }, meta: { title: '报告上传', role: 'PROCESSOR' } },
  { path: '/processor/batch-detail/:batchId', component: PrototypeFrameView, props: { slug: 'm05_pc' }, meta: { title: '批次详情', role: 'PROCESSOR' } },

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
  if (isDev) {
    const role = neededRole(to.path) || 'LOGISTICS'
    if (user.role !== role) {
      localStorage.setItem('user', JSON.stringify({ id: 'dev', username: '开发者', role }))
      // 清除旧 token，触发自动登录
      localStorage.removeItem('token')
      const authStore = useAuthStore()
      authStore.refreshFromStorage()
    }
    if (to.path === '/') { next(resolveLandingByRole(role)); return }
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
