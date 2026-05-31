<template>
  <div class="flex h-screen bg-slate-50 font-['Manrope',sans-serif] overflow-hidden">
    <aside class="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div class="h-16 flex items-center px-6 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <span class="material-icons text-xl">agriculture</span>
          </div>
          <span class="text-lg font-black text-slate-800 tracking-tight">AGRI-CHAIN</span>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto py-3">
        <h4 class="px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">主导航</h4>
        <template v-for="item in menus" :key="item.to + item.label">
          <div
            v-if="item.activeOn"
            @click="notifyNeedBatch(item)"
            class="flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all cursor-pointer"
            :class="isActive(item) ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'"
          >
            <span class="material-icons text-xl">{{ item.icon }}</span>
            {{ item.label }}
          </div>
          <router-link
            v-else
            :to="item.to"
            class="flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all"
            :class="isActive(item) ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'"
          >
            <span class="material-icons text-xl">{{ item.icon }}</span>
            {{ item.label }}
          </router-link>
        </template>
      </nav>

      <div class="p-4 border-t border-slate-100 space-y-2">
        <p class="text-xs text-slate-500">用户：<span class="font-semibold text-slate-700">{{ userName }}</span></p>
        <p class="text-xs text-slate-500">角色：<span class="font-semibold text-slate-700">{{ userRoleLabel }}</span></p>
        <button
          type="button"
          @click="goLogout"
          class="w-full py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          退出登录
        </button>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <div class="flex items-center gap-2 text-slate-500 text-sm">
          <span class="material-icons text-sm">home</span>
          <span>/</span>
          <span class="font-semibold text-slate-800">{{ currentTitle }}</span>
        </div>
        <div class="text-xs text-slate-500">{{ roleLabel }}</div>
      </header>

      <!-- 通知条：点击需选批次的菜单项时显示 -->
      <div
        v-if="toast.visible"
        class="px-8 py-3 text-sm flex items-center gap-2 border-b"
        :class="toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'"
      >
        <span class="material-icons text-base">{{ toast.type === 'error' ? 'info' : 'info' }}</span>
        <span>{{ toast.message }}</span>
        <button class="ml-auto text-xs opacity-60 hover:opacity-100" @click="toast.visible = false">✕</button>
      </div>

      <main class="flex-1 overflow-y-auto p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { roleMenus } from '../config/menus'
import { ROLE_LABELS } from '../config/auth'
import { useAuthStore } from '../stores'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

function roleFromPath(path) {
  const p = String(path || '').toLowerCase()
  if (p.startsWith('/retail')) return 'RETAIL'
  if (p.startsWith('/admin')) return 'ADMIN'
  if (p.startsWith('/farmer')) return 'FARMER'
  if (p.startsWith('/processor')) return 'PROCESSOR'
  if (p.startsWith('/regulator')) return 'REGULATOR'
  if (p.startsWith('/logistics')) return 'LOGISTICS'
  return ''
}

const role = computed(() => {
  const fromPath = roleFromPath(route.path)
  if (fromPath) return fromPath
  return authStore.role || route.meta.role || 'FARMER'
})
const userName = computed(() => authStore.user?.username || 'unknown')
const roleLabel = computed(() => ROLE_LABELS[role.value] || 'Visitor')
const userRoleLabel = computed(() => ROLE_LABELS[authStore.role] || 'Visitor')
const menus = computed(() => roleMenus[role.value] || [])
const currentTitle = computed(() => route.meta.title || '工作台')

const isActive = (item) => {
  const to = item.to

  // 0) 菜单项自定义激活路径匹配：点击菜单→跳转批次列表页让用户选批次，
  //    进入子页面（/farmer/records/xxx 或 /farmer/batch-detail/xxx）后，
  //    activeOn 负责将对应菜单项高亮
  if (item.activeOn && route.path.startsWith(item.activeOn)) return true

  // 1) 完全匹配
  if (route.path === to) {
    const dups = menus.value.filter(m => m.to === to)
    // 多个菜单项共享同一 to（先选批次再进入子页面），
    // 列表页上只高亮主菜单项（无 activeOn），子页面由上方 activeOn 规则激活
    if (dups.length > 1) return !item.activeOn
    return true
  }
  // 2) 当前路径以菜单路径开头（父子路由如 /farmer/batches/xxx → /farmer/batches）
  if (route.path.startsWith(`${to}/`)) return true
  return false
}

const goLogout = () => {
  router.push('/public/logout')
}

const toast = reactive({ visible: false, message: '', type: 'info' })
let toastTimer = null

function notifyNeedBatch(item) {
  // 当前路由有 batchId 时直接跳转，无 batchId 时弹提示
  const batchId = route.params.batchId
  if (batchId && item.activeOn) {
    router.push(`${item.activeOn}${batchId}`)
    return
  }
  clearTimeout(toastTimer)
  toast.message = `请先在列表中选择一个批次再进入「${item.label}」`
  toast.type = 'info'
  toast.visible = true
  toastTimer = setTimeout(() => { toast.visible = false }, 3500)
}

watchEffect(() => {
  const fromPath = roleFromPath(route.path)
  if (fromPath && authStore.role && authStore.role !== fromPath) {
    authStore.clear()
    router.replace('/login')
  }
})
</script>
