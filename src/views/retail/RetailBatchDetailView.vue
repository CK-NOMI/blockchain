<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">批次详情</h1>
        <p class="text-sm text-slate-500 mt-1">查看批次全链路溯源与零售信息。</p>
      </div>
      <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="$router.back()">返回</button>
    </header>

    <div v-if="store.loading" class="text-center py-12 text-slate-400">加载中...</div>
    <template v-else-if="batch">
      <section class="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-wrap gap-4 text-sm">
        <div><span class="text-slate-500">批次号：</span><span class="font-mono font-semibold">{{ batch.batchId }}</span></div>
        <div><span class="text-slate-500">产品：</span><span>{{ batch.productName }}</span></div>
        <div><span class="text-slate-500">状态：</span><span class="text-blue-700 font-semibold">{{ batch.status }}</span></div>
        <div><span class="text-slate-500">销售状态：</span><span class="text-emerald-700 font-semibold">{{ batch.saleStatus || '--' }}</span></div>
      </section>

      <div class="grid grid-cols-12 gap-5">
        <section class="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">全链路时间轴</h2>
          <div v-if="!timeline.length" class="text-center py-6 text-slate-400">暂无溯源记录</div>
          <ol v-else class="relative border-l-2 border-slate-200 ml-3 space-y-5">
            <li v-for="(item, i) in timeline" :key="i" class="pl-6 relative">
              <span class="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white" :class="timelineDot(item.type || item.stage)"></span>
              <div class="text-xs text-slate-400">{{ item.time || item.timestamp }}</div>
              <div class="text-sm text-slate-700 font-semibold">{{ item.type || item.stage }}</div>
              <div class="text-xs text-slate-500">{{ item.detail || item.description }}</div>
              <div v-if="item.txHash" class="text-[10px] text-emerald-600 font-mono mt-1">TX: {{ item.txHash }}</div>
            </li>
          </ol>
        </section>

        <aside class="col-span-12 lg:col-span-4 space-y-4">
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 class="text-base font-semibold text-slate-800 mb-4">零售信息</h3>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between"><dt class="text-slate-500">存储位置</dt><dd class="text-slate-800">{{ batch.storeLocation || '--' }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">入库时间</dt><dd class="text-slate-800">{{ batch.storedAt || '--' }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">销售状态</dt><dd class="text-slate-800 font-semibold">{{ batch.saleStatus || '--' }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">文件哈希</dt><dd class="text-slate-800 font-mono text-[10px] truncate max-w-[100px]">{{ batch.fileHash || '--' }}</dd></div>
            </dl>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 class="text-base font-semibold text-slate-800 mb-4">快捷操作</h3>
            <div class="space-y-2">
              <button class="w-full px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg" @click="$router.push(`/retail/qrcode/${batch.batchId}`)">生成溯源二维码</button>
              <button class="w-full px-3 py-2 text-sm font-semibold border border-slate-300 text-slate-700 rounded-lg" @click="$router.push(`/retail/sale-status/${batch.batchId}`)">管理销售状态</button>
            </div>
          </div>
        </aside>
      </div>
    </template>
    <div v-else class="text-center py-12 text-slate-400">批次不存在或加载失败</div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRetailStore } from '../../stores'

const route = useRoute()
const store = useRetailStore()

const batchId = computed(() => route.params.batchId || '')
const batch = computed(() => store.currentBatch)
const timeline = computed(() => store.timeline || [])

function timelineDot() {
  return 'bg-green-500'
}

onMounted(() => {
  if (batchId.value) store.loadBatchDetail(batchId.value)
})
</script>
