<template>
  <div class="space-y-6">
    <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">超市零售方工作台</h1>
        <p class="text-sm text-slate-500 mt-1">管理入库、上架、销售状态与消费者溯源二维码。</p>
      </div>
      <div class="flex gap-2">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold" @click="$router.push('/retail/pending')">待入库批次</button>
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
        <h2 class="text-lg font-bold text-slate-900">在售商品</h2>
        <button class="text-sm text-blue-600 font-semibold" @click="$router.push(`/retail/sale-status/${rows[0]?.batchId || rows[0]?.id || ''}`)">销售管理</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[600px]">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="text-left px-4 py-3 font-semibold">批次号</th>
              <th class="text-left px-4 py-3 font-semibold">产品</th>
              <th class="text-left px-4 py-3 font-semibold">产地</th>
              <th class="text-left px-4 py-3 font-semibold">销售状态</th>
              <th class="text-left px-4 py-3 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading" class="border-t border-slate-100">
              <td colspan="5" class="px-4 py-8 text-center text-slate-400">加载中...</td>
            </tr>
            <tr v-else-if="!rows.length" class="border-t border-slate-100">
              <td colspan="5" class="px-4 py-8 text-center text-slate-400">暂无在售批次</td>
            </tr>
            <tr v-for="row in rows" :key="row.id || row.batchId" class="border-t border-slate-100">
              <td class="px-4 py-3 font-mono text-xs">{{ row.batchId || row.id }}</td>
              <td class="px-4 py-3 text-slate-700">{{ row.productName || row.product || '--' }}</td>
              <td class="px-4 py-3 text-slate-500">{{ row.origin || '--' }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="saleStatusClass(row.saleStatus || row.status)">{{ row.saleStatus || row.status || '--' }}</span>
              </td>
              <td class="px-4 py-3 flex gap-2">
                <button class="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded" @click="$router.push(`/retail/batch-detail/${row.batchId || row.id}`)">详情</button>
                <button class="px-2 py-1 text-xs font-semibold border border-slate-300 text-slate-700 rounded" @click="$router.push(`/retail/qrcode/${row.batchId || row.id}`)">二维码</button>
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
import { useRetailStore } from '../../stores'

const store = useRetailStore()

const rows = computed(() => store.pendingBatches || [])

const stats = computed(() => [
  { label: '待入库', value: rows.value.filter(r => (r.status || '').includes('Delivered') || (r.status || '').includes('已送达')).length },
  { label: '在售', value: rows.value.filter(r => (r.saleStatus || r.status || '').includes('OnSale') || (r.saleStatus || r.status || '').includes('在售')).length },
  { label: '已售罄', value: rows.value.filter(r => (r.saleStatus || r.status || '').includes('SoldOut') || (r.saleStatus || r.status || '').includes('售罄')).length },
  { label: '今日入库', value: '--' },
])

function saleStatusClass(s) {
  const t = String(s || '').toLowerCase()
  if (t.includes('onsale') || t.includes('在售')) return 'bg-emerald-100 text-emerald-700'
  if (t.includes('soldout') || t.includes('售罄')) return 'bg-slate-100 text-slate-700'
  if (t.includes('stored') || t.includes('已入库')) return 'bg-blue-100 text-blue-700'
  if (t.includes('delivered') || t.includes('已送达')) return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

async function refresh() {
  await store.loadPendingBatches()
}

onMounted(() => {
  store.loadPendingBatches()
})
</script>
