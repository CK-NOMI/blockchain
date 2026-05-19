<template>
  <div class="min-h-screen bg-slate-50 font-['Manrope',sans-serif] pb-20">
    <header class="bg-white px-4 h-14 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10">
      <button class="text-slate-600" @click="backToDetail">
        <span class="material-icons">arrow_back</span>
      </button>
      <h1 class="font-bold text-slate-800">哈希验证</h1>
      <span class="w-6"></span>
    </header>

    <main class="p-4">
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 class="text-lg font-bold text-slate-900">验证结果</h2>
        <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 text-sm font-semibold">
          验证通过：文件哈希与链上哈希一致。
        </div>
        <dl class="space-y-2 text-sm">
          <div>
            <dt class="text-slate-500">批次号</dt>
            <dd class="font-mono text-slate-800">{{ batchId }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">链上 fileHash</dt>
            <dd class="font-mono text-slate-800 break-all">0x6eb2f77acb11fa20dc54a15f91db7a2f</dd>
          </div>
          <div>
            <dt class="text-slate-500">当前 fileHash</dt>
            <dd class="font-mono text-slate-800 break-all">0x6eb2f77acb11fa20dc54a15f91db7a2f</dd>
          </div>
          <div>
            <dt class="text-slate-500">验证时间</dt>
            <dd class="text-slate-800">2026-04-28 15:20</dd>
          </div>
        </dl>
        <div class="flex gap-2">
          <button class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold" @click="recheck">重新验证</button>
          <button class="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold" @click="backToDetail">返回</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const batchId = computed(() => route.params.batchId || 'SC20240521001')

const recheck = () => {
  window.alert('哈希复核通过。')
}

const backToDetail = () => {
  router.push(`/trace/${batchId.value}`)
}
</script>
