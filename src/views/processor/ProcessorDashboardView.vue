<template>
  <div class="flex-1 overflow-y-auto">
    <!-- Welcome Card -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 relative overflow-hidden">
      <div class="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-100/50 to-transparent pointer-events-none"></div>
      <h2 class="text-2xl font-bold text-slate-900 mb-2 font-manrope">加工处理中心</h2>
      <p class="text-sm text-slate-500 max-w-2xl">当前加工批次、质量检验和链上溯源记录概览。</p>
    </div>

    <!-- Statistics Grid -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <div
        v-for="s in stats" :key="s.label"
        class="bg-white p-4 rounded-lg border shadow-sm flex flex-col justify-between h-28"
        :class="s.danger ? 'border-red-200 bg-red-50' : 'border-slate-200'"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-500">{{ s.label }}</span>
          <span class="material-icons text-xl" :class="s.iconClass">{{ s.icon }}</span>
        </div>
        <div class="text-2xl font-bold" :class="s.danger ? 'text-red-700' : 'text-slate-900'">{{ s.value }}</div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <!-- Table Area -->
      <div class="xl:col-span-8 lg:col-span-12 flex flex-col gap-6">
        <!-- 待处理列表：仅显示状态=1（待加工）的批次 -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">待处理列表</h3>
            <router-link
              to="/processor/pending"
              class="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              查看全部 <span class="material-icons text-sm">arrow_forward</span>
            </router-link>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">BatchID</th>
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">产品名称</th>
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">农户</th>
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">产地</th>
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">提交时间</th>
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">当前状态</th>
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in pendingList" :key="i"
                  class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td class="p-4 text-sm font-mono text-slate-900 whitespace-nowrap">{{ row.batchId }}</td>
                  <td class="p-4 text-sm text-slate-900 whitespace-nowrap">{{ row.productName }}</td>
                  <td class="p-4 text-sm text-slate-500 whitespace-nowrap">{{ row.farmer }}</td>
                  <td class="p-4 text-sm text-slate-500 whitespace-nowrap">{{ row.origin }}</td>
                  <td class="p-4 text-sm text-slate-500 whitespace-nowrap">{{ row.submitTime }}</td>
                  <td class="p-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      :class="statusClass(row.status)"
                    >{{ row.statusLabel || row.status }}</span>
                  </td>
                  <td class="p-4 text-right whitespace-nowrap">
                    <button
                      @click="viewDetail(row)"
                      class="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors mr-3"
                    >详情</button>
                    <button
                      v-if="row.statusCode === 1"
                      @click="handleProcess(row)"
                      class="text-xs font-medium text-blue-600 hover:underline"
                    >处理批次</button>
                  </td>
                </tr>
                <tr v-if="!pendingList.length">
                  <td colspan="7" class="p-8 text-center text-sm text-slate-400">暂无待处理批次</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 全部列表：显示所有批次的完整列表 -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">全部列表</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">BatchID</th>
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">产品名称</th>
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">农户</th>
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">产地</th>
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">提交时间</th>
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">当前状态</th>
                  <th class="p-4 text-xs font-medium text-slate-500 whitespace-nowrap text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in allPageRows" :key="i"
                  class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td class="p-4 text-sm font-mono text-slate-900 whitespace-nowrap">{{ row.batchId }}</td>
                  <td class="p-4 text-sm text-slate-900 whitespace-nowrap">{{ row.productName }}</td>
                  <td class="p-4 text-sm text-slate-500 whitespace-nowrap">{{ row.farmer }}</td>
                  <td class="p-4 text-sm text-slate-500 whitespace-nowrap">{{ row.origin }}</td>
                  <td class="p-4 text-sm text-slate-500 whitespace-nowrap">{{ row.submitTime }}</td>
                  <td class="p-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      :class="statusClass(row.status)"
                    >{{ row.statusLabel || row.status }}</span>
                  </td>
                  <td class="p-4 text-right whitespace-nowrap">
                    <button
                      @click="viewDetail(row)"
                      class="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors mr-3"
                    >详情</button>
                    <button
                      v-if="row.statusCode === 1"
                      @click="handleProcess(row)"
                      class="text-xs font-medium text-blue-600 hover:underline"
                    >处理批次</button>
                  </td>
                </tr>
                <tr v-if="!allBatches.length">
                  <td colspan="7" class="p-8 text-center text-sm text-slate-400">暂无批次数据</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- 全部列表分页 -->
          <div class="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <div class="text-xs text-slate-500">
              显示第 <span class="font-medium text-slate-900">{{ allPageStart }}</span> 到 <span class="font-medium text-slate-900">{{ allPageEnd }}</span> 条，共 <span class="font-medium text-slate-900">{{ allBatches.length }}</span> 条
            </div>
            <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button
                @click="allPage--"
                :disabled="allPage === 1"
                class="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
              >
                <span class="material-icons text-lg">chevron_left</span>
              </button>
              <template v-for="p in allPageNumbers" :key="p">
                <span v-if="p === '...'" class="relative inline-flex items-center px-4 py-2 text-sm text-slate-400">...</span>
                <button
                  v-else
                  @click="allPage = p"
                  class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 focus:z-20"
                  :class="p === allPage ? 'z-10 bg-blue-600 text-white' : 'text-slate-900 hover:bg-slate-50'"
                >{{ p }}</button>
              </template>
              <button
                @click="allPage++"
                :disabled="allPage >= totalAllPages"
                class="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
              >
                <span class="material-icons text-lg">chevron_right</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <!-- Quick Access Sidebar -->
      <div class="xl:col-span-4 lg:col-span-12">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">快捷入口</h3>
          <div class="grid grid-cols-1 gap-3">
            <router-link
              to="/processor/pending"
              class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left"
            >
              <div class="bg-blue-100 text-blue-600 p-2 rounded-md">
                <span class="material-icons text-xl">precision_manufacturing</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-slate-900">待加工批次</div>
                <div class="text-xs text-slate-500 mt-0.5">查看所有待处理批次</div>
              </div>
              <span class="material-icons text-slate-400 text-sm">chevron_right</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { batchApi } from '../../services/api'

const router = useRouter()

const allBatches = ref([])
const allPage = ref(1)
const ALL_PAGE_SIZE = 8

const totalAllPages = computed(() => Math.max(1, Math.ceil(allBatches.value.length / ALL_PAGE_SIZE)))
const allPageStart = computed(() => (allPage.value - 1) * ALL_PAGE_SIZE + 1)
const allPageEnd = computed(() => Math.min(allPage.value * ALL_PAGE_SIZE, allBatches.value.length))
const allPageRows = computed(() => {
  const start = (allPage.value - 1) * ALL_PAGE_SIZE
  return allBatches.value.slice(start, start + ALL_PAGE_SIZE)
})
const allPageNumbers = computed(() => {
  const pages = []
  const total = totalAllPages.value
  const cur = allPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }
  pages.push(1)
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

const stats = computed(() => [
  { label: '待加工批次', value: allBatches.value.filter(r => r.statusCode === 1).length, icon: 'pending_actions', iconClass: 'text-blue-600' },
  { label: '已质检批次', value: allBatches.value.filter(r => r.statusCode === 2).length, icon: 'fact_check', iconClass: 'text-green-600' },
  { label: '已上链记录', value: allBatches.value.length, icon: 'link', iconClass: 'text-green-600' },
])

const pendingList = computed(() =>
  allBatches.value.filter(r => r.statusCode === 1)
)

const statusClass = (status) => {
  const map = {
    'FarmRecorded': 'bg-blue-100 text-blue-700',
    'FARM_RECORDED': 'bg-blue-100 text-blue-700',
    '待加工': 'bg-blue-100 text-blue-700',
    'ProcessRecorded': 'bg-emerald-100 text-emerald-700',
    '已加工': 'bg-emerald-100 text-emerald-700',
  }
  return map[status] || 'bg-slate-100 text-slate-600'
}

const handleProcess = (row) => {
  router.push(`/processor/process-record/${row.batchId}`)
}

const viewDetail = (row) => {
  router.push(`/processor/batch-detail/${row.batchId}`)
}

onMounted(async () => {
  try {
    const data = await batchApi.getDashboardRows('PROCESSOR')
    if (data && data.length) {
      allBatches.value = data.map((item) => ({
        batchId: item.id,
        productName: item.product,
        farmer: item.farmer,
        origin: item.origin,
        submitTime: item.updatedAt,
        status: item.status,
        statusLabel: item.statusLabel,
        statusCode: item.statusCode,
      }))
    }
  } catch {}
})

watch(allBatches, () => { allPage.value = 1 })
</script>
