<template>
  <div class="min-h-screen bg-slate-50 font-['Manrope',sans-serif]">
    <header class="w-full py-4 px-6 flex items-center gap-2">
      <span class="material-icons text-blue-600">lan</span>
      <span class="text-lg font-bold text-blue-700">Agri-Chain 溯源平台</span>
    </header>

    <main class="px-4 pb-8">
      <div class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section class="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="h-24 bg-gradient-to-r from-blue-500 to-blue-700"></div>
          <div class="p-6">
            <h1 class="text-2xl font-bold text-slate-900">创建溯源账号</h1>
            <p class="text-sm text-slate-500 mt-1">提交账号与机构信息，等待管理员审核。</p>

            <form class="mt-6 space-y-5" @submit.prevent="submit">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-2">用户名</label>
                  <input
                    v-model="form.username"
                    type="text"
                    required
                    placeholder="your_username"
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-2">角色</label>
                  <select
                    v-model="form.role"
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option v-for="item in roleOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-2">管理员邮箱</label>
                <input
                  v-model="form.email"
                  type="email"
                  required
                  placeholder="admin@organization.com"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-2">密码</label>
                  <input
                    v-model="form.password"
                    type="password"
                    required
                    placeholder="至少8位"
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-2">确认密码</label>
                  <input
                    v-model="form.confirmPassword"
                    type="password"
                    required
                    placeholder="请再次输入密码"
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-2">所属机构</label>
                <input
                  v-model="form.organization"
                  type="text"
                  required
                  placeholder="机构名称"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <p v-if="authStore.error" class="text-sm text-rose-600">{{ authStore.error }}</p>

              <div class="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button type="button" class="text-sm font-semibold text-blue-600" @click="backToLogin">返回登录</button>
                <button type="submit" class="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold" :disabled="authStore.loading">
                  {{ authStore.loading ? '提交中...' : '提交申请' }}
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside class="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">注册进度</h2>
          <ol class="space-y-4 text-sm">
            <li class="text-blue-700 font-semibold">1. 账号信息（当前）</li>
            <li class="text-slate-500">2. 机构审核</li>
            <li class="text-slate-500">3. 管理员审批</li>
          </ol>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ROLE_OPTIONS } from '../../config/auth'
import { useAuthStore } from '../../stores'

const router = useRouter()
const authStore = useAuthStore()

const roleOptions = ROLE_OPTIONS.filter((item) => item.value !== 'ADMIN')
const form = reactive({
  username: '',
  role: 'FARMER',
  email: '',
  password: '',
  confirmPassword: '',
  organization: '',
})

const backToLogin = () => {
  router.push('/login')
}

const submit = async () => {
  if (form.password !== form.confirmPassword) {
    window.alert('两次输入的密码不一致。')
    return
  }
  try {
    await authStore.register({ ...form })
    router.push('/public/pending')
  } catch {
    // handled by store error state
  }
}
</script>
