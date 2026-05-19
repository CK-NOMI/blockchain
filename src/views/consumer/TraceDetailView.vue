<template>
  <div class="min-h-screen bg-slate-50 font-['Manrope',sans-serif] pb-24">
    <header class="bg-white px-4 h-14 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10">
      <button class="text-slate-600" @click="backToSearch"><span class="material-icons">arrow_back</span></button>
      <h1 class="font-bold text-slate-800">产品溯源详情</h1>
      <span class="material-icons text-slate-600">share</span>
    </header>

    <div class="p-4">
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4">
        <div class="w-24 h-24 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><span class="material-icons">eco</span></div>
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <h2 class="font-bold text-lg text-slate-900">{{ detail.productName || '有机葡萄' }}</h2>
            <span class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded uppercase">已验真</span>
          </div>
          <p class="text-xs text-slate-500 mb-2">批次号：{{ batchId }}</p>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">已上链</span>
            <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">数据完整</span>
          </div>
        </div>
      </div>
    </div>

    <div class="px-4">
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-bold text-slate-800 mb-4">溯源时间线</h3>
        <ol class="space-y-4">
          <li v-for="node in timeline" :key="node.stage" class="flex gap-3">
            <span
              class="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs"
              :class="node.completed ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'"
            >
              <span class="material-icons text-sm">{{ node.completed ? 'done' : 'schedule' }}</span>
            </span>
            <div>
              <p class="text-sm font-bold text-slate-800">{{ node.stage }}</p>
              <p class="text-xs text-slate-500">{{ node.actor }}</p>
              <p class="text-[10px] text-slate-400 mt-1">{{ node.time }}</p>
            </div>
          </li>
        </ol>
      </div>
    </div>

    <div class="px-4 mt-4 grid grid-cols-3 gap-2">
      <button class="py-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold" @click="goTimeline">时间线</button>
      <button class="py-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold" @click="goVerify">验证材料</button>
      <button class="py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold" @click="goFeedback">问题反馈</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBatchStore } from '../../stores'

const route = useRoute()
const router = useRouter()
const batchStore = useBatchStore()

const batchId = computed(() => route.params.batchId || 'UNKNOWN')

onMounted(async () => {
  if (!batchStore.currentBatch || batchStore.currentBatch.batchId !== batchId.value) {
    await batchStore.searchTrace(batchId.value)
  }
})

const detail = computed(() => batchStore.currentBatch || {})
const timeline = computed(() => detail.value.timeline || [])

const backToSearch = () => router.push('/trace/search')
const goTimeline = () => router.push(`/trace/timeline/${batchId.value}`)
const goVerify = () => router.push(`/trace/verify/${batchId.value}`)
const goFeedback = () => router.push(`/trace/feedback/${batchId.value}`)
</script>
