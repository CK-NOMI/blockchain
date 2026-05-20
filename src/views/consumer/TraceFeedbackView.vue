<template>
  <div class="min-h-screen bg-slate-50 font-['Manrope',sans-serif] pb-20">
    <header class="bg-white px-4 h-14 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10">
      <button class="text-slate-600" @click="backToDetail">
        <span class="material-icons">arrow_back</span>
      </button>
      <h1 class="font-bold text-slate-800">问题反馈</h1>
      <span class="w-6"></span>
    </header>

    <main class="p-4">
      <form class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4" @submit.prevent="submit">
        <div>
          <label class="text-xs text-slate-500 font-semibold">批次号</label>
          <input
            :value="batchId"
            disabled
            class="mt-1 w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-mono"
          />
        </div>
        <div>
          <label class="text-xs text-slate-500 font-semibold">问题类型</label>
          <select v-model="form.type" class="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
            <option value="Quality">质量问题</option>
            <option value="Label">标签不一致</option>
            <option value="Expired">商品过期</option>
            <option value="Other">其他</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-slate-500 font-semibold">问题描述</label>
          <textarea
            v-model="form.description"
            rows="4"
            placeholder="请描述你遇到的问题..."
            class="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          ></textarea>
        </div>
        <button type="submit" class="w-full py-3 rounded-lg bg-blue-600 text-white text-sm font-semibold">提交反馈</button>
      </form>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const batchId = computed(() => route.params.batchId || 'SC20240521001')

const form = reactive({
  type: 'Quality',
  description: '',
})

const submit = () => {
  router.push('/trace/feedback/success')
}

const backToDetail = () => {
  router.push(`/trace/${batchId.value}`)
}
</script>
