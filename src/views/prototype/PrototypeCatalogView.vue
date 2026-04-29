<template>
  <div class="min-h-screen bg-slate-50 font-['Inter',sans-serif]">
    <header class="sticky top-0 z-10 bg-white border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-slate-900">Agri-Chain &#21407;&#22411;&#30446;&#24405;</h1>
          <p class="text-xs text-slate-500 mt-1">P/A/F/M/L/R/C/G &#20840;&#37327;&#21407;&#22411;&#39029;&#38754;&#30446;&#24405;</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white hover:bg-slate-100"
            @click="router.push('/login')"
          >
            &#19994;&#21153;&#20837;&#21475;
          </button>
          <button
            class="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white hover:bg-slate-100"
            @click="router.push('/system/settings')"
          >
            &#31995;&#32479;&#35774;&#32622;
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-5 py-6">
      <section class="mb-6 bg-white border border-slate-200 rounded-xl p-4">
        <div class="text-sm font-semibold text-slate-900 mb-3">&#26680;&#24515;&#19994;&#21153;&#20837;&#21475;</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="entry in entryLinks"
            :key="entry.to"
            class="px-3 py-1.5 rounded-full text-xs border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
            @click="router.push(entry.to)"
          >
            {{ entry.label }}
          </button>
        </div>
      </section>

      <div class="mb-4 flex flex-wrap gap-2">
        <button
          class="px-3 py-1.5 rounded-full text-xs font-semibold border"
          :class="activeGroup === 'ALL' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'"
          @click="activeGroup = 'ALL'"
        >
          &#20840;&#37096;
        </button>
        <button
          v-for="g in groups"
          :key="g"
          class="px-3 py-1.5 rounded-full text-xs font-semibold border"
          :class="activeGroup === g ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'"
          @click="activeGroup = g"
        >
          {{ g }}
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <article
          v-for="item in filteredItems"
          :key="item.slug"
          class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
        >
          <div class="h-40 bg-slate-100 border-b border-slate-200 flex items-center justify-center">
            <img
              v-if="item.screen"
              :src="item.screenPath"
              :alt="item.slug"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div v-else class="text-xs text-slate-400">&#26242;&#26080;&#39044;&#35272;</div>
          </div>
          <div class="p-3 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-sm font-bold text-slate-900 truncate">{{ item.slug }}</h2>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {{ item.group }}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <button
                class="px-2 py-1.5 rounded-lg text-xs bg-blue-600 text-white hover:bg-blue-500"
                @click="openInApp(item.slug)"
              >
                &#21407;&#22411;
              </button>
              <button
                class="px-2 py-1.5 rounded-lg text-xs border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!resolveBusinessRoute(item.slug)"
                @click="openBusiness(item.slug)"
              >
                &#19994;&#21153;
              </button>
              <a
                class="px-2 py-1.5 rounded-lg text-xs border border-slate-300 text-slate-700 text-center hover:bg-slate-100"
                :href="`/prototypes/${item.file}`"
                target="_blank"
                rel="noopener noreferrer"
              >
                HTML
              </a>
            </div>
            <div v-if="!resolveBusinessRoute(item.slug)" class="text-[10px] text-slate-400">
              &#20165;&#21487;&#20174;&#21407;&#22411;&#20837;&#21475;&#35775;&#38382;
            </div>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { SAMPLE_BATCH_ID } from '../../config/prototypeFlow'

const router = useRouter()
const activeGroup = ref('ALL')
const items = ref([])

const entryLinks = [
  { label: '\u767b\u5f55', to: '/login' },
  { label: '\u7cfb\u7edf\u8bbe\u7f6e', to: '/system/settings' },
  { label: '\u5e73\u53f0\u7ba1\u7406', to: '/admin/dashboard' },
  { label: '\u519c\u6237\u5de5\u4f5c\u53f0', to: '/farmer/dashboard' },
  { label: '\u52a0\u5de5\u65b9\u5de5\u4f5c\u53f0', to: '/processor/dashboard' },
  { label: '\u7269\u6d41\u65b9\u5de5\u4f5c\u53f0', to: '/logistics/dashboard' },
  { label: '\u96f6\u552e\u65b9\u5de5\u4f5c\u53f0', to: '/retail/dashboard' },
  { label: '\u76d1\u7ba1\u65b9\u5de5\u4f5c\u53f0', to: '/regulator/dashboard' },
  { label: '\u6d88\u8d39\u8005\u6eaf\u6e90', to: '/trace/search' },
]

const businessRouteBySlug = {
  p01_pc: '/login',
  p02_pc: '/register',
  p03_pc: '/public/pending',
  p04_pc: '/common/403',
  p05_404_pc: '/common/404',
  p06_pc_1: '/public/logout',
  p06_pc_2: '/public/logout-alt',

  a01_pc: '/admin/dashboard',
  a02_pc: '/admin/user-audit',
  a03_pc: '/admin/user-role',
  a04_pc: '/admin/node-status',
  a05_pc: '/admin/contract-config',
  a06_pc: '/admin/logs',

  f01_pc: '/farmer/dashboard',
  f02_pc: '/farmer/batch-create',
  f03_pc: `/farmer/records/${SAMPLE_BATCH_ID}`,
  f04_pc: '/farmer/batches',
  f05_pc: `/farmer/batch-detail/${SAMPLE_BATCH_ID}`,

  m01_pc: '/processor/dashboard',
  m02_pc: '/processor/pending',
  m03_pc: `/processor/process-record/${SAMPLE_BATCH_ID}`,
  m04_pc: `/processor/file-upload/${SAMPLE_BATCH_ID}`,
  m05_pc: `/processor/batch-detail/${SAMPLE_BATCH_ID}`,

  l01_pc: '/logistics/dashboard',
  l02_pc: '/logistics/pending',
  l03_pc: `/logistics/transport-record/${SAMPLE_BATCH_ID}`,
  l04_pc: `/logistics/temp-record/${SAMPLE_BATCH_ID}`,
  l05_pc_1: `/logistics/batch-detail/${SAMPLE_BATCH_ID}`,
  l05_pc_2: `/logistics/batch-detail-v2/${SAMPLE_BATCH_ID}`,

  r01_pc: '/retail/dashboard',
  r02_pc: '/retail/pending',
  r03_pc: `/retail/retail-record/${SAMPLE_BATCH_ID}`,
  r04_pc: `/retail/sale-status/${SAMPLE_BATCH_ID}`,
  r05_pc_1: `/retail/qrcode/${SAMPLE_BATCH_ID}`,
  r05_pc_2: `/retail/qrcode-v2/${SAMPLE_BATCH_ID}`,
  r06_pc: `/retail/batch-detail/${SAMPLE_BATCH_ID}`,

  g01_pc: '/regulator/dashboard',
  g02_pc: '/regulator/search',
  g03_pc: '/regulator/abnormal',
  g04_pc: `/regulator/batch-detail/${SAMPLE_BATCH_ID}`,
  g05_pc: `/regulator/flag/${SAMPLE_BATCH_ID}`,
  g06_pc_1: `/regulator/evidence/${SAMPLE_BATCH_ID}`,
  g06_pc_2: `/regulator/evidence-v2/${SAMPLE_BATCH_ID}`,
  g07_pc: `/regulator/audit/${SAMPLE_BATCH_ID}`,
  g08_pc: '/regulator/audit-logs',
  g09_pc: '/regulator/stats',

  c01_mobile: '/trace/search',
  c02_mobile: `/trace/${SAMPLE_BATCH_ID}`,
  c03_mobile: `/trace/timeline/${SAMPLE_BATCH_ID}`,
  c03_mobile_h5: `/trace/timeline-h5/${SAMPLE_BATCH_ID}`,
  c04_mobile_1: `/trace/verify/${SAMPLE_BATCH_ID}`,
  c04_mobile_2: `/trace/verify-v2/${SAMPLE_BATCH_ID}`,
  c05_mobile: `/trace/feedback/${SAMPLE_BATCH_ID}`,
  c06_mobile_1: '/trace/feedback/success',
  c06_mobile_2: '/trace/feedback/success-v2',
  agrichain_traceability_system: '/login',
}

const groups = computed(() =>
  [...new Set(items.value.map((it) => (it.slug.split('_')[0] || '').toUpperCase()))].sort(),
)

const filteredItems = computed(() => {
  if (activeGroup.value === 'ALL') return items.value
  return items.value.filter((it) => (it.slug.split('_')[0] || '').toUpperCase() === activeGroup.value)
})

const resolveBusinessRoute = (slug) => businessRouteBySlug[String(slug || '')] || ''

const openInApp = (slug) => {
  router.push(`/prototype/${slug}`)
}

const openBusiness = (slug) => {
  const to = resolveBusinessRoute(slug)
  if (!to) return
  router.push(to)
}

onMounted(async () => {
  try {
    const res = await fetch('/prototypes/manifest.json')
    items.value = await res.json()
  } catch {
    items.value = []
  }
})
</script>
