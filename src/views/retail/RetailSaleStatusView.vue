<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">销售状态管理</h1>
        <p class="text-sm text-slate-500 mt-1">更新商品上架、销售与售罄状态。</p>
      </div>
      <div class="flex gap-2">
        <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="$router.push(`/retail/batch-detail/${batchId}`)">查看详情</button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold" :disabled="submitting" @click="updateStatus">
          {{ submitting ? '提交中...' : '更新状态上链' }}
        </button>
      </div>
    </header>

    <section class="bg-blue-50 rounded-xl p-4 border border-blue-100 flex gap-4 text-sm">
      <div><span class="text-slate-500">批次号：</span><span class="font-mono font-semibold">{{ batchId }}</span></div>
      <div><span class="text-slate-500">当前状态：</span><span class="text-blue-700 font-semibold">{{ currentStatus }}</span></div>
    </section>

    <div class="grid grid-cols-12 gap-5">
      <section class="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-5">销售状态更新</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button v-for="opt in statusOptions" :key="opt.value"
            class="p-4 rounded-xl border-2 text-center transition-colors"
            :class="form.newStatus === opt.value ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'"
            @click="form.newStatus = opt.value">
            <div class="text-lg mb-1">{{ opt.icon }}</div>
            <div class="text-sm font-semibold" :class="form.newStatus === opt.value ? 'text-blue-700' : 'text-slate-700'">{{ opt.label }}</div>
            <div class="text-[10px] text-slate-400 mt-1">{{ opt.desc }}</div>
          </button>
        </div>
        <form class="grid grid-cols-1 gap-4" @submit.prevent>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">备注说明</label>
            <textarea v-model="form.remark" rows="2" placeholder="状态变更说明..." class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 resize-none"></textarea>
          </div>
        </form>
      </section>

      <aside class="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
        <h3 class="text-base font-semibold text-slate-800 mb-4">状态流水</h3>
        <div class="space-y-3 text-sm">
          <div v-for="(s, i) in statusHistory" :key="i" class="flex items-center gap-3 p-2 rounded-lg" :class="i === 0 ? 'bg-blue-50' : 'bg-slate-50'">
            <span class="text-xs text-slate-400 w-16">{{ s.time }}</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold" :class="statusBadge(s.status)">{{ STATUS_LABELS[s.status] || s.status }}</span>
          </div>
          <div v-if="!statusHistory.length" class="text-center text-slate-400 py-4">暂无状态变更记录</div>
        </div>
        <div v-if="txHash" class="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs">
          <p class="text-emerald-700 font-semibold mb-1">上链成功</p>
          <p class="text-emerald-600 font-mono break-all">TX: {{ txHash }}</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetailStore } from '../../stores'

const route = useRoute()
const router = useRouter()
const store = useRetailStore()

const batchId = computed(() => route.params.batchId || 'SC20240521001')
const submitting = ref(false)
const txHash = ref('')

const currentStatus = ref('已入库 / Stored')
const form = reactive({ newStatus: 8, remark: '' })

const statusOptions = [
  { value: 8, label: '上架', icon: '📦', desc: '商品上架销售' },
  { value: 9, label: '售罄', icon: '✅', desc: '商品全部售出' },
  { value: 10, label: '异常', icon: '⚠️', desc: '标记异常状态' },
]

const STATUS_LABELS = { 6: '已送达', 7: '已入库', 8: '已上架', 9: '已售罄', 10: '异常' }

const statusHistory = ref([
  { time: '04-22', status: 7 },
  { time: '04-23', status: 8 },
])

function statusBadge(s) {
  if (s === 8 || s === 'OnSale') return 'bg-emerald-100 text-emerald-700'
  if (s === 9 || s === 'SoldOut') return 'bg-slate-100 text-slate-700'
  if (s === 7 || s === 'Stored') return 'bg-blue-100 text-blue-700'
  if (s === 10 || s === 'Abnormal') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

async function updateStatus() {
  if (!form.newStatus) {
    window.alert('请选择目标状态。')
    return
  }
  submitting.value = true
  try {
    const result = await store.updateSaleStatus(batchId.value, form.newStatus)
    txHash.value = result?.txHash || ''
    currentStatus.value = form.newStatus
    statusHistory.value.unshift({ time: new Date().toISOString().slice(5, 10), status: form.newStatus })
    window.alert('销售状态已更新上链')
  } catch (e) {
    window.alert('更新失败: ' + (e?.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}
</script>
