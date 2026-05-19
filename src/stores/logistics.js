import { defineStore } from 'pinia'
import { ref } from 'vue'
import { batchApi } from '../services/api'

export const useLogisticsStore = defineStore('logistics', () => {
  const pendingBatches = ref([])
  const currentBatch = ref(null)
  const timeline = ref([])
  const loading = ref(false)
  const error = ref('')

  const loadPendingBatches = async () => {
    loading.value = true
    error.value = ''
    try {
      pendingBatches.value = await batchApi.getDashboardRows('LOGISTICS')
      return pendingBatches.value
    } catch (err) {
      error.value = err?.message || '加载待运输批次失败'
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

  const submitTransportRecord = async (batchId, payload) => {
    loading.value = true
    error.value = ''
    try {
      const result = await batchApi.addLogisticsRecord(batchId, payload)
      return result
    } catch (err) {
      error.value = err?.message || '提交运输记录失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const submitTempRecord = async (batchId, payload) => {
    loading.value = true
    error.value = ''
    try {
      const result = await batchApi.addLogisticsRecord(batchId, payload)
      return result
    } catch (err) {
      error.value = err?.message || '提交温湿度记录失败'
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
    loadPendingBatches, loadBatchDetail, submitTransportRecord, submitTempRecord, uploadFile,
  }
})
