<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Manrope',sans-serif]">
    <div class="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-200">
      <div class="md:w-1/2 bg-blue-600 p-12 text-white flex flex-col justify-center">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600">
            <span class="material-icons text-3xl">agriculture</span>
          </div>
          <h1 class="text-2xl font-black tracking-tight uppercase">Agri-Chain</h1>
        </div>
        <h2 class="text-4xl font-bold mb-4 leading-tight">可信农业溯源平台</h2>
        <p class="text-blue-100 text-lg leading-relaxed">
          基于联盟链的供应链全流程可信记录。
        </p>
      </div>

      <div class="md:w-1/2 p-12 flex flex-col justify-center">
        <div class="mb-8">
          <h3 class="text-2xl font-bold text-slate-900 mb-2">欢迎登录</h3>
          <p class="text-slate-500">登录后进入对应角色工作台。</p>
        </div>

        <form class="space-y-5" @submit.prevent="handleLogin">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">用户名</label>
            <input
              v-model="form.username"
              type="text"
              placeholder="请输入用户名"
              required
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">密码</label>
            <input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              required
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
<p v-if="authStore.error" class="text-sm text-rose-600">{{ authStore.error }}</p>

          <button
            type="submit"
            class="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-60"
            :disabled="authStore.loading"
          >
            {{ authStore.loading ? '登录中...' : '登录' }}
          </button>
        </form>

        <div class="mt-6 flex items-center justify-between text-xs">
          <button type="button" class="text-blue-600 font-semibold" @click="goRegister">创建账号</button>
          <button type="button" class="text-slate-500 font-semibold" @click="goTraceSearch">
            消费者溯源查询
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: 'admin',
  password: 'admin123',
})

const handleLogin = async () => {
  try {
    await authStore.login({ ...form })
    localStorage.setItem('auth_explicit', '1')
    router.push(authStore.landing)
  } catch {
    // handled in store error state
  }
}

const goRegister = () => {
  router.push('/register')
}

const goTraceSearch = () => {
  router.push('/trace/search')
}
</script>
