<template>
  <div class="space-y-6 font-['Manrope',sans-serif]">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">农事记录</h1>
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
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          :disabled="submitting"
          @click="handleSubmit"
        >
          {{ submitting ? '提交中...' : '提交上链' }}
        </button>
      </div>
    </header>

    <!-- 成功提示 -->
    <div v-if="successInfo" class="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
      <p class="text-emerald-800 font-semibold">✅ 农事记录提交成功</p>
      <dl class="mt-2 text-sm space-y-1">
        <div class="flex gap-2">
          <dt class="text-emerald-600 w-20">交易哈希:</dt>
          <dd class="font-mono text-emerald-900 break-all">{{ successInfo.txHash }}</dd>
        </div>
        <div class="flex gap-2">
          <dt class="text-emerald-600 w-20">区块高度:</dt>
          <dd class="text-emerald-900">{{ successInfo.blockNumber }}</dd>
        </div>
      </dl>
      <button
        class="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold"
        @click="router.push(`/farmer/batch-detail/${batchId}`)"
      >查看批次详情 →</button>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMsg" class="bg-rose-50 border border-rose-200 rounded-xl p-4">
      <p class="text-rose-700 text-sm">❌ {{ errorMsg }}</p>
    </div>

    <div class="grid grid-cols-12 gap-5">
      <!-- 表单区 -->
      <section class="col-span-12 lg:col-span-8 space-y-5">
        <!-- 种植与采收 -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">种植与采收信息</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-2">种植日期</label>
              <input
                v-model="form.plantDate"
                type="date"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-2">播种日期 <span class="text-rose-500">*</span></label>
              <input
                v-model="form.sowingDate"
                type="date"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-2">采收日期 <span class="text-rose-500">*</span></label>
              <input
                v-model="form.harvestDate"
                type="date"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        <!-- 施肥与农药 -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">施肥与农药记录</h2>
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-2">施肥记录</label>
              <textarea
                v-model="form.fertilizerRecord"
                rows="3"
                placeholder="例如：2026-03-15 施用有机肥200kg/亩；2026-04-10 追施复合肥50kg/亩"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              ></textarea>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-2">农药使用记录</label>
              <textarea
                v-model="form.pesticideRecord"
                rows="3"
                placeholder="例如：2026-04-20 喷施生物农药（苏云金杆菌），安全间隔期7天"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 责任人与附件 -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">责任人与附件</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-2">责任人姓名 <span class="text-rose-500">*</span></label>
              <input
                v-model="form.principalName"
                type="text"
                placeholder="例如：张三"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-2">附件上传（可选）</label>
              <input
                type="file"
                @change="handleFileChange"
                class="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p v-if="fileHash" class="mt-1 text-xs text-slate-500 font-mono break-all">
                文件哈希: {{ fileHash }}
              </p>
              <p v-if="uploadingFile" class="mt-1 text-xs text-blue-600">上传中...</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 侧栏 -->
      <aside class="col-span-12 lg:col-span-4 space-y-5">
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 class="text-base font-semibold text-slate-800 mb-4">提交说明</h3>
          <ul class="text-xs text-slate-500 space-y-2 list-disc pl-4">
            <li>播种日期、采收日期、责任人为必填项</li>
            <li>日期需满足逻辑：种植 ≤ 播种 ≤ 采收</li>
            <li>施肥和农药记录建议包含时间、用量</li>
            <li>附件上传后系统自动计算SHA-256哈希</li>
            <li>提交后数据写入区块链，不可篡改</li>
            <li>提交成功后批次状态变为"农事记录已提交"</li>
          </ul>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 class="text-base font-semibold text-slate-800 mb-4">当前填写摘要</h3>
          <dl class="text-sm space-y-2">
            <div class="flex justify-between">
              <dt class="text-slate-500">种植日期</dt>
              <dd class="text-slate-800">{{ form.plantDate || '--' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500">播种日期</dt>
              <dd class="text-slate-800">{{ form.sowingDate || '--' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500">采收日期</dt>
              <dd class="text-slate-800">{{ form.harvestDate || '--' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500">施肥</dt>
              <dd class="text-slate-800">{{ form.fertilizerRecord ? '已填' : '--' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500">农药</dt>
              <dd class="text-slate-800">{{ form.pesticideRecord ? '已填' : '--' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500">责任人</dt>
              <dd class="text-slate-800">{{ form.principalName || '--' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500">附件哈希</dt>
              <dd class="text-slate-800 font-mono text-xs">{{ fileHash ? '已上传' : '--' }}</dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { batchApi } from '../../services/api'

const route = useRoute()
const router = useRouter()
const batchId = route.params.batchId || ''

const form = reactive({
  plantDate: '',
  sowingDate: '',
  harvestDate: '',
  fertilizerRecord: '',
  pesticideRecord: '',
  principalName: '',
})

const fileHash = ref('')
const uploadingFile = ref(false)
const submitting = ref(false)
const errorMsg = ref('')
const successInfo = ref(null)
const batchExists = ref(true)

onMounted(async () => {
  if (!batchId) return
  try {
    await batchApi.getBatchDetail(batchId)
  } catch {
    batchExists.value = false
    errorMsg.value = '批次不存在，请先在“我的批次”中选择已创建的真实批次'
  }
})

async function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  uploadingFile.value = true
  fileHash.value = ''
  try {
    const formData = new FormData()
    formData.append('file', file)
    const result = await batchApi.uploadFile(batchId, formData)
    fileHash.value = result.fileHash || ''
  } catch (err) {
    errorMsg.value = '文件上传失败: ' + (err?.message || '未知错误')
  } finally {
    uploadingFile.value = false
  }
}

async function handleSubmit() {
  errorMsg.value = ''

  if (!batchId) {
    errorMsg.value = '批次号缺失，请从批次创建页进入'
    return
  }

  if (!batchExists.value) {
    errorMsg.value = '批次不存在，请先在“我的批次”中选择已创建的真实批次'
    return
  }

  if (!form.sowingDate || !form.harvestDate || !form.principalName.trim()) {
    errorMsg.value = '播种日期、采收日期、责任人为必填项'
    return
  }

  // 日期逻辑校验
  if (form.plantDate && form.sowingDate && form.plantDate > form.sowingDate) {
    errorMsg.value = '种植日期不能晚于播种日期'
    return
  }
  if (form.sowingDate && form.harvestDate && form.harvestDate < form.sowingDate) {
    errorMsg.value = '采收日期不能早于播种日期'
    return
  }

  submitting.value = true
  try {
    const payload = {
      plantDate: form.plantDate,
      sowingDate: form.sowingDate,
      harvestDate: form.harvestDate,
      fertilizerRecord: form.fertilizerRecord.trim(),
      pesticideRecord: form.pesticideRecord.trim(),
      principalName: form.principalName.trim(),
      fileHash: fileHash.value,
    }

    const result = await batchApi.addFarmRecord(batchId, payload)
    successInfo.value = {
      txHash: result.txHash || '',
      blockNumber: result.blockNumber ?? '',
    }
  } catch (err) {
    errorMsg.value = err?.message || '提交农事记录失败'
  } finally {
    submitting.value = false
  }
}
</script>
