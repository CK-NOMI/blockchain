<template>
  <div class="space-y-6 font-['Manrope',sans-serif]">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">农户工作台</h2>
        <p class="text-slate-500 mt-1">批次进度与上链状态总览。</p>
      </div>
      <button class="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg" @click="goCreateBatch">新建批次</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <p class="text-xs text-slate-500">批次总数</p>
        <p class="text-2xl font-extrabold text-slate-900 mt-2">{{ stats.total }}</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <p class="text-xs text-slate-500">已上链</p>
        <p class="text-2xl font-extrabold text-emerald-600 mt-2">{{ stats.onChain }}</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <p class="text-xs text-slate-500">待处理</p>
        <p class="text-2xl font-extrabold text-amber-500 mt-2">{{ stats.pending }}</p>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 font-bold text-slate-800">最近批次</div>
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500">
          <tr>
            <th class="text-left px-5 py-3">批次号</th>
            <th class="text-left px-5 py-3">产品</th>
            <th class="text-left px-5 py-3">状态</th>
            <th class="text-left px-5 py-3">更新时间</th>
            <th class="text-left px-5 py-3">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-t border-slate-100">
            <td class="px-5 py-3 font-mono text-slate-700">{{ row.id }}</td>
            <td class="px-5 py-3">{{ row.product }}</td>
            <td class="px-5 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="row.statusClass">{{ row.status }}</span>
            </td>
            <td class="px-5 py-3 text-slate-500">{{ row.updatedAt }}</td>
            <td class="px-5 py-3">
              <button class="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 text-white" @click="openDetail(row.id)">查看</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBatchStore } from '../../stores'

const router = useRouter()
const batchStore = useBatchStore()

onMounted(async () => {
  if (!batchStore.dashboardRows.length) {
    await batchStore.loadDashboardRows('FARMER')
  }
})

const rows = computed(() => batchStore.dashboardRows)

const stats = computed(() => {
  const total = rows.value.length
  const onChain = rows.value.filter((item) => {
    const status = String(item.status || '')
    return status.includes('已上链') || status.includes('已完成') || status.includes('正常')
  }).length
  const pending = Math.max(total - onChain, 0)
  return { total, onChain, pending }
})

const goCreateBatch = () => router.push('/farmer/batch-create')
const openDetail = (id) => router.push(`/farmer/batch-detail/${id}`)
</script>
