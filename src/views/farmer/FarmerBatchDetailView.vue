<template>
  <div class="space-y-6 font-['Manrope',sans-serif]">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">批次详情</h1>
        <p class="text-sm text-slate-500 mt-1">
          批次号：<span class="font-mono text-slate-700">{{ batchId }}</span>
        </p>
      </div>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
          @click="router.push('/farmer/dashboard')"
        >返回工作台</button>
        <button
          v-if="isCreatedStatus"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
          @click="router.push(`/farmer/records/${batchId}`)"
        >录入农事记录</button>
      </div>
    </header>

    <!-- 加载中 -->
    <div v-if="loading" class="text-center py-12 text-slate-500">加载中...</div>

    <!-- 错误 -->
    <div v-else-if="errorMsg" class="bg-rose-50 border border-rose-200 rounded-xl p-4">
      <p class="text-rose-700 text-sm">❌ {{ errorMsg }}</p>
    </div>

    <!-- 详情内容 -->
    <template v-else-if="batch">
      <!-- 基础信息卡片 -->
      <div class="grid grid-cols-12 gap-5">
        <section class="col-span-12 lg:col-span-8 space-y-5">
          <!-- 批次基础信息 -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">批次基础信息</h2>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-slate-500">产品名称</dt>
                <dd class="text-slate-900 font-medium">{{ batch.productName }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">产地</dt>
                <dd class="text-slate-900">{{ batch.origin || '--' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">分类</dt>
                <dd class="text-slate-900">{{ batch.category || '--' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">数量</dt>
                <dd class="text-slate-900">{{ batch.quantity || '--' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">创建时间</dt>
                <dd class="text-slate-900">{{ batch.createdAt || '--' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">最后更新</dt>
                <dd class="text-slate-900">{{ batch.updatedAt || '--' }}</dd>
              </div>
            </dl>
          </div>

          <!-- 农事记录信息 -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">农事记录</h2>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-slate-500">种植日期</dt>
                <dd class="text-slate-900">{{ batch.plantDate || '--' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">播种日期</dt>
                <dd class="text-slate-900">{{ batch.sowingDate || '--' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">采收日期</dt>
                <dd class="text-slate-900">{{ batch.harvestDate || '--' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">责任人</dt>
                <dd class="text-slate-900">{{ batch.principalName || '--' }}</dd>
              </div>
              <div class="md:col-span-2">
                <dt class="text-slate-500 mb-1">施肥记录</dt>
                <dd class="text-slate-900 bg-slate-50 rounded-lg p-3 text-xs">{{ batch.fertilizerRecord || '暂无记录' }}</dd>
              </div>
              <div class="md:col-span-2">
                <dt class="text-slate-500 mb-1">农药使用记录</dt>
                <dd class="text-slate-900 bg-slate-50 rounded-lg p-3 text-xs">{{ batch.pesticideRecord || '暂无记录' }}</dd>
              </div>
            </dl>
          </div>

          <!-- 异常信息（仅异常批次显示） -->
          <div v-if="batch.abnormalInfo" class="bg-rose-50 rounded-2xl border border-rose-200 p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-rose-800 mb-4">⚠️ 异常信息</h2>
            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-rose-600 font-semibold">异常原因</dt>
                <dd class="text-rose-900 mt-1">{{ batch.abnormalInfo.reason }}</dd>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt class="text-rose-600 text-xs">检测时间</dt>
                  <dd class="text-rose-900">{{ batch.abnormalInfo.detectedAt }}</dd>
                </div>
                <div>
                  <dt class="text-rose-600 text-xs">检测方式</dt>
                  <dd class="text-rose-900">{{ batch.abnormalInfo.detectedBy }}</dd>
                </div>
                <div>
                  <dt class="text-rose-600 text-xs">风险等级</dt>
                  <dd>
                    <span class="px-2 py-1 rounded-full text-xs font-bold bg-rose-200 text-rose-800">{{ batch.abnormalInfo.riskLevel }}</span>
                  </dd>
                </div>
              </div>
              <div>
                <dt class="text-rose-600 text-xs font-semibold">触发规则</dt>
                <ul class="mt-1 space-y-1">
                  <li v-for="(rule, idx) in batch.abnormalInfo.rules" :key="idx" class="text-rose-800 text-xs bg-rose-100 rounded px-3 py-1.5">
                    {{ rule }}
                  </li>
                </ul>
              </div>
              <div>
                <dt class="text-rose-600 text-xs">证据哈希</dt>
                <dd class="font-mono text-xs text-rose-900 break-all mt-1">{{ batch.abnormalInfo.evidenceHash }}</dd>
              </div>
              <div class="pt-2 border-t border-rose-200">
                <dt class="text-rose-600 text-xs">处理状态</dt>
                <dd class="mt-1">
                  <span class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">{{ batch.abnormalInfo.handlingStatus }}</span>
                </dd>
              </div>
            </dl>
          </div>

          <!-- 农户整改操作区（仅异常批次显示） -->
          <div v-if="batch.abnormalInfo" class="bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-amber-800 mb-2">📋 整改操作</h2>
            <p class="text-xs text-amber-700 mb-4">
              本批次已被标记异常，请根据异常原因配合整改。异常状态的解除由监管方完成，农户不可自行解除。
            </p>

            <div class="space-y-4">
              <!-- 监管处理说明 -->
              <div class="bg-white rounded-xl border border-amber-100 p-4">
                <h3 class="text-sm font-semibold text-slate-800 mb-2">监管处理说明</h3>
                <p class="text-xs text-slate-600">
                  {{ batch.abnormalInfo.handlingStatus === '等待监管处理'
                    ? '监管方尚未给出处理意见，请等待监管方审核后按要求提交整改材料。'
                    : '监管方已介入调查，请根据以下要求提交补充材料和整改说明。' }}
                </p>
                <ul class="mt-2 text-xs text-slate-500 list-disc pl-4 space-y-1">
                  <li v-for="(rule, idx) in batch.abnormalInfo.rules" :key="'fix-'+idx">
                    针对"{{ rule.split('：')[0] }}"：请提供相关证明材料
                  </li>
                </ul>
              </div>

              <!-- 操作按钮组 -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  class="h-11 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
                  @click="handleUploadEvidence"
                >
                  上传补充材料
                </button>
                <button
                  class="h-11 px-4 bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-xl text-sm font-semibold transition-colors"
                  @click="handleSubmitExplanation"
                >
                  提交整改说明
                </button>
                <button
                  class="h-11 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
                  @click="showOriginalRecord = !showOriginalRecord"
                >
                  {{ showOriginalRecord ? '收起原始记录' : '查看原始记录' }}
                </button>
              </div>

              <!-- 上传补充材料区域 -->
              <div v-if="showUploadArea" class="bg-white rounded-xl border border-amber-100 p-4">
                <h3 class="text-sm font-semibold text-slate-800 mb-2">上传补充证明材料</h3>
                <p class="text-xs text-slate-500 mb-3">支持图片、PDF等文件，上传后系统自动计算SHA-256哈希用于存证。</p>
                <input
                  type="file"
                  @change="handleEvidenceFile"
                  class="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                />
                <p v-if="evidenceFileHash" class="mt-2 text-xs text-emerald-600">
                  ✅ 文件哈希: <span class="font-mono">{{ evidenceFileHash }}</span>
                </p>
              </div>

              <!-- 提交整改说明区域 -->
              <div v-if="showExplanationArea" class="bg-white rounded-xl border border-amber-100 p-4">
                <h3 class="text-sm font-semibold text-slate-800 mb-2">整改说明 / 申诉说明</h3>
                <p class="text-xs text-slate-500 mb-3">请说明异常原因、已采取的整改措施或申诉理由。提交后将记录在案，供监管方审核。</p>
                <textarea
                  v-model="explanationText"
                  rows="4"
                  placeholder="例如：农药使用记录因系统故障未及时上传，现补充完整记录如下..."
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 resize-none text-sm"
                ></textarea>
                <button
                  class="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                  :disabled="!explanationText.trim()"
                  @click="submitExplanation"
                >
                  提交说明
                </button>
                <p v-if="explanationSubmitted" class="mt-2 text-xs text-emerald-600">✅ 整改说明已提交，等待监管方审核。</p>
              </div>

              <!-- 原始农事记录展示 -->
              <div v-if="showOriginalRecord" class="bg-white rounded-xl border border-slate-200 p-4">
                <h3 class="text-sm font-semibold text-slate-800 mb-2">原始农事记录（已上链，不可修改）</h3>
                <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div class="flex justify-between">
                    <dt class="text-slate-500">种植日期</dt>
                    <dd class="text-slate-800">{{ batch.plantDate || '--' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-500">播种日期</dt>
                    <dd class="text-slate-800">{{ batch.sowingDate || '--' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-500">采收日期</dt>
                    <dd class="text-slate-800">{{ batch.harvestDate || '--' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-500">责任人</dt>
                    <dd class="text-slate-800">{{ batch.principalName || '--' }}</dd>
                  </div>
                  <div class="md:col-span-2">
                    <dt class="text-slate-500 mb-1">施肥记录</dt>
                    <dd class="text-slate-800 bg-slate-50 rounded p-2">{{ batch.fertilizerRecord || '暂无' }}</dd>
                  </div>
                  <div class="md:col-span-2">
                    <dt class="text-slate-500 mb-1">农药使用记录</dt>
                    <dd class="text-slate-800 bg-slate-50 rounded p-2">{{ batch.pesticideRecord || '暂无' }}</dd>
                  </div>
                </dl>
                <p class="mt-3 text-xs text-slate-400 italic">以上记录已写入区块链，不可篡改。如需更正，请通过"提交整改说明"补充说明。</p>
              </div>
            </div>
          </div>

          <!-- 时间线 -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">全链路时间线</h2>
            <div v-if="timeline.length === 0" class="text-sm text-slate-400 py-4">暂无时间线数据</div>
            <ol v-else class="relative border-l-2 border-blue-200 ml-3 space-y-6">
              <li v-for="(item, idx) in timeline" :key="idx" class="pl-6 relative">
                <span
                  class="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white"
                  :class="isAbnormalNode(item) ? 'border-rose-500' : 'border-blue-500'"
                ></span>
                <div class="flex items-center gap-2 mb-1">
                  <span
                    class="text-xs font-semibold px-2 py-0.5 rounded"
                    :class="isAbnormalNode(item) ? 'text-rose-700 bg-rose-50' : 'text-blue-700 bg-blue-50'"
                  >{{ item.stage }}</span>
                  <span class="text-xs text-slate-400">{{ item.time }}</span>
                </div>
                <p class="text-sm" :class="isAbnormalNode(item) ? 'text-rose-700 font-medium' : 'text-slate-700'">{{ item.detail || item.description }}</p>
                <p v-if="item.txHash" class="text-xs text-slate-400 font-mono mt-1 break-all">TX: {{ item.txHash }}</p>
              </li>
            </ol>
          </div>
        </section>

        <!-- 侧栏 -->
        <aside class="col-span-12 lg:col-span-4 space-y-5">
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 class="text-base font-semibold text-slate-800 mb-4">状态信息</h3>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-slate-500">当前状态</dt>
                <dd>
                  <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="batch.statusClass">
                    {{ batch.status }}
                  </span>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">状态码</dt>
                <dd class="text-slate-800 font-mono text-xs">{{ batch.statusCode }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">链上状态码</dt>
                <dd class="text-slate-800 font-mono text-xs">{{ batch.chainStatusCode }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">所属农户</dt>
                <dd class="text-slate-800 text-xs font-mono break-all">{{ batch.farmer || batch.owner || '--' }}</dd>
              </div>
            </dl>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 class="text-base font-semibold text-slate-800 mb-4">快捷操作</h3>
            <div class="space-y-2">
              <button
                v-if="isCreatedStatus"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
                @click="router.push(`/farmer/records/${batchId}`)"
              >录入农事记录</button>
              <button
                v-if="isFarmingOrLater && !isAbnormalStatus"
                class="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
                @click="showOriginalRecord = true"
              >查看原始农事记录</button>
              <button
                v-if="isAbnormalStatus"
                class="w-full px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold"
                @click="handleUploadEvidence"
              >上传补充材料</button>
              <button
                v-if="isAbnormalStatus"
                class="w-full px-4 py-2 bg-white border border-amber-300 text-amber-800 rounded-lg text-sm font-semibold hover:bg-amber-50"
                @click="handleSubmitExplanation"
              >提交整改说明</button>
              <button
                class="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
                @click="copyBatchId"
              >复制批次号</button>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { batchApi } from '../../services/api'

const route = useRoute()
const router = useRouter()
const batchId = route.params.batchId || ''

const batch = ref(null)
const timeline = ref([])
const loading = ref(true)
const errorMsg = ref('')

// 整改操作相关状态
const showUploadArea = ref(false)
const showExplanationArea = ref(false)
const showOriginalRecord = ref(false)
const evidenceFileHash = ref('')
const explanationText = ref('')
const explanationSubmitted = ref(false)

onMounted(async () => {
  if (!batchId) {
    errorMsg.value = '批次号缺失'
    loading.value = false
    return
  }

  try {
    const detail = await batchApi.getBatchDetail(batchId)
    batch.value = detail
    timeline.value = detail.timeline || []
  } catch (err) {
    errorMsg.value = err?.message || '加载批次详情失败'
  } finally {
    loading.value = false
  }
})

const isCreatedStatus = computed(() => {
  const code = batch.value?.chainStatusCode
  const sc = String(batch.value?.statusCode || '')
  return code === 0 || sc === 'Created'
})

const isFarmingOrLater = computed(() => {
  const code = batch.value?.chainStatusCode ?? -1
  return code >= 1 && code !== 10
})

const isAbnormalStatus = computed(() => {
  const code = batch.value?.chainStatusCode
  const sc = String(batch.value?.statusCode || '')
  return code === 10 || sc === 'Abnormal'
})

function copyBatchId() {
  navigator.clipboard?.writeText(batchId)
  window.alert('批次号已复制')
}

function isAbnormalNode(item) {
  const stage = String(item.stage || '')
  const detail = String(item.detail || '')
  return stage.includes('异常') || detail.includes('异常') || detail.includes('超标') || detail.includes('报警') || stage.includes('违规')
}

function handleUploadEvidence() {
  showUploadArea.value = !showUploadArea.value
  showExplanationArea.value = false
}

function handleSubmitExplanation() {
  showExplanationArea.value = !showExplanationArea.value
  showUploadArea.value = false
}

async function handleEvidenceFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const formData = new FormData()
    formData.append('file', file)
    const result = await batchApi.uploadFile(batchId, formData)
    evidenceFileHash.value = result.fileHash || `0xmock_evidence_${Date.now()}`
  } catch {
    evidenceFileHash.value = `0xmock_evidence_${Date.now()}`
  }
}

function submitExplanation() {
  if (!explanationText.value.trim()) return
  // mock 模式下直接标记为已提交
  explanationSubmitted.value = true
}
</script>
