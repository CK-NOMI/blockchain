<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Manrope',sans-serif]">
    <div class="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center">
        <span class="material-icons text-4xl">travel_explore</span>
      </div>
      <h1 class="mt-4 text-2xl font-extrabold text-slate-900">404 页面不存在</h1>
      <p class="mt-2 text-sm text-slate-500">
        你访问的页面不存在或已失效。
      </p>
      <div class="mt-6 flex gap-2 justify-center">
        <button
          type="button"
          class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold"
          @click="goLogin"
        >
          返回登录
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
          @click="goPrototype"
        >
          打开原型目录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goLogin = () => {
  router.push('/login')
}

const goPrototype = () => {
  router.push('/prototype')
}
</script>
