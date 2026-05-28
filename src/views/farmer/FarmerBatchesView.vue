<template>
  <div class="space-y-6 font-['Manrope',sans-serif]">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">我的批次</h1>
        <p class="text-sm text-slate-500 mt-1">追踪从源头到上架的全生命周期。</p>
      </div>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
          @click="loadData"
        >刷新</button>
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
          @click="router.push('/farmer/batch-create')"
        >新建批次</button>
      </div>
    </header>

    <!-- 加载中 -->
    <div v-if="loading" class="text-center py-12 text-slate-500">加载中...</div>

    <!-- 列表 -->
    <div v-else class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <span class="font-bold text-slate-800">批次列表</span>
        <span class="text-xs text-slate-400">共 {{ rows.length }} 条</span>
      </div>

      <div v-if="rows.length === 0" class="px-5 py-12 text-center text-slate-400 text-sm">
        暂无批次数据，点击"新建批次"开始创建。
      </div>

      <table v-else class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500">
          <tr>
            <th class="text-left px-5 py-3">批次号</th>
            <th class="text-left px-5 py-3">产品</th>
            <th class="text-left px-5 py-3">产地</th>
            <th class="text-left px-5 py-3">状态</th>
            <th class="text-left px-5 py-3">更新时间</th>
            <th class="text-left px-5 py-3">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-t border-slate-100 hover:bg-slate-50">
            <td class="px-5 py-3 font-mono text-slate-700 text-xs">{{ row.id }}</td>
            <td class="px-5 py-3">{{ row.product }}</td>
            <td class="px-5 py-3 text-slate-500">{{ row.origin || '--' }}</td>
            <td class="px-5 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="row.statusClass">{{ row.status }}</span>
            </td>
            <td class="px-5 py-3 text-slate-500 text-xs">{{ row.updatedAt }}</td>
            <td class="px-5 py-3 space-x-2">
              <button
                class="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 text-white"
                @click="router.push(`/farmer/batch-detail/${row.id}`)"
              >详情</button>
              <button
                v-if="isCreated(row)"
                class="px-3 py-1.5 rounded-md text-xs font-semibold border border-blue-300 text-blue-700 hover:bg-blue-50"
                @click="router.push(`/farmer/records/${row.id}`)"
              >录入农事记录</button>
              <button
                v-else-if="isAbnormal(row)"
                class="px-3 py-1.5 rounded-md text-xs font-semibold border border-rose-300 text-rose-700 hover:bg-rose-50"
                @click="router.push(`/farmer/batch-detail/${row.id}`)"
              >查看异常</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { batchApi } from '../../services/api'

const router = useRouter()

const rows = ref([])
const loading = ref(true)

async function loadData() {
  loading.value = true
  try {
    const data = await batchApi.getDashboardRows('FARMER')
    rows.value = Array.isArray(data) ? data : []
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
}

function isCreated(row) {
  const code = Number(row.chainStatusCode ?? -1)
  const sc = String(row.statusCode || row.status || '')
  return code === 0 || sc === 'Created' || sc.includes('已创建') || sc.includes('待处理')
}

function isAbnormal(row) {
  const code = Number(row.chainStatusCode ?? -1)
  const sc = String(row.statusCode || row.status || '')
  return code === 10 || sc === 'Abnormal' || sc.includes('异常')
}

onMounted(loadData)
</script>
