<template>
  <div class="flex-1 overflow-y-auto pb-32 relative">
    <div class="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6">
      <!-- Left Column: Forms -->
      <div class="flex-1 flex flex-col gap-6">
        <!-- Batch Header -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-2xl font-bold text-slate-900 mb-2 font-manrope">加工与质检录入</h1>
              <p class="text-sm text-slate-500 flex items-center gap-2">
                <span class="material-icons text-sm">tag</span>
                Batch ID: <span class="font-mono text-sm text-blue-600">#{{ batchId }}</span>
              </p>
            </div>
            <div v-if="submitted" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs border border-green-200">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              已提交上链
            </div>
            <div v-else class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs border border-slate-200">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              草稿模式
            </div>
          </div>
          <div class="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-200">
            <div>
              <div class="text-xs text-slate-500 mb-1 uppercase tracking-wider">产品名称</div>
              <div class="text-base font-semibold text-slate-900">{{ batchInfo.productName }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500 mb-1 uppercase tracking-wider">农户</div>
              <div class="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span class="material-icons text-lg text-blue-600">person</span>
                {{ batchInfo.farmer }}
              </div>
            </div>
            <div>
              <div class="text-xs text-slate-500 mb-1 uppercase tracking-wider">产地</div>
              <div class="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span class="material-icons text-lg text-green-600">location_on</span>
                {{ batchInfo.origin }}
              </div>
            </div>
          </div>
        </div>

        <!-- Upstream Info -->
        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span class="material-icons text-slate-400">history</span>
              上游信息
            </h2>
            <button class="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1 transition-colors">
              查看农事记录
              <span class="material-icons text-sm">arrow_forward</span>
            </button>
          </div>
          <div class="flex gap-12 bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div>
              <div class="text-xs text-slate-500 mb-1">采收日期</div>
              <div class="text-sm font-mono text-slate-900">{{ batchInfo.harvestDate }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500 mb-1">接收数量</div>
              <div class="text-sm font-mono text-slate-900">{{ batchInfo.quantity }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500 mb-1">交付温度</div>
              <div class="text-sm font-mono text-green-700">{{ batchInfo.deliveryTemp }}</div>
            </div>
          </div>
        </div>

        <!-- Processing Info Form -->
        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <span class="material-icons text-slate-400">precision_manufacturing</span>
            加工信息
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div class="col-span-2">
              <label class="block text-xs font-medium text-slate-500 mb-1.5">加工企业名称</label>
              <input
                v-model="form.company"
                class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 bg-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                type="text"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1.5">加工日期</label>
              <input
                v-model="form.processDate"
                class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                type="date"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1.5">加工方式</label>
              <select
                v-model="form.method"
                class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none bg-white"
              >
                <option>标准清洗分拣</option>
                <option>冷压榨取</option>
                <option>发酵处理</option>
                <option>烘干脱水</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1.5">包装规格</label>
              <input
                v-model="form.packaging"
                class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="例如: 5kg/箱"
                type="text"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1.5">负责人</label>
              <input
                v-model="form.manager"
                class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="负责人姓名"
                type="text"
              />
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-medium text-slate-500 mb-1.5">说明</label>
              <textarea
                v-model="form.notes"
                class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="输入额外加工备注..."
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Quality Info Form -->
        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <span class="material-icons text-slate-400">fact_check</span>
            质检信息
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1.5">质检机构</label>
              <input
                v-model="qcForm.agency"
                class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="例如: 国家农产品质量中心"
                type="text"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1.5">质检员</label>
              <input
                v-model="qcForm.inspector"
                class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="检验员姓名"
                type="text"
              />
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-medium text-slate-500 mb-1.5">检测项目</label>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(item, i) in qcForm.items" :key="i"
                  class="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200 text-sm text-slate-900"
                >
                  {{ item }}
                  <button @click="removeItem(i)" class="material-icons text-sm text-slate-400 hover:text-red-500 transition-colors">close</button>
                </span>
                <button
                  @click="addItem"
                  class="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-dashed border-blue-500 text-blue-600 rounded-md text-sm hover:bg-blue-50 transition-colors"
                >
                  <span class="material-icons text-sm">add</span> 添加项目
                </button>
              </div>
            </div>
            <div class="col-span-2 mt-2">
              <label class="block text-xs font-medium text-slate-500 mb-3">检测结果</label>
              <div class="flex gap-6">
                <label class="flex items-center gap-2 cursor-pointer group">
                  <div
                    class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                    :class="qcForm.result === 'pass' ? 'border-green-500' : 'border-slate-300 group-hover:border-green-500'"
                  >
                    <div class="w-2.5 h-2.5 rounded-full" :class="qcForm.result === 'pass' ? 'bg-green-500' : 'opacity-0'"></div>
                  </div>
                  <input type="radio" name="qc_result" value="pass" v-model="qcForm.result" class="hidden" />
                  <span class="text-sm text-slate-900 group-hover:text-green-600 transition-colors">合格</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer group">
                  <div
                    class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                    :class="qcForm.result === 'fail' ? 'border-red-500' : 'border-slate-300 group-hover:border-red-500'"
                  >
                    <div class="w-2.5 h-2.5 rounded-full" :class="qcForm.result === 'fail' ? 'bg-red-500' : 'opacity-0'"></div>
                  </div>
                  <input type="radio" name="qc_result" value="fail" v-model="qcForm.result" class="hidden" />
                  <span class="text-sm text-slate-900 group-hover:text-red-600 transition-colors">不合格</span>
                </label>
              </div>
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-medium text-slate-500 mb-1.5">备注</label>
              <textarea
                v-model="qcForm.notes"
                class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="质检备注..."
                rows="2"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Timeline Sidebar -->
      <div class="w-full lg:w-80 shrink-0">
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-6 border-b border-slate-200 pb-4">批次状态</h3>
          <div class="relative border-l-2 border-slate-200 ml-3 space-y-8">
            <!-- Node 1: 农户采收 -->
            <div class="relative pl-6">
              <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 ring-4 ring-white"></div>
              <div class="text-xs text-green-600 font-bold mb-1">已完成</div>
              <div class="text-base text-slate-900 font-semibold">农户采收</div>
              <div class="text-xs font-mono text-slate-400 mt-1">Tx: {{ batchInfo.farmTxHash || '暂无' }}</div>
            </div>
            <!-- Node 2: 加工录入 -->
            <div v-if="submitted" class="relative pl-6">
              <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 ring-4 ring-white"></div>
              <div class="text-xs text-green-600 font-bold mb-1">已完成</div>
              <div class="text-base text-slate-900 font-semibold">加工录入</div>
              <div class="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div class="flex items-center gap-2 mb-2">
                  <span class="material-icons text-green-600 text-lg">link</span>
                  <span class="text-xs text-green-700">已上链</span>
                </div>
                <div class="text-xs font-mono text-slate-500 break-all">Tx: {{ txHash }}</div>
              </div>
            </div>
            <div v-else class="relative pl-6">
              <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100 animate-pulse"></div>
              <div class="text-xs text-blue-600 font-bold mb-1 flex items-center gap-1">
                当前节点
                <span class="material-icons text-sm">edit</span>
              </div>
              <div class="text-base text-slate-900 font-semibold">加工录入</div>
              <div class="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="flex items-center gap-2 mb-2">
                  <span class="material-icons text-slate-400 text-lg">link_off</span>
                  <span class="text-xs text-slate-500">上链状态:</span>
                </div>
                <div class="text-sm text-slate-900 font-semibold">未上链</div>
              </div>
            </div>
            <!-- Node 3: 跳转到上传页 -->
            <router-link
              :to="'/processor/file-upload/' + batchId"
              class="relative pl-6 block hover:bg-slate-50 rounded-lg -mx-2 px-3 py-1 transition-colors"
              :class="submitted ? '' : 'opacity-50'"
            >
              <div
                class="absolute -left-[9px] top-1 w-4 h-4 rounded-full ring-4 ring-white"
                :class="submitted ? 'bg-green-500' : 'bg-slate-300'"
              ></div>
              <div class="text-xs font-bold mb-1" :class="submitted ? 'text-green-600' : 'text-slate-500'">下一步</div>
              <div class="text-base text-slate-900 font-semibold">上传质检报告</div>
              <div class="text-xs text-blue-500 mt-1">前往上传页面 →</div>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div class="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shadow-lg z-30" style="margin-left: 16rem; width: calc(100% - 16rem);">
      <div class="text-sm text-slate-500 flex items-center gap-2">
        <span class="material-icons text-lg">info</span>
        请确保所有物理记录与数字录入一致。
      </div>
      <div class="flex gap-3">
        <button
          @click="saveDraft"
          :disabled="submitted"
          class="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >保存草稿</button>
        <button
          v-if="!submitted"
          @click="submitOnChain"
          class="px-8 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span class="material-icons text-lg">link</span>
          提交上链
        </button>
        <button
          v-else
          @click="gotoDetail"
          class="px-8 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span class="material-icons text-lg">arrow_forward</span>
          上传质检报告
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { batchApi } from '../../services/api'

const route = useRoute()
const router = useRouter()
const batchId = route.params.batchId || ''

const batchInfo = reactive({
  productName: '',
  farmer: '',
  origin: '',
  harvestDate: '',
  quantity: '',
  deliveryTemp: '',
  farmTxHash: '',
})

const form = reactive({
  company: '',
  processDate: '',
  method: '',
  packaging: '',
  manager: '',
  notes: '',
})

const qcForm = reactive({
  agency: '',
  inspector: '',
  items: [],
  result: 'pass',
  notes: '',
})

const submitted = ref(false)
const txHash = ref('')

onMounted(async () => {
  try {
    const res = await batchApi.getBatchDetail(batchId)
    const d = res?.data || res
    if (!d || !d.productName) {
      loadFormDraft()
      return
    }

    // 回显批次信息（无论是否已加工）
    if (d.productName) batchInfo.productName = d.productName
    if (d.origin) batchInfo.origin = d.origin
    if (d.farmer) batchInfo.farmer = d.farmer
    if (d.quantity) batchInfo.quantity = Number(d.quantity).toLocaleString() + ' kg'
    if (d.harvestDate) batchInfo.harvestDate = d.harvestDate
    if (d.transactionHash) batchInfo.farmTxHash = d.transactionHash

    // 没有已提交的加工数据：只回显批次信息，表单恢复草稿
    if (!d.checkResult) {
      loadFormDraft()
      return
    }

    const qc = JSON.parse(d.checkResult || '{}')
    if (typeof qc !== 'object') {
      loadFormDraft()
      return
    }

    // 回显加工表单
    if (qc.company) form.company = qc.company
    if (qc.method) form.method = qc.method
    if (qc.packaging) form.packaging = qc.packaging
    if (qc.manager) form.manager = qc.manager
    if (qc.notes) form.notes = qc.notes
    // 加工日期：优先 d.processType，其次 json.processDate
    if (d.processType && /^\d{4}-\d{2}/.test(String(d.processType))) {
      form.processDate = d.processType
    } else if (qc.processDate) {
      form.processDate = qc.processDate
    }

    // 回显质检表单
    if (qc.qcAgency) qcForm.agency = qc.qcAgency
    if (qc.qcInspector) qcForm.inspector = qc.qcInspector
    if (Array.isArray(qc.qcItems) && qc.qcItems.length) qcForm.items = qc.qcItems
    if (qc.qcResult === '合格') qcForm.result = 'pass'
    else if (qc.qcResult === '不合格') qcForm.result = 'fail'
    if (qc.qcNotes) qcForm.notes = qc.qcNotes

    // 交易哈希
    if (d.transactionHash) txHash.value = d.transactionHash

    // 已提交，锁定表单
    submitted.value = true
    clearFormDraft()
  } catch {
    // 链不可达或不存在记录：尝试恢复草稿
    loadFormDraft()
  }
})

const addItem = () => {
  const label = prompt('输入检测项目名称:')
  if (label && label.trim()) qcForm.items.push(label.trim())
}

const removeItem = (i) => {
  qcForm.items.splice(i, 1)
}

const DRAFT_KEY = 'process_draft_' + batchId

function saveFormDraft() {
  const data = {
    form: { ...form },
    qcForm: {
      agency: qcForm.agency,
      inspector: qcForm.inspector,
      items: [...qcForm.items],
      result: qcForm.result,
      notes: qcForm.notes,
    },
  }
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)) } catch {}
}

function loadFormDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (!data || !data.form) return
    Object.assign(form, data.form)
    if (data.qcForm) {
      qcForm.agency = data.qcForm.agency || ''
      qcForm.inspector = data.qcForm.inspector || ''
      qcForm.items = Array.isArray(data.qcForm.items) ? data.qcForm.items : []
      qcForm.result = data.qcForm.result || 'pass'
      qcForm.notes = data.qcForm.notes || ''
    }
  } catch {}
}

function clearFormDraft() {
  try { localStorage.removeItem(DRAFT_KEY) } catch {}
}

// 表单变化自动保存草稿
let autoSaveTimer = null
watch([form, qcForm], () => {
  if (submitted.value) return
  clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(saveFormDraft, 800)
}, { deep: true })

// 离开页面时自动保存
onBeforeRouteLeave(() => {
  if (!submitted.value) saveFormDraft()
})

const saveDraft = () => {
  saveFormDraft()
  alert('草稿已保存。')
}

const submitOnChain = async () => {
  try {
    // 组装后端期望的字段：processType, description
    const payload = {
      processType: form.processDate,
      description: JSON.stringify({
        company: form.company,
        processDate: form.processDate,
        method: form.method,
        packaging: form.packaging,
        manager: form.manager,
        notes: form.notes,
        qcAgency: qcForm.agency,
        qcInspector: qcForm.inspector,
        qcItems: qcForm.items,
        qcResult: qcForm.result === 'pass' ? '合格' : '不合格',
        qcNotes: qcForm.notes,
      }),
    }
    await batchApi.addProcessRecord(batchId, payload)
    clearFormDraft()
    alert('记录已提交上链。')
    router.push(`/processor/file-upload/${batchId}`)
  } catch (e) {
    alert('提交失败: ' + (e.message || '未知错误'))
  }
}

const gotoDetail = () => {
  router.push(`/processor/file-upload/${batchId}`)
}
</script>
