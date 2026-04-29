<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Manrope',sans-serif]">
    <div class="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
        <span class="material-icons text-4xl">hourglass_top</span>
      </div>
      <h1 class="mt-4 text-2xl font-extrabold text-slate-900">注册申请已提交</h1>
      <p class="mt-2 text-sm text-slate-500">
        你的注册申请正在审核中，请审核通过后再登录。
      </p>
      <div class="mt-6 grid grid-cols-1 gap-2 text-left text-sm bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p><span class="text-slate-500">角色：</span>{{ role }}</p>
        <p><span class="text-slate-500">机构：</span>{{ organization }}</p>
        <p><span class="text-slate-500">提交时间：</span>{{ submittedAt }}</p>
      </div>
      <div class="mt-6 flex gap-2 justify-center">
        <button type="button" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold" @click="refreshStatus">刷新状态</button>
        <button type="button" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold" @click="backLogin">返回登录</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const role = ref('农户')
const organization = ref('机构-12')
const submittedAt = ref(new Date().toLocaleString())

const refreshStatus = () => {
  window.alert('当前状态：审核中。')
}

const backLogin = () => {
  router.push('/login')
}
</script>
