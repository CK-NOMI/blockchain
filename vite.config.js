import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const mockMode = mode === 'mock'
  if (mockMode) console.log('[vite.config] 原型模式 VITE_USE_MOCK=true')

  return {
    plugins: [vue()],
    define: {
      'import.meta.env.VITE_USE_MOCK': mockMode ? '"true"' : '"false"',
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
        },
      },
    },
  }
})
