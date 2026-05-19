<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Manrope',sans-serif]">
    <div class="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
        <span class="material-icons text-4xl">gpp_bad</span>
      </div>
      <h1 class="mt-4 text-2xl font-extrabold text-slate-900">403 无权限访问</h1>
      <p class="mt-2 text-sm text-slate-500">
        当前角色没有访问该页面的权限。
      </p>
      <div class="mt-6 flex gap-2 justify-center">
        <button
          type="button"
          class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold"
          @click="goHome"
        >
          返回工作台
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
          @click="goLogin"
        >
          重新登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores'

const router = useRouter()
const authStore = useAuthStore()

const goHome = () => {
  router.push(authStore.landing)
}

const goLogin = () => {
  authStore.logout()
  router.push('/login')
}
</script>
