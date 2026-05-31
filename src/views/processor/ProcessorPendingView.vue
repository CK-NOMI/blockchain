<template>
  <div class="flex-1 overflow-y-auto">
    <!-- Breadcrumb -->
    <nav class="flex text-xs text-slate-500 mb-4">
      <ol class="inline-flex items-center space-x-1">
        <li><a class="hover:text-blue-600 transition-colors" href="#">批次管理</a></li>
        <li>
          <div class="flex items-center">
            <span class="material-icons text-sm mx-1">chevron_right</span>
            <span class="text-slate-900 font-medium">待加工批次</span>
          </div>
        </li>
      </ol>
    </nav>

    <!-- Page Header -->
    <div class="flex justify-between items-end mb-6">
      <h2 class="text-2xl font-bold text-slate-900 font-manrope">待加工批次</h2>
      <div class="text-sm text-slate-500 bg-slate-100 py-1.5 px-3 rounded-full flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
        共 {{ filteredList.length }} 个待处理批次
      </div>
    </div>

    <!-- Filter Section -->
    <div class="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1" for="fBatchId">BatchID</label>
          <input
            id="fBatchId"
            v-model="filters.batchId"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            placeholder="输入批次编号"
            type="text"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1" for="fProduct">产品名称</label>
          <div class="relative">
            <select
              id="fProduct"
              v-model="filters.product"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
            >
              <option value="">全部产品</option>
              <option value="有机红富士苹果">有机红富士苹果</option>
              <option value="翠香猕猴桃">翠香猕猴桃</option>
              <option value="高山云雾绿茶">高山云雾绿茶</option>
              <option value="赣南脐橙">赣南脐橙</option>
            </select>
            <span class="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">arrow_drop_down</span>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1" for="fFarmer">农户名称</label>
          <input
            id="fFarmer"
            v-model="filters.farmer"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            placeholder="输入农户/合作社名"
            type="text"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1" for="fDate">提交时间</label>
          <div class="relative">
            <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">calendar_month</span>
            <input
              id="fDate"
              v-model="filters.date"
              class="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              placeholder="选择日期范围"
              type="date"
            />
          </div>
        </div>
        <div class="lg:col-span-4 flex justify-end gap-3 mt-2">
          <button
            @click="resetFilters"
            class="px-4 py-2 rounded-lg border border-slate-300 text-slate-500 text-xs font-medium hover:bg-slate-100 transition-colors"
          >重置</button>
          <button
            @click="applyFilters"
            class="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span class="material-icons text-lg">search</span>
            查询
          </button>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">BatchID</th>
              <th class="py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">产品名称</th>
              <th class="py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">农户</th>
              <th class="py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">产地</th>
              <th class="py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">农户提交时间</th>
              <th class="py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">当前状态</th>
              <th class="py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap text-center">异常监控</th>
              <th class="py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap text-right">操作</th>
            </tr>
          </thead>
          <tbody class="text-sm text-slate-900 divide-y divide-slate-100">
            <tr
              v-for="(row, i) in pageRows" :key="i"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <td class="py-3 px-4 font-mono text-xs text-blue-800">{{ row.batchId }}</td>
              <td class="py-3 px-4 font-medium">{{ row.productName }}</td>
              <td class="py-3 px-4 text-slate-500">{{ row.farmer }}</td>
              <td class="py-3 px-4 text-slate-500">{{ row.origin }}</td>
              <td class="py-3 px-4 text-slate-500">{{ row.submitTime }}</td>
              <td class="py-3 px-4">
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border"
                  :class="statusClass(row.status)"
                >
                  <span class="material-icons text-sm">inventory</span>
                  {{ row.statusLabel || row.status }}
                </span>
              </td>
              <td class="py-3 px-4 text-center">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                  :class="row.abnormal ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700'"
                >
                  <span v-if="row.abnormal" class="material-icons text-xs">warning</span>
                  {{ row.abnormal ? '温度异常' : '正常' }}
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <div class="space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    @click="viewDetail(row)"
                    class="text-xs text-slate-500 hover:text-blue-600 transition-colors font-medium"
                  >查看详情</button>
                  <button
                    v-if="row.statusCode === 1"
                    @click="startProcess(row)"
                    class="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >开始加工</button>
                </div>
              </td>
            </tr>
            <tr v-if="!pageRows.length">
              <td colspan="8" class="p-8 text-center text-sm text-slate-400">暂无匹配的批次</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between">
        <div class="text-xs text-slate-500">
          显示第 <span class="font-medium text-slate-900">{{ pageStart }}</span> 到 <span class="font-medium text-slate-900">{{ pageEnd }}</span> 条，共 <span class="font-medium text-slate-900">{{ filteredList.length }}</span> 条结果
        </div>
        <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
          >
            <span class="material-icons text-lg">chevron_left</span>
          </button>
          <button
            v-for="p in pageNumbers" :key="p"
            @click="goPage(p)"
            class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 focus:z-20"
            :class="p === currentPage ? 'z-10 bg-blue-600 text-white' : 'text-slate-900 hover:bg-slate-50'"
          >{{ p }}</button>
          <button
            @click="nextPage"
            :disabled="currentPage >= totalPages"
            class="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
          >
            <span class="material-icons text-lg">chevron_right</span>
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { batchApi } from '../../services/api'

const router = useRouter()

const PAGE_SIZE = 5
const currentPage = ref(1)

const filters = ref({ batchId: '', product: '', farmer: '', date: '' })
const appliedFilters = ref({ batchId: '', product: '', farmer: '', date: '' })

const DEMO_DATA = []

const allData = ref([])

const statusClass = (status) => {
  const map = {
    'FarmRecorded': 'bg-slate-100 text-slate-600 border-slate-300',
    'FARM_RECORDED': 'bg-slate-100 text-slate-600 border-slate-300',
    'ProcessRecorded': 'bg-green-100 text-green-700 border-green-200',
  }
  return map[status] || 'bg-slate-100 text-slate-600 border-slate-300'
}

const filteredList = computed(() => {
  const f = appliedFilters.value
  return allData.value.filter((row) => {
    if (row.statusCode !== 1) return false
    if (f.batchId && !row.batchId.toLowerCase().includes(f.batchId.toLowerCase())) return false
    if (f.product && row.productName !== f.product) return false
    if (f.farmer && !row.farmer.includes(f.farmer)) return false
    if (f.date && row.submitTime.slice(0, 10) !== f.date) return false
    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredList.value.length / PAGE_SIZE)))
const pageStart = computed(() => (currentPage.value - 1) * PAGE_SIZE + 1)
const pageEnd = computed(() => Math.min(currentPage.value * PAGE_SIZE, filteredList.value.length))
const pageRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredList.value.slice(start, start + PAGE_SIZE)
})
const pageNumbers = computed(() => {
  const pages = []
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cur > 3) pages.push('...')
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
    if (cur < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages.filter((p) => p !== '...' || true)
})

const resetFilters = () => {
  filters.value = { batchId: '', product: '', farmer: '', date: '' }
  appliedFilters.value = { batchId: '', product: '', farmer: '', date: '' }
  currentPage.value = 1
}

const applyFilters = () => {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

const goPage = (p) => { if (p >= 1 && p <= totalPages.value) currentPage.value = p }
const prevPage = () => goPage(currentPage.value - 1)
const nextPage = () => goPage(currentPage.value + 1)

const viewDetail = (row) => {
  router.push(`/processor/batch-detail/${row.batchId}`)
}

const startProcess = (row) => {
  router.push(`/processor/process-record/${row.batchId}`)
}

// Initialize
batchApi.getDashboardRows('PROCESSOR').then((data) => {
  if (data && data.length) {
    allData.value = data.map((item) => ({
      batchId: item.id,
      productName: item.product,
      farmer: item.farmer,
      origin: item.origin,
      submitTime: item.updatedAt,
      status: item.status,
      statusLabel: item.statusLabel,
      statusCode: item.statusCode,
      abnormal: false,
    }))
  }
}).catch(() => {})
</script>
