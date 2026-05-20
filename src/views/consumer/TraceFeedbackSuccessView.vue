<template>
  <div class="min-h-screen bg-slate-50 font-['Manrope',sans-serif] flex items-center justify-center p-6">
    <div class="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
        <span class="material-icons text-4xl">check_circle</span>
      </div>
      <h1 class="mt-4 text-2xl font-extrabold text-slate-900">反馈已提交</h1>
      <p class="mt-2 text-sm text-slate-500">
        感谢反馈，监管团队将尽快处理。
      </p>
      <div class="mt-6 flex gap-2 justify-center">
        <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold" @click="goSearch">继续查询</button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold" @click="goTrace">返回溯源</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goSearch = () => {
  router.push('/trace/search')
}

const goTrace = () => {
  router.push('/trace/SC20240521001')
}
</script>
