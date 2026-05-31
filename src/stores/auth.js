import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '../services/api'
import { resolveLandingByRole } from '../config/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))
  const loading = ref(false)
  const error = ref('')
  const lastRegistration = ref(JSON.parse(localStorage.getItem('lastRegistration') || 'null'))

  const isLoggedIn = computed(() => Boolean(token.value && user.value?.role))
  const role = computed(() => user.value?.role || '')
  const landing = computed(() => resolveLandingByRole(role.value))

  const persist = () => {
    if (token.value) localStorage.setItem('token', token.value)
    if (user.value?.role) localStorage.setItem('user', JSON.stringify(user.value))
  }

  const refreshFromStorage = () => {
    token.value = localStorage.getItem('token') || ''
    user.value = JSON.parse(localStorage.getItem('user') || '{}')
    lastRegistration.value = JSON.parse(localStorage.getItem('lastRegistration') || 'null')
  }

  const clear = () => {
    token.value = ''
    user.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('auth_explicit')
    localStorage.removeItem('lastRegistration')
  }

  const login = async (payload) => {
    loading.value = true
    error.value = ''
    try {
      clear()
      const data = await authApi.login(payload)
      token.value = data.token
      user.value = data.user
      persist()
      return data
    } catch (err) {
      error.value = err?.message || '登录失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const register = async (payload) => {
    loading.value = true
    error.value = ''
    try {
      const result = await authApi.register(payload)
      lastRegistration.value = {
        role: payload.role || '',
        organization: payload.organization || '',
        submittedAt: new Date().toLocaleString(),
      }
      localStorage.setItem('lastRegistration', JSON.stringify(lastRegistration.value))
      return result
    } catch (err) {
      error.value = err?.message || '注册失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    clear()
  }

  return {
    token,
    user,
    loading,
    error,
    lastRegistration,
    isLoggedIn,
    role,
    landing,
    login,
    register,
    logout,
    clear,
    refreshFromStorage,
  }
})
