import { defineStore } from 'pinia'
import { ref } from 'vue'
import { batchApi } from '../services/api'

export const useRetailStore = defineStore('retail', () => {
  const pendingBatches = ref([])
  const currentBatch = ref(null)
  const timeline = ref([])
  const loading = ref(false)
  const error = ref('')

  const loadPendingBatches = async () => {
    loading.value = true
    error.value = ''
    try {
      pendingBatches.value = await batchApi.getDashboardRows('RETAIL')
      return pendingBatches.value
    } catch (err) {
      error.value = err?.message || '加载待入库批次失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadBatchDetail = async (batchId) => {
    loading.value = true
    error.value = ''
    try {
      const result = await batchApi.getBatchDetail(batchId)
      currentBatch.value = result
      timeline.value = result.timeline || []
      return result
    } catch (err) {
      error.value = err?.message || '加载批次详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const submitRetailRecord = async (batchId, payload) => {
    loading.value = true
    error.value = ''
    try {
      return await batchApi.addRetailRecord(batchId, payload)
    } catch (err) {
      error.value = err?.message || '提交零售记录失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateSaleStatus = async (batchId, status) => {
    loading.value = true
    error.value = ''
    try {
      return await batchApi.updateBatchStatus(batchId, status)
    } catch (err) {
      error.value = err?.message || '更新销售状态失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const uploadFile = async (batchId, formData) => {
    loading.value = true
    error.value = ''
    try {
      return await batchApi.uploadFile(batchId, formData)
    } catch (err) {
      error.value = err?.message || '文件上传失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    pendingBatches, currentBatch, timeline, loading, error,
    loadPendingBatches, loadBatchDetail, submitRetailRecord, updateSaleStatus, uploadFile,
  }
})
