<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">批次详情</h1>
        <p class="text-sm text-slate-500 mt-1">查看批次全链路溯源与物流信息。</p>
      </div>
      <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="$router.back()">返回</button>
    </header>

    <div v-if="store.loading" class="text-center py-12 text-slate-400">加载中...</div>
    <template v-else-if="batch">
      <section class="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-wrap gap-4 text-sm">
        <div><span class="text-slate-500">批次号：</span><span class="font-mono font-semibold">{{ batch.batchId }}</span></div>
        <div><span class="text-slate-500">产品：</span><span>{{ batch.productName }}</span></div>
        <div><span class="text-slate-500">状态：</span><span class="text-blue-700 font-semibold">{{ batch.status }}</span></div>
      </section>

      <div class="grid grid-cols-12 gap-5">
        <section class="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">全链路时间轴</h2>
          <div v-if="!timeline.length" class="text-center py-6 text-slate-400">暂无溯源记录</div>
          <ol v-else class="relative border-l-2 border-slate-200 ml-3 space-y-5">
            <li v-for="(item, i) in timeline" :key="i" class="pl-6 relative">
              <span class="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white" :class="timelineDot(item.type)"></span>
              <div class="text-xs text-slate-400">{{ item.time || item.timestamp }}</div>
              <div class="text-sm text-slate-700 font-semibold">{{ item.type || item.stage }}</div>
              <div class="text-xs text-slate-500">{{ item.detail || item.description }}</div>
              <div v-if="item.txHash" class="text-[10px] text-emerald-600 font-mono mt-1">TX: {{ item.txHash }}</div>
            </li>
          </ol>
        </section>

        <aside class="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
          <h3 class="text-base font-semibold text-slate-800 mb-4">链上信息</h3>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between"><dt class="text-slate-500">批次ID</dt><dd class="font-mono text-slate-800 text-xs">{{ batch.batchId }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">当前状态</dt><dd class="text-slate-800 font-semibold">{{ batch.status }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">溯源记录数</dt><dd class="text-slate-800">{{ timeline.length }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">文件哈希</dt><dd class="text-slate-800 font-mono text-[10px] truncate max-w-[140px]">{{ batch.fileHash || '--' }}</dd></div>
          </dl>
        </aside>
      </div>
    </template>
    <div v-else class="text-center py-12 text-slate-400">批次不存在或加载失败</div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLogisticsStore } from '../../stores'

const route = useRoute()
const store = useLogisticsStore()

const batchId = computed(() => route.params.batchId || '')
const batch = computed(() => store.currentBatch)
const timeline = computed(() => store.timeline || [])

function timelineDot(type) {
  const t = String(type || '').toLowerCase()
  if (t.includes('farm') || t.includes('农事') || t.includes('生产')) return 'bg-green-500'
  if (t.includes('process') || t.includes('加工')) return 'bg-blue-500'
  if (t.includes('logistics') || t.includes('物流') || t.includes('transport') || t.includes('运输')) return 'bg-amber-500'
  if (t.includes('retail') || t.includes('零售') || t.includes('超市')) return 'bg-purple-500'
  if (t.includes('创建')) return 'bg-emerald-500'
  return 'bg-slate-400'
}

onMounted(() => {
  if (batchId.value) store.loadBatchDetail(batchId.value)
})
</script>
