<template>
  <div class="flex-1 overflow-y-auto">
    <!-- Page Header / Batch Summary -->
    <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded uppercase tracking-wider font-medium">已加工</span>
          <span class="text-slate-400 text-xs">ID: {{ batchId }}</span>
        </div>
        <h1 class="text-2xl font-bold text-slate-900 font-manrope">{{ batchDetail.productName }} - 加工详情</h1>
      </div>
      <div class="flex gap-3">
        <button
          @click="verifyOnChain"
          class="bg-blue-600 text-white text-sm px-4 py-2 rounded shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span class="material-icons text-sm">check_circle</span>
          链上验证
        </button>
      </div>
      <input type="file" ref="fileInput" @change="onFileSelected" accept="*/*" class="hidden" />
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-12 gap-6">
      <!-- Main Content (Left 8 cols) -->
      <div class="col-span-12 lg:col-span-8 flex flex-col gap-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 gap-4">
          <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <p class="text-xs text-slate-500 mb-1">投入数量</p>
            <p class="text-lg font-semibold text-slate-900">
              {{ batchDetail.inputQty === '--' ? '--' : batchDetail.inputQty + ' kg' }}
            </p>
          </div>
        </div>

        <!-- Tabs Section -->
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="border-b border-slate-200 flex overflow-x-auto">
            <button
              v-for="tab in tabs" :key="tab.key"
              @click="activeTab = tab.key"
              class="px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors"
              :class="activeTab === tab.key ? 'text-blue-600 border-b-2 border-blue-600 bg-slate-50' : 'text-slate-500 hover:bg-slate-50'"
            >
              {{ tab.label }}
              <span v-if="tab.key === 'chain'" class="material-icons text-xs text-green-600 align-middle ml-1">verified</span>
            </button>
          </div>

          <!-- Tab: 加工信息 -->
          <div v-if="activeTab === 'processing'" class="p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">加工参数</h3>
            <div class="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p class="text-xs text-slate-500">加工企业名称</p>
                <p class="text-sm text-slate-900">{{ batchDetail.facility || '--' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500">加工日期</p>
                <p class="text-sm text-slate-900">{{ batchDetail.startTime || '--' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500">加工方式</p>
                <p class="text-sm text-slate-900">{{ batchDetail.method || '--' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500">包装规格</p>
                <p class="text-sm text-slate-900">{{ batchDetail.packaging || '--' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500">负责人</p>
                <p class="text-sm text-slate-900">{{ batchDetail.operator || '--' }}</p>
              </div>
              <div class="col-span-2">
                <p class="text-xs text-slate-500">说明</p>
                <p class="text-sm text-slate-900 bg-slate-50 p-3 rounded border border-slate-200 mt-1">{{ batchDetail.notes || '--' }}</p>
              </div>
            </div>
          </div>

          <!-- Tab: 质检结果 -->
          <div v-if="activeTab === 'qc'" class="p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">质检结果</h3>
            <template v-if="qcFields">
              <div class="grid grid-cols-2 gap-y-4 gap-x-8">
                <div v-for="f in qcFields" :key="f.label">
                  <p class="text-xs text-slate-500">{{ f.label }}</p>
                  <p class="text-sm text-slate-900" :class="f.label === '质检结果' ? (f.value === '合格' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold') : ''">{{ f.value || '--' }}</p>
                </div>
              </div>
            </template>
            <p v-else-if="batchDetail.checkResult" class="text-sm text-slate-900 bg-slate-50 p-4 rounded border border-slate-200 whitespace-pre-wrap">{{ batchDetail.checkResult }}</p>
            <p v-else class="text-sm text-slate-400">暂无质检记录</p>
          </div>

          <!-- Tab: 附件报告 -->
          <div v-if="activeTab === 'reports'" class="p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">附件报告</h3>
            <div v-if="batchDetail.reports.length" class="space-y-3">
              <div
                v-for="(rpt, i) in batchDetail.reports" :key="i"
                class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <span class="material-icons text-blue-600">description</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-900 truncate">{{ rpt.name }}</p>
                  <p class="text-xs text-slate-400">{{ rpt.date }} · {{ rpt.hash }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <a
                    v-if="rpt.fileUrl"
                    :href="rpt.fileUrl"
                    target="_blank"
                    class="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span class="material-icons text-sm">download</span>
                    下载
                  </a>
                  <span
                    v-else
                    class="text-xs text-slate-400 flex items-center gap-1 cursor-not-allowed"
                    title="文件未存储到服务器，请重新上传"
                  >
                    <span class="material-icons text-sm">download</span>
                    下载
                  </span>
                  <span class="text-xs text-green-600 flex items-center gap-1">
                    <span class="material-icons text-sm">check_circle</span>
                    已上链
                  </span>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-slate-400">暂无附件报告</p>
          </div>

          <!-- Tab: 链上数据 -->
          <div v-if="activeTab === 'chain'" class="p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">链上数据</h3>
            <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs text-slate-500">交易哈希</span>
                <span class="text-sm font-mono text-slate-900">{{ batchDetail.txHash }}</span>
              </div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs text-slate-500">区块高度</span>
                <span class="text-sm font-mono text-slate-900">{{ batchDetail.blockNumber ? '#' + Number(batchDetail.blockNumber).toLocaleString() : '--' }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-slate-500">上链时间</span>
                <span class="text-sm font-mono text-slate-900">{{ batchDetail.chainTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar (4 cols) -->
      <div class="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <!-- Timeline -->
        <div class="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-slate-900">溯源链路</h3>
            <span class="material-icons text-slate-400">linear_scale</span>
          </div>
          <div class="relative pl-6 space-y-8 border-l-2 border-slate-200">
            <div v-for="(node, i) in timeline" :key="i" class="relative">
              <div
                class="absolute -left-[33px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                :class="node.active ? 'bg-blue-600 ring-2 ring-blue-300' : node.completed ? 'bg-green-500' : 'bg-slate-300'"
              ></div>
              <p class="text-xs" :class="node.active ? 'text-blue-600 font-semibold' : 'text-slate-400'">{{ node.date }}</p>
              <p class="text-base font-semibold" :class="node.active ? 'text-blue-600' : 'text-slate-900'">{{ node.title }}</p>
              <p class="text-sm text-slate-500 mt-1">{{ node.desc }}</p>
              <div
                v-if="node.txHash"
                class="mt-2 bg-slate-50 p-2 rounded border border-slate-200 text-xs font-mono text-slate-500 break-all"
              >
                <span class="text-green-600 mr-1 font-bold">Tx:</span>{{ node.txHash }}
              </div>
            </div>
          </div>
        </div>

        <!-- Blockchain Status -->
        <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <div class="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
            <span class="material-icons text-blue-600">link</span>
            <h4 class="text-base text-slate-900 font-semibold">网络共识</h4>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-xs text-slate-500">最新块高</span>
              <span class="text-sm font-mono text-slate-900">{{ batchDetail.latestBlockNumber ? Number(batchDetail.latestBlockNumber).toLocaleString() : '--' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-xs text-slate-500">本批次块高</span>
              <span class="text-sm font-mono text-green-700">{{ batchDetail.blockNumber ? Number(batchDetail.blockNumber).toLocaleString() : '--' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-xs text-slate-500">确认数</span>
              <span class="text-sm font-mono text-slate-900">{{ batchDetail.blockNumber && batchDetail.latestBlockNumber ? (Number(batchDetail.latestBlockNumber) - Number(batchDetail.blockNumber) + 1) : '--' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { batchApi, traceApi } from '../../services/api'

const route = useRoute()
const batchId = route.params.batchId || ''

const activeTab = ref('processing')
const fileInput = ref(null)
const verifying = ref(false)
const verifyResult = ref(null) // { found, message } 或 null

const tabs = [
  { key: 'processing', label: '加工信息' },
  { key: 'qc', label: '质检结果' },
  { key: 'reports', label: '附件报告' },
  { key: 'chain', label: '链上数据' },
]

const batchDetail = reactive({
  productName: '--',
  inputQty: '--',
  facility: '--',
  operator: '--',
  startTime: '--',
  endTime: '--',
  method: '--',
  packaging: '--',
  notes: '--',
  qcAgency: '--',
  qcInspector: '--',
  qcItems: [],
  qcResult: '--',
  reports: [],
  txHash: '--',
  chainTime: '--',
  blockNumber: 0,
  latestBlockNumber: 0,
})

const timeline = ref([])

// 解析质检 JSON 为可展示的键值对
const QC_LABELS = {
  company: '加工企业', processDate: '加工日期', packaging: '包装规格', manager: '负责人',
  notes: '加工说明', qcAgency: '质检机构', qcInspector: '质检员',
  qcItems: '检测项目', qcResult: '质检结果', qcNotes: '质检备注',
}
const QC_ORDER = ['company','processDate','packaging','manager','notes','qcAgency','qcInspector','qcItems','qcResult','qcNotes']
const qcFields = computed(() => {
  const raw = batchDetail.checkResult
  if (!raw) return null
  let obj
  try { obj = JSON.parse(raw) } catch { return null }
  if (typeof obj !== 'object') return null
  return QC_ORDER.filter(k => k in obj).map(k => ({
    label: QC_LABELS[k] || k,
    value: Array.isArray(obj[k]) ? obj[k].join('、') : String(obj[k] ?? ''),
  }))
})

async function computeSHA256(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const verifyOnChain = () => {
  // 重置上次结果，弹出文件选择框让用户选择原始文件
  verifyResult.value = null
  fileInput.value?.click()
}

const onFileSelected = async (e) => {
  const file = e.target?.files?.[0]
  if (!file) return
  verifying.value = true
  verifyResult.value = null
  try {
    const hash = await computeSHA256(file)
    const res = await traceApi.verifyFileHash(batchId, hash)
    const d = res?.data || res
    verifyResult.value = {
      found: d?.found === true,
      message: d?.message || (d?.found ? '验真通过，文件未被篡改' : '验真失败，链上未找到该文件哈希'),
      hash,
    }
    if (d?.found) {
      alert('✓ 链上验证通过\n\n文件哈希: ' + hash + '\n\n' + d?.message)
    } else {
      alert('✗ 链上验证失败\n\n文件哈希: ' + hash + '\n\n' + (d?.message || '链上未找到该文件哈希'))
    }
  } catch (err) {
    verifyResult.value = { found: false, message: '验证请求失败: ' + (err.message || err), hash: '' }
    alert('验证失败: ' + (err.message || err))
  } finally {
    verifying.value = false
    e.target.value = '' // 清空 input 以便重新选择同一文件
  }
}

// Attempt to load real data
batchApi.getBatchDetail(batchId).then((data) => {
  const d = data?.data || data
  if (d && d.productName) {
    Object.assign(batchDetail, {
      productName: d.productName || batchDetail.productName,
      checkResult: d.checkResult || '',
    })

    // 更新加工信息（从 description JSON + 链上 processType 映射）
    let foundDate = false
    try {
      const qc = JSON.parse(d.checkResult || '{}')
      if (typeof qc === 'object') {
        if (qc.company) batchDetail.facility = qc.company
        if (qc.manager) batchDetail.operator = qc.manager
        if (qc.packaging) batchDetail.packaging = qc.packaging
        if (qc.notes) batchDetail.notes = qc.notes
        if (qc.method) batchDetail.method = qc.method
        // 加工日期：优先用 d.processType（新版=日期），其次 json.processDate
        if (d.processType && /^\d{4}-\d{2}/.test(String(d.processType))) {
          batchDetail.startTime = d.processType
          foundDate = true
        } else if (qc.processDate) {
          batchDetail.startTime = qc.processDate
          foundDate = true
        }
      }
    } catch {}
    // 旧版兼容：加工方式从 processType 字段读（旧版存的是方法名）
    if (!batchDetail.method || batchDetail.method === batchDetail.productName ||
        batchDetail.method === 'Cold press extraction followed by multi-stage filtration. Temperature maintained below 45°C to preserve nutritional integrity.') {
      if (d.processType && !/^\d{4}-\d{2}/.test(String(d.processType))) {
        batchDetail.method = d.processType
      }
    }
    // 日期仍为空时清除 demo 值
    if (!foundDate) batchDetail.startTime = '--'
    // 操作员兜底（manager 为空或仍是 demo 值时）
    if (!batchDetail.operator || batchDetail.operator === 'J. Smith (ID: OPR-8821)') {
      batchDetail.operator = d.processOperator ? d.processOperator.slice(0, 10) + '...' : '--'
    }
    // 清除其他 demo 值
    if (!batchDetail.packaging || batchDetail.packaging === batchDetail.productName) batchDetail.packaging = '--'
    if (!batchDetail.notes) batchDetail.notes = '--'
    if (!batchDetail.facility) batchDetail.facility = '--'

    // 更新投入/产出（从链上 quantity 映射）
    if (d.quantity) {
      batchDetail.inputQty = Number(d.quantity).toLocaleString()
    }

    // 链上数据
    if (d.transactionHash) batchDetail.txHash = d.transactionHash
    if (d.blockNumber) batchDetail.blockNumber = d.blockNumber
    batchDetail.chainTime = d.updatedAt || d.createdAt || '--'
    if (d.latestBlockNumber) batchDetail.latestBlockNumber = d.latestBlockNumber

    // 更新时间线：只显示实际发生的事件，不硬编码占位
    if (d.timeline && d.timeline.length) {
      timeline.value = d.timeline.map((t, i) => ({
        date: t.time || '',
        title: t.stage || '',
        desc: t.detail || '',
        completed: i < d.timeline.length - 1,
        active: i === d.timeline.length - 1,
        txHash: t.transactionHash || null,
      }))
    }

    if (d.fileHash) {
      batchDetail.reports = [{
        name: '质检报告',
        date: d.processTime ? new Date(Number(d.processTime)).toISOString().slice(0, 10) : '',
        hash: d.fileHash.slice(0, 8) + '...' + d.fileHash.slice(-4),
        _fullHash: d.fileHash,
        fileUrl: d.reportFile || '',
      }]
    } else {
      batchDetail.reports = []
    }
  }
}).catch(() => {})
</script>
