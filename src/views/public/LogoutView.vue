<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Manrope',sans-serif]">
    <div class="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
        <span class="material-icons text-4xl">logout</span>
      </div>
      <h1 class="mt-4 text-2xl font-extrabold text-slate-900">确认退出登录</h1>
      <p class="mt-2 text-sm text-slate-500">
        确认后将清除当前登录会话。
      </p>
      <div class="mt-6 flex gap-2 justify-center">
        <button
          type="button"
          class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold"
          @click="cancel"
        >
          取消
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold"
          @click="confirm"
        >
          退出登录
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

const cancel = () => {
  router.push(authStore.landing)
}

const confirm = () => {
  authStore.logout()
  router.push('/login')
}
</script>
