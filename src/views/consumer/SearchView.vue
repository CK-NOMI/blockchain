<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-['Manrope',sans-serif] flex flex-col">
    <header class="sticky top-0 z-10 h-16 px-4 bg-white border-b border-slate-200 flex items-center justify-between">
      <div class="w-8"></div>
      <span class="text-base font-bold text-blue-700">Agri-Chain 溯源平台</span>
      <button class="w-8 h-8 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center">
        <span class="material-icons text-base">help_outline</span>
      </button>
    </header>

    <main class="flex-1 px-4 py-6 space-y-5">
      <section class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
        <div class="mx-auto w-24 h-24 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
          <span class="material-icons text-5xl">qr_code_scanner</span>
        </div>
        <h1 class="mt-4 text-2xl font-bold">验真溯源</h1>
        <p class="mt-2 text-sm text-slate-500">扫描包装二维码，查看不可篡改的区块链记录。</p>
        <button class="mt-5 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold" @click="fillDemoAndSearch">一键扫码（演示）</button>
      </section>

      <section class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <h2 class="text-base font-semibold">手动查询</h2>
        <label for="batch-id" class="block text-xs font-semibold text-slate-500">批次号 / 追踪码</label>
        <div class="flex gap-2">
          <input
            id="batch-id"
            v-model="batchId"
            type="text"
            placeholder="例如：SC20240521001"
            class="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm"
          />
          <button class="px-4 py-2.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold" @click="search">查询</button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBatchStore } from '../../stores'

const router = useRouter()
const batchStore = useBatchStore()
const batchId = ref('')

const search = async () => {
  const id = batchId.value.trim() || 'SC20240521001'
  await batchStore.searchTrace(id)
  router.push(`/trace/${id}`)
}

const fillDemoAndSearch = () => {
  batchId.value = 'SC20240521001'
  search()
}
</script>
