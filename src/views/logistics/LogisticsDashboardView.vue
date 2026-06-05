<template>
  <div class="space-y-6">
    <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">物流方工作台</h1>
        <p class="text-sm text-slate-500 mt-1">监控运输任务与冷链温湿度遥测信息。</p>
      </div>
      <div class="flex gap-2">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold" @click="$router.push('/logistics/pending')">待运输批次</button>
        <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="refresh">刷新</button>
      </div>
    </header>

    <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <article v-for="card in stats" :key="card.label" class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-slate-500">{{ card.label }}</p>
        <p class="text-2xl font-black text-slate-900 mt-2">{{ card.value }}</p>
      </article>
    </section>

    <section class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-slate-900">运输相关批次</h2>
        <button class="text-sm text-blue-600 font-semibold" @click="$router.push('/logistics/pending')">查看全部</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[600px]">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="text-left px-4 py-3 font-semibold">批次号</th>
              <th class="text-left px-4 py-3 font-semibold">产品</th>
              <th class="text-left px-4 py-3 font-semibold">加工方</th>
              <th class="text-left px-4 py-3 font-semibold">状态</th>
              <th class="text-left px-4 py-3 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="border-t border-slate-100">
              <td colspan="5" class="px-4 py-8 text-center text-slate-400">加载中...</td>
            </tr>
            <tr v-else-if="!rows.length" class="border-t border-slate-100">
              <td colspan="5" class="px-4 py-8 text-center text-slate-400">暂无运输相关批次</td>
            </tr>
            <tr v-for="row in rows" :key="row.id" class="border-t border-slate-100">
              <td class="px-4 py-3 font-mono text-xs">{{ row.id }}</td>
              <td class="px-4 py-3 text-slate-700">{{ row.product }}</td>
              <td class="px-4 py-3 text-slate-500">{{ row.owner || '--' }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="statusClass(row.status)">{{ row.statusLabel || row.status }}</span>
              </td>
              <td class="px-4 py-3">
                <button v-if="Number(row.statusCode ?? row.chainStatusCode) === 2" class="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-md" @click="acceptTask(row)">接收任务</button>
                <button v-else class="px-3 py-1.5 text-xs font-semibold border border-slate-300 text-slate-700 rounded-md" @click="$router.push(`/logistics/batch-detail/${row.batchId || row.id}`)">详情</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLogisticsStore } from '../../stores'

const router = useRouter()
const store = useLogisticsStore()

const loading = computed(() => store.loading)
const rows = computed(() => store.pendingBatches || [])

const stats = computed(() => [
  { label: '待运输', value: rows.value.filter(r => Number(r.statusCode ?? r.chainStatusCode) === 2).length },
  { label: '已运输', value: rows.value.filter(r => Number(r.statusCode ?? r.chainStatusCode) >= 3).length },
  { label: '后续完成', value: rows.value.filter(r => Number(r.statusCode ?? r.chainStatusCode) >= 4).length },
  { label: '今日上链', value: '--' },
])

function statusClass(s) {
  const t = String(s || '').toLowerCase()
  if (t.includes('异常') || t.includes('abnormal')) return 'bg-rose-100 text-rose-700'
  if (t.includes('待处理') || t.includes('processed')) return 'bg-amber-100 text-amber-700'
  if (t.includes('运输中') || t.includes('transporting')) return 'bg-blue-100 text-blue-700'
  if (t.includes('已送达') || t.includes('delivered')) return 'bg-emerald-100 text-emerald-700'
  return 'bg-slate-100 text-slate-700'
}

function acceptTask(row) {
  const batchId = row.batchId || row.id
  router.push(`/logistics/transport-record/${batchId}`)
}

async function refresh() {
  await store.loadPendingBatches()
}

onMounted(() => {
  store.loadPendingBatches()
})
</script>
