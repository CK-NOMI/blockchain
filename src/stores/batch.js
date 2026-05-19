import { defineStore } from 'pinia'
import { ref } from 'vue'
import { batchApi, traceApi } from '../services/api'

export const useBatchStore = defineStore('batch', () => {
  const dashboardRows = ref([])
  const currentBatch = ref(null)
  const loading = ref(false)
  const error = ref('')

  const loadDashboardRows = async (role) => {
    loading.value = true
    error.value = ''
    try {
      dashboardRows.value = await batchApi.getDashboardRows(role)
      return dashboardRows.value
    } catch (err) {
      error.value = err?.message || '加载工作台数据失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadBatchDetail = async (batchId) => {
    loading.value = true
    error.value = ''
    try {
      currentBatch.value = await batchApi.getBatchDetail(batchId)
      return currentBatch.value
    } catch (err) {
      error.value = err?.message || '加载批次详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const searchTrace = async (batchId) => {
    loading.value = true
    error.value = ''
    try {
      currentBatch.value = await traceApi.search(batchId)
      return currentBatch.value
    } catch (err) {
      error.value = err?.message || '溯源查询失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    dashboardRows,
    currentBatch,
    loading,
    error,
    loadDashboardRows,
    loadBatchDetail,
    searchTrace,
  }
})
