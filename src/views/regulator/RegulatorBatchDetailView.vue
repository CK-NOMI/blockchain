<template>
  <div class="space-y-6">
    <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">监管批次详情</h1>
        <p class="text-sm text-slate-500 mt-1">查看真实批次的全链路记录、证据与当前状态。</p>
      </div>
      <div class="flex gap-2">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold" @click="goAudit">审计处理</button>
        <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="$router.back()">返回</button>
      </div>
    </header>

    <div v-if="loading" class="text-center py-12 text-slate-400">加载中...</div>
    <div v-else-if="error" class="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl p-4 text-sm">{{ error }}</div>

    <template v-else-if="batch">
      <section class="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-wrap gap-4 text-sm">
        <div><span class="text-slate-500">批次号：</span><span class="font-mono font-semibold">{{ batch.batchId }}</span></div>
        <div><span class="text-slate-500">产品：</span><span>{{ batch.productName || '--' }}</span></div>
        <div><span class="text-slate-500">产地：</span><span>{{ batch.origin || '--' }}</span></div>
        <div><span class="text-slate-500">状态：</span><span class="font-semibold" :class="statusTextClass">{{ batch.status || '--' }}</span></div>
        <div><span class="text-slate-500">风险等级：</span><span class="font-semibold" :class="riskLevel === '高' ? 'text-rose-700' : 'text-emerald-700'">{{ riskLevel }}</span></div>
      </section>

      <div class="grid grid-cols-12 gap-5">
        <section class="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">全链路时间轴</h2>
          <div v-if="!timeline.length" class="text-center py-6 text-slate-400">暂无溯源记录</div>
          <ol v-else class="relative border-l-2 border-slate-200 ml-3 space-y-5">
            <li v-for="(item, i) in timeline" :key="i" class="pl-6 relative">
              <span class="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white bg-green-500"></span>
              <div class="text-xs text-slate-400">{{ item.time || item.timestamp || '--' }}</div>
              <div class="text-sm text-slate-700 font-semibold">{{ item.stage || item.type || '--' }}</div>
              <div class="text-xs text-slate-500">{{ item.detail || item.description || '--' }}</div>
              <div v-if="item.transactionHash || item.txHash" class="text-[10px] text-emerald-600 font-mono mt-1">TX: {{ item.transactionHash || item.txHash }}</div>
            </li>
          </ol>
        </section>

        <aside class="col-span-12 lg:col-span-4 space-y-4">
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 class="text-base font-semibold text-slate-800 mb-4">批次信息</h3>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4"><dt class="text-slate-500">分类</dt><dd class="text-slate-800">{{ batch.category || '--' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">数量</dt><dd class="text-slate-800">{{ batch.quantity ?? '--' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">责任人</dt><dd class="text-slate-800">{{ batch.principalName || batch.farmer || batch.owner || '--' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">采收日期</dt><dd class="text-slate-800">{{ batch.harvestDate || '--' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">加工方</dt><dd class="text-slate-800">{{ batch.processOperator || batch.processType || '--' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">物流信息</dt><dd class="text-slate-800 text-right">{{ batch.vehicleInfo || '--' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">零售位置</dt><dd class="text-slate-800">{{ batch.storeLocation || '--' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">销售状态</dt><dd class="text-slate-800">{{ batch.saleStatus || '--' }}</dd></div>
            </dl>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 class="text-base font-semibold text-slate-800 mb-4">链上证据</h3>
            <dl class="space-y-3 text-sm">
              <div><dt class="text-slate-500 mb-1">文件哈希</dt><dd class="text-slate-800 font-mono text-[11px] break-all">{{ batch.fileHash || '--' }}</dd></div>
              <div><dt class="text-slate-500 mb-1">批次链上 ID</dt><dd class="text-slate-800 font-mono text-[11px] break-all">{{ batch.chainBatchId || batch.batchId }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">区块高度</dt><dd class="text-slate-800">{{ batch.blockNumber || '--' }}</dd></div>
            </dl>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { batchApi } from '../../services/api'

const route = useRoute()
const router = useRouter()
const batchId = computed(() => route.params.batchId || '')
const batch = ref(null)
const loading = ref(false)
const error = ref('')
const timeline = computed(() => batch.value?.timeline || [])

const riskLevel = computed(() => {
  const code = Number(batch.value?.chainStatusCode ?? -1)
  const text = String(batch.value?.status || '')
  return code === 10 || text.includes('异常') || text.toLowerCase().includes('abnormal') ? '高' : '低'
})

const statusTextClass = computed(() => riskLevel.value === '高' ? 'text-rose-700' : 'text-emerald-700')

function goAudit() {
  router.push('/regulator/audit/' + batchId.value)
}

async function loadDetail() {
  if (!batchId.value) return
  loading.value = true
  error.value = ''
  try {
    batch.value = await batchApi.getBatchDetail(batchId.value)
  } catch (err) {
    error.value = err?.message || '批次详情加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadDetail)
</script>
