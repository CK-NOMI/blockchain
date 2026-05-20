<template>
  <div class="min-h-screen bg-slate-50 font-['Manrope',sans-serif] pb-20">
    <header class="bg-white px-4 h-14 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10">
      <button class="text-slate-600" @click="backToDetail"><span class="material-icons">arrow_back</span></button>
      <h1 class="font-bold text-slate-800">全链路时间线</h1>
      <span class="w-6"></span>
    </header>

    <main class="p-4">
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">批次 {{ batchId }}</h2>
        <p class="text-xs text-slate-500 mt-1">从源头到零售的完整链路记录。</p>
        <ol class="mt-5 space-y-4">
          <li v-for="(step, index) in steps" :key="step.stage" class="flex gap-3">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" :class="step.completed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'">
              {{ index + 1 }}
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-800">{{ step.stage }}</p>
              <p class="text-xs text-slate-500">{{ step.actor }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ step.time }}</p>
            </div>
          </li>
        </ol>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBatchStore } from '../../stores'

const route = useRoute()
const router = useRouter()
const batchStore = useBatchStore()
const batchId = computed(() => route.params.batchId || 'SC20240521001')

onMounted(async () => {
  if (!batchStore.currentBatch || batchStore.currentBatch.batchId !== batchId.value) {
    await batchStore.searchTrace(batchId.value)
  }
})

const steps = computed(() => batchStore.currentBatch?.timeline || [])

const backToDetail = () => {
  router.push(`/trace/${batchId.value}`)
}
</script>
