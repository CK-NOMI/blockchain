<template>
  <div class="space-y-6">
    <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">审计处理</h1>
        <p class="text-sm text-slate-500 mt-1">对真实批次提交审计结论并留存证据。</p>
      </div>
      <div class="flex gap-2">
        <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="goDetail">查看详情</button>
        <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="$router.back()">返回</button>
      </div>
    </header>

    <div v-if="loading" class="text-center py-12 text-slate-400">加载中...</div>
    <div v-else-if="error" class="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl p-4 text-sm">{{ error }}</div>

    <template v-else-if="batch">
      <section class="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-wrap gap-4 text-sm">
        <div><span class="text-slate-500">批次号：</span><span class="font-mono font-semibold">{{ batch.batchId }}</span></div>
        <div><span class="text-slate-500">产品：</span><span>{{ batch.productName || '--' }}</span></div>
        <div><span class="text-slate-500">状态：</span><span class="text-emerald-700 font-semibold">{{ batch.status || '--' }}</span></div>
        <div><span class="text-slate-500">风险等级：</span><span class="font-semibold" :class="riskLevel === '高' ? 'text-rose-700' : 'text-emerald-700'">{{ riskLevel }}</span></div>
      </section>

      <div class="grid grid-cols-12 gap-5">
        <section class="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">审计表单</h2>
          <form class="space-y-4" @submit.prevent="submit">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">审计类型</label>
              <select v-model="form.auditType" class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600">
                <option value="ROUTINE">常规复核</option>
                <option value="RISK">风险审计</option>
                <option value="QUALITY">质量追溯</option>
                <option value="COMPLIANCE">合规检查</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">审计说明</label>
              <textarea v-model="form.description" rows="6" required class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" placeholder="填写审计结论、检查依据或处理建议"></textarea>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">证据哈希</label>
              <input v-model="form.evidenceHash" class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" placeholder="可填写文件哈希或链上证据哈希" />
            </div>
            <div class="flex gap-3">
              <button type="submit" :disabled="submitting" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60">{{ submitting ? '提交中...' : '提交审计' }}</button>
              <button type="button" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="prefill">填入当前证据</button>
            </div>
          </form>
        </section>

        <aside class="col-span-12 lg:col-span-5 space-y-4">
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 class="text-base font-semibold text-slate-800 mb-4">批次摘要</h3>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4"><dt class="text-slate-500">产地</dt><dd class="text-slate-800">{{ batch.origin || '--' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">责任人</dt><dd class="text-slate-800">{{ batch.principalName || batch.farmer || '--' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">加工记录</dt><dd class="text-slate-800">{{ batch.processOperator || batch.processType || '--' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">物流记录</dt><dd class="text-slate-800 text-right">{{ batch.vehicleInfo || '--' }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">零售位置</dt><dd class="text-slate-800">{{ batch.storeLocation || '--' }}</dd></div>
            </dl>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 class="text-base font-semibold text-slate-800 mb-4">证据</h3>
            <p class="text-xs text-slate-500 mb-1">文件哈希</p>
            <p class="text-[11px] font-mono text-slate-800 break-all">{{ batch.fileHash || '--' }}</p>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auditApi, batchApi } from '../../services/api'

const route = useRoute()
const router = useRouter()
const batchId = computed(() => route.params.batchId || '')
const batch = ref(null)
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const form = reactive({ auditType: 'ROUTINE', description: '', evidenceHash: '' })

const riskLevel = computed(() => {
  const code = Number(batch.value?.chainStatusCode ?? -1)
  const text = String(batch.value?.status || '')
  return code === 10 || text.includes('异常') || text.toLowerCase().includes('abnormal') ? '高' : '低'
})

function goDetail() {
  router.push('/regulator/batch-detail/' + batchId.value)
}

async function loadDetail() {
  if (!batchId.value) return
  loading.value = true
  error.value = ''
  try {
    batch.value = await batchApi.getBatchDetail(batchId.value)
    prefill()
  } catch (err) {
    error.value = err?.message || '批次详情加载失败'
  } finally {
    loading.value = false
  }
}

function prefill() {
  if (!batch.value) return
  if (!form.evidenceHash) form.evidenceHash = batch.value.fileHash || batch.value.transactionHash || ''
  if (!form.description) {
    form.description = '批次 ' + batch.value.batchId + '（' + (batch.value.productName || '未知产品') + '）监管复核：当前状态 ' + (batch.value.status || '--') + '，风险等级 ' + riskLevel.value + '。'
  }
}

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    await auditApi.submitAudit(batchId.value, { ...form })
    window.alert('审计提交成功')
    router.push('/regulator/batch-detail/' + batchId.value)
  } catch (err) {
    error.value = err?.message || '审计提交失败'
  } finally {
    submitting.value = false
  }
}

onMounted(loadDetail)
</script>
