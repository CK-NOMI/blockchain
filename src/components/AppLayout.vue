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
        <router-link
          v-for="item in menus"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all"
          :class="isActive(item.to) ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'"
        >
          <span class="material-icons text-xl">{{ item.icon }}</span>
          {{ item.label }}
        </router-link>
      </nav>

      <div class="p-4 border-t border-slate-100 space-y-2">
        <p class="text-xs text-slate-500">用户：<span class="font-semibold text-slate-700">{{ userName }}</span></p>
        <p class="text-xs text-slate-500">角色：<span class="font-semibold text-slate-700">{{ roleLabel }}</span></p>
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

      <main class="flex-1 overflow-y-auto p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { roleMenus } from '../config/menus'
import { ROLE_LABELS } from '../config/auth'
import { useAuthStore } from '../stores'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const role = computed(() => authStore.role || route.meta.role || 'FARMER')
const userName = computed(() => authStore.user?.username || 'unknown')
const roleLabel = computed(() => ROLE_LABELS[role.value] || 'Visitor')
const menus = computed(() => roleMenus[role.value] || [])
const currentTitle = computed(() => route.meta.title || '工作台')

const isActive = (to) => route.path === to || route.path.startsWith(`${to}/`)

const goLogout = () => {
  router.push('/public/logout')
}
</script>
