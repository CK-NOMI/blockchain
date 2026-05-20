<template>
  <div class="h-screen bg-slate-900 flex flex-col">
    <header class="h-14 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-slate-200">
      <div class="flex items-center gap-2 min-w-0">
        <button class="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700" @click="router.push('/prototype')">目录</button>
        <button class="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700" @click="goBackPath">返回</button>
        <span class="text-sm font-semibold truncate">{{ effectiveSlug }}</span>
      </div>
      <div class="flex items-center gap-2">
        <select
          class="px-2 py-1 text-xs rounded bg-slate-800 border border-slate-700 text-slate-100 max-w-[220px]"
          :value="route.path"
          @change="onJump($event)"
        >
          <option
            v-for="item in jumpLinks"
            :key="item.to"
            :value="item.to"
          >
            {{ item.label }}
          </option>
        </select>
        <template v-for="(item, idx) in quickActions" :key="`${item.label}-${idx}`">
          <button class="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500" @click="navigateTo(item.to)">{{ item.label }}</button>
        </template>
        <a :href="htmlPath" target="_blank" rel="noopener noreferrer" class="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600">打开HTML</a>
      </div>
    </header>

    <iframe ref="frameRef" class="flex-1 w-full border-0 bg-white" :src="htmlPath" :title="effectiveSlug" loading="eager" referrerpolicy="no-referrer"></iframe>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getPrototypeActions,
  inferRouteByText,
  inferSlugByPath,
  resolveRoleByRoute,
  SAMPLE_BATCH_ID,
} from '../../config/prototypeFlow'

const props = defineProps({
  slug: {
    type: String,
    default: '',
  },
})

const route = useRoute()
const router = useRouter()
const frameRef = ref(null)

const effectiveSlug = computed(() => String(props.slug || route.params.slug || 'unknown'))
const htmlPath = computed(() => `/prototypes/${effectiveSlug.value}.html`)
const batchId = computed(() => route.params.batchId || SAMPLE_BATCH_ID)
const quickActions = computed(() => getPrototypeActions(effectiveSlug.value, { batchId: batchId.value }))
const jumpLinks = computed(() => {
  const bid = batchId.value
  return [
    { label: '登录', to: '/login' },
    { label: '系统设置', to: '/system/settings' },
    { label: '管理端 · 平台概览', to: '/admin/dashboard' },
    { label: '管理端 · 用户审核', to: '/admin/user-audit' },
    { label: '管理端 · 用户与角色', to: '/admin/user-role' },
    { label: '管理端 · 节点状态', to: '/admin/node-status' },
    { label: '管理端 · 合约配置', to: '/admin/contract-config' },
    { label: '管理端 · 操作日志', to: '/admin/logs' },
    { label: '农户端 · 工作台', to: '/farmer/dashboard' },
    { label: '农户端 · 新建批次', to: '/farmer/batch-create' },
    { label: '农户端 · 农事记录', to: `/farmer/records/${bid}` },
    { label: '农户端 · 我的批次', to: '/farmer/batches' },
    { label: '农户端 · 批次详情', to: `/farmer/batch-detail/${bid}` },
    { label: '加工端 · 工作台', to: '/processor/dashboard' },
    { label: '加工端 · 待加工批次', to: '/processor/pending' },
    { label: '加工端 · 加工记录', to: `/processor/process-record/${bid}` },
    { label: '加工端 · 报告上传', to: `/processor/file-upload/${bid}` },
    { label: '加工端 · 批次详情', to: `/processor/batch-detail/${bid}` },
    { label: '物流端 · 工作台', to: '/logistics/dashboard' },
    { label: '物流端 · 待运输批次', to: '/logistics/pending' },
    { label: '物流端 · 运输记录', to: `/logistics/transport-record/${bid}` },
    { label: '物流端 · 温湿度记录', to: `/logistics/temp-record/${bid}` },
    { label: '物流端 · 批次详情V1', to: `/logistics/batch-detail/${bid}` },
    { label: '物流端 · 批次详情V2', to: `/logistics/batch-detail-v2/${bid}` },
    { label: '零售端 · 工作台', to: '/retail/dashboard' },
    { label: '零售端 · 待入库批次', to: '/retail/pending' },
    { label: '零售端 · 入库记录', to: `/retail/retail-record/${bid}` },
    { label: '零售端 · 销售状态', to: `/retail/sale-status/${bid}` },
    { label: '零售端 · 二维码V1', to: `/retail/qrcode/${bid}` },
    { label: '零售端 · 二维码V2', to: `/retail/qrcode-v2/${bid}` },
    { label: '零售端 · 批次详情', to: `/retail/batch-detail/${bid}` },
    { label: '监管端 · 风险看板', to: '/regulator/dashboard' },
    { label: '监管端 · 综合检索', to: '/regulator/search' },
    { label: '监管端 · 异常批次', to: '/regulator/abnormal' },
    { label: '监管端 · 批次详情', to: `/regulator/batch-detail/${bid}` },
    { label: '监管端 · 标记异常', to: `/regulator/flag/${bid}` },
    { label: '监管端 · 证据链V1', to: `/regulator/evidence/${bid}` },
    { label: '监管端 · 证据链V2', to: `/regulator/evidence-v2/${bid}` },
    { label: '监管端 · 审计处理', to: `/regulator/audit/${bid}` },
    { label: '监管端 · 审计日志', to: '/regulator/audit-logs' },
    { label: '监管端 · 风险统计', to: '/regulator/stats' },
    { label: '消费者 · 溯源查询', to: '/trace/search' },
    { label: '消费者 · 溯源详情', to: `/trace/${bid}` },
    { label: '消费者 · 时间线V1', to: `/trace/timeline/${bid}` },
    { label: '消费者 · 时间线H5', to: `/trace/timeline-h5/${bid}` },
    { label: '消费者 · 验真V1', to: `/trace/verify/${bid}` },
    { label: '消费者 · 验真V2', to: `/trace/verify-v2/${bid}` },
    { label: '消费者 · 问题反馈', to: `/trace/feedback/${bid}` },
    { label: '消费者 · 反馈成功V1', to: '/trace/feedback/success' },
    { label: '消费者 · 反馈成功V2', to: '/trace/feedback/success-v2' },
  ]
})

const sanitizeClickText = (value) => String(value || '')
  .replaceAll(/\s+/g, ' ')
  .replaceAll(/[\uFFFD]+/g, ' ')
  .trim()

const extractClickableText = (target) => {
  if (!target) return ''
  const cloned = target.cloneNode(true)
  cloned.querySelectorAll?.('.material-symbols-outlined').forEach((node) => node.remove())
  return sanitizeClickText(String(cloned.textContent || '').toLowerCase())
}

const SIDEBAR_ICON_HINTS = {
  l: [
    { hints: ['dashboard', 'grid_view'], to: '/logistics/dashboard' },
    { hints: ['pending_actions', 'factory', 'precision_manufacturing'], to: '/logistics/pending' },
    { hints: ['local_shipping', 'airport_shuttle', 'truck'], to: '/logistics/transport-record/:batchId' },
    { hints: ['fact_check', 'thermostat', 'sensors', 'settings_applications'], to: '/logistics/temp-record/:batchId' },
    { hints: ['history', 'history_edu', 'timeline'], to: '/logistics/batch-detail/:batchId' },
    { hints: ['settings', 'manage_accounts', 'tune'], to: '/system/settings' },
    { hints: ['logout'], to: '/public/logout' },
    { hints: ['contact_support', 'help', 'help_outline'], to: '/system/settings' },
  ],
  r: [
    { hints: ['dashboard'], to: '/retail/dashboard' },
    { hints: ['inventory_2', 'inventory', 'warehouse'], to: '/retail/pending' },
    { hints: ['qr_code_2', 'qr_code_scanner', 'qr_code'], to: '/retail/qrcode/:batchId' },
    { hints: ['sell', 'point_of_sale'], to: '/retail/sale-status/:batchId' },
    { hints: ['verified_user', 'history_edu', 'fact_check'], to: '/retail/batch-detail/:batchId' },
    { hints: ['settings', 'manage_accounts', 'tune'], to: '/system/settings' },
    { hints: ['logout'], to: '/public/logout' },
    { hints: ['contact_support', 'person', 'account_circle'], to: '/system/settings' },
  ],
  g: [
    { hints: ['dashboard'], to: '/regulator/dashboard' },
    { hints: ['search', 'manage_search', 'inventory_2', 'inventory'], to: '/regulator/search' },
    { hints: ['warning', 'gpp_maybe'], to: '/regulator/abnormal' },
    { hints: ['description', 'fact_check'], to: '/regulator/batch-detail/:batchId' },
    { hints: ['gavel'], to: '/regulator/audit/:batchId' },
    { hints: ['verified_user', 'history_edu', 'history'], to: '/regulator/audit-logs' },
    { hints: ['bar_chart', 'query_stats'], to: '/regulator/stats' },
    { hints: ['settings', 'manage_accounts', 'tune'], to: '/system/settings' },
    { hints: ['logout'], to: '/public/logout' },
    { hints: ['contact_support', 'help', 'help_outline'], to: '/system/settings' },
  ],
  m: [
    { hints: ['dashboard'], to: '/processor/dashboard' },
    { hints: ['precision_manufacturing', 'factory', 'pending_actions', 'inventory_2'], to: '/processor/pending' },
    { hints: ['fact_check', 'verified'], to: '/processor/process-record/:batchId' },
    { hints: ['upload_file', 'cloud_upload'], to: '/processor/file-upload/:batchId' },
    { hints: ['account_tree', 'link', 'history'], to: '/processor/batch-detail/:batchId' },
    { hints: ['settings', 'manage_accounts', 'tune'], to: '/system/settings' },
    { hints: ['logout'], to: '/public/logout' },
    { hints: ['contact_support', 'help', 'help_outline'], to: '/system/settings' },
  ],
  f: [
    { hints: ['dashboard'], to: '/farmer/dashboard' },
    { hints: ['add', 'add_box', 'add_circle'], to: '/farmer/batch-create' },
    { hints: ['inventory_2'], to: '/farmer/batches' },
    { hints: ['agriculture', 'edit_document', 'description'], to: '/farmer/records/:batchId' },
    { hints: ['verified', 'fact_check'], to: '/farmer/batch-detail/:batchId' },
    { hints: ['settings', 'manage_accounts', 'tune'], to: '/system/settings' },
    { hints: ['logout'], to: '/public/logout' },
    { hints: ['contact_support', 'help', 'help_outline', 'account_circle'], to: '/system/settings' },
  ],
  a: [
    { hints: ['dashboard', 'admin_panel_settings'], to: '/admin/dashboard' },
    { hints: ['manage_accounts', 'person_search', 'group', 'account_tree'], to: '/admin/user-role' },
    { hints: ['gavel', 'fact_check'], to: '/admin/user-audit' },
    { hints: ['lan', 'hub'], to: '/admin/node-status' },
    { hints: ['verified_user', 'shield'], to: '/admin/user-audit' },
    { hints: ['agriculture', 'local_shipping', 'settings_applications'], to: '/admin/contract-config' },
    { hints: ['history', 'history_edu', 'article'], to: '/admin/logs' },
    { hints: ['settings', 'tune'], to: '/system/settings' },
    { hints: ['logout'], to: '/public/logout' },
    { hints: ['contact_support', 'help', 'help_outline', 'account_circle', 'person'], to: '/system/settings' },
  ],
}

const inferSlugGroup = (slug) => String(slug || '').split('_')[0]?.charAt(0)?.toLowerCase() || ''
const SIDEBAR_DEFAULT_ROUTE_BY_GROUP = {
  a: '/admin/dashboard',
  f: '/farmer/dashboard',
  m: '/processor/dashboard',
  l: '/logistics/dashboard',
  r: '/retail/dashboard',
  g: '/regulator/dashboard',
  p: '/login',
  c: '/trace/search',
}

const getSidebarDefaultRoute = (slug, context) => {
  const group = inferSlugGroup(slug)
  const to = SIDEBAR_DEFAULT_ROUTE_BY_GROUP[group] || ''
  if (!to) return ''
  return String(to).replaceAll(':batchId', context.batchId)
}

const inferByIconHint = (target, context, slug) => {
  const group = inferSlugGroup(slug)
  const hintMap = SIDEBAR_ICON_HINTS[group] || []
  const iconNodes = target?.querySelectorAll?.('.material-symbols-outlined') || []
  const iconTexts = [...iconNodes]
    .map((node) => sanitizeClickText(node.textContent).toLowerCase())
    .filter(Boolean)

  if (!iconTexts.length) return ''
  for (const item of hintMap) {
    if (item.hints.some((hint) => iconTexts.some((icon) => icon.includes(hint)))) {
      return String(item.to).replaceAll(':batchId', context.batchId)
    }
  }
  return ''
}

const isSidebarClick = (target) => {
  const navContainer = target?.closest?.('aside, nav')
  if (!navContainer) return false
  if (String(navContainer.tagName || '').toLowerCase() === 'aside') return true

  const classText = String(navContainer.className || '').toLowerCase()
  const sidebarHints = ['w-64', 'h-screen', 'left-0', 'border-r', 'sidenav', 'side-nav', 'sidebar', 'flex-col']
  return sidebarHints.some((hint) => classText.includes(hint))
}

const ensureRoleContext = (to) => {
  const role = resolveRoleByRoute(to)
  if (!role) return
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  if (currentUser.role === role) return
  localStorage.setItem('user', JSON.stringify({ ...currentUser, role }))
}

const navigateTo = (to) => {
  if (!to) return
  ensureRoleContext(to)
  router.push(to)
}

const onJump = (event) => {
  const to = String(event?.target?.value || '')
  if (!to) return
  navigateTo(to)
}

const goBackPath = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/prototype')
}

const installClickProxy = () => {
  const iframe = frameRef.value
  if (!iframe?.contentWindow?.document) return false

  const doc = iframe.contentWindow.document

  const handler = (event) => {
    const isSubmit = event.type === 'submit'
    const target = isSubmit
      ? event.target
      : event.target?.closest?.(
        [
          'a',
          'button',
          '[role="button"]',
          '[onclick]',
          '[data-action]',
          '[data-route]',
          'li',
          '.cursor-pointer',
          '.clickable',
          '.nav-item',
        ].join(','),
      )
    if (!target) return

    const rawText = isSubmit
      ? String(target.querySelector?.('button[type="submit"],button')?.textContent || '').trim().toLowerCase()
      : extractClickableText(target)
    const text = sanitizeClickText(rawText)
    const href = isSubmit ? null : target.getAttribute('href')

    if (href && href !== '#' && !href.startsWith('javascript:')) {
      return
    }

    const context = { batchId: batchId.value }
    const sidebarClick = !isSubmit && isSidebarClick(target)
    const textResolved = inferRouteByText(effectiveSlug.value, text, context, { allowGroupFallback: sidebarClick })
    const iconResolved = sidebarClick ? inferByIconHint(target, context, effectiveSlug.value) : ''
    const fallbackRoute = sidebarClick ? getSidebarDefaultRoute(effectiveSlug.value, context) : ''
    const resolved = iconResolved || textResolved || fallbackRoute
    if (!resolved) return

    event.preventDefault()
    navigateTo(resolved)
  }

  doc.addEventListener('click', handler)
  doc.addEventListener('submit', handler)

  iframe.__codexClickHandler = handler
  return true
}

const cleanupClickProxy = () => {
  const iframe = frameRef.value
  const doc = iframe?.contentWindow?.document
  const handler = iframe?.__codexClickHandler
  if (doc && handler) {
    doc.removeEventListener('click', handler)
    doc.removeEventListener('submit', handler)
  }
}

const handleFrameLoad = () => {
  cleanupClickProxy()
  installClickProxy()
}

const ensureClickProxyInstalled = (retries = 8) => {
  cleanupClickProxy()
  const ok = installClickProxy()
  if (ok || retries <= 0) return
  setTimeout(() => ensureClickProxyInstalled(retries - 1), 120)
}

onMounted(() => {
  const iframe = frameRef.value
  iframe?.addEventListener('load', handleFrameLoad)
  ensureClickProxyInstalled()

  const inferred = inferSlugByPath(route.path)
  if (inferred && !props.slug && route.params.slug !== inferred && route.path !== `/prototype/${inferred}`) {
    // no-op, this component is also used directly with props in business routes
  }
})

onUnmounted(() => {
  const iframe = frameRef.value
  iframe?.removeEventListener('load', handleFrameLoad)
  cleanupClickProxy()
})

watch(
  () => effectiveSlug.value,
  () => {
    setTimeout(() => ensureClickProxyInstalled(), 80)
  },
)
</script>
