<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">待运输批次</h1>
        <p class="text-sm text-slate-500 mt-1">查看已通过加工审核、待物流接收的批次。</p>
      </div>
      <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="refresh">刷新列表</button>
    </header>

    <section class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[700px]">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="text-left px-4 py-3 font-semibold">批次号</th>
              <th class="text-left px-4 py-3 font-semibold">产品</th>
              <th class="text-left px-4 py-3 font-semibold">产地</th>
              <th class="text-left px-4 py-3 font-semibold">加工方</th>
              <th class="text-left px-4 py-3 font-semibold">加工完成时间</th>
              <th class="text-left px-4 py-3 font-semibold">状态</th>
              <th class="text-left px-4 py-3 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading" class="border-t border-slate-100">
              <td colspan="7" class="px-4 py-8 text-center text-slate-400">加载中...</td>
            </tr>
            <tr v-else-if="!rows.length" class="border-t border-slate-100">
              <td colspan="7" class="px-4 py-8 text-center text-slate-400">暂无待运输批次</td>
            </tr>
            <tr v-for="row in rows" :key="row.id || row.batchId" class="border-t border-slate-100">
              <td class="px-4 py-3 font-mono text-xs">{{ row.batchId || row.id }}</td>
              <td class="px-4 py-3 text-slate-700">{{ row.productName || row.product || '--' }}</td>
              <td class="px-4 py-3 text-slate-500">{{ row.origin || '--' }}</td>
              <td class="px-4 py-3 text-slate-500">{{ row.processor || '--' }}</td>
              <td class="px-4 py-3 text-slate-500">{{ row.processedAt || row.updatedAt || '--' }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">待运输</span>
              </td>
              <td class="px-4 py-3">
                <button class="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-md" @click="acceptTask(row)">接收任务</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLogisticsStore } from '../../stores'

const router = useRouter()
const store = useLogisticsStore()

const rows = computed(() => store.pendingBatches || [])

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
