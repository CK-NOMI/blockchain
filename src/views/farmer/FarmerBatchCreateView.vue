<template>
  <div class="space-y-6 font-['Manrope',sans-serif]">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">新建批次</h1>
        <p class="text-sm text-slate-500 mt-1">在源头侧初始化溯源批次信息并上链。</p>
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
      <p class="text-emerald-800 font-semibold">✅ 批次创建成功</p>
      <dl class="mt-2 text-sm space-y-1">
        <div class="flex gap-2">
          <dt class="text-emerald-600 w-20">批次号:</dt>
          <dd class="font-mono text-emerald-900">{{ successInfo.batchId }}</dd>
        </div>
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
        @click="goToFarmRecord"
      >进入农事记录 →</button>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMsg" class="bg-rose-50 border border-rose-200 rounded-xl p-4">
      <p class="text-rose-700 text-sm">❌ {{ errorMsg }}</p>
    </div>

    <div class="grid grid-cols-12 gap-5">
      <!-- 表单区 -->
      <section class="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-5">基础信息</h2>
        <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">产品名称 <span class="text-rose-500">*</span></label>
            <input
              v-model="form.productName"
              type="text"
              placeholder="例如：有机苹果"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">品种/分类</label>
            <select
              v-model="form.category"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">请选择分类</option>
              <option value="水果">水果</option>
              <option value="蔬菜">蔬菜</option>
              <option value="粮食">粮食</option>
              <option value="茶叶">茶叶</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">产地 <span class="text-rose-500">*</span></label>
            <input
              v-model="form.origin"
              type="text"
              placeholder="例如：山东烟台"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">数量（斤/箱）</label>
            <input
              v-model.number="form.quantity"
              type="number"
              min="0"
              placeholder="例如：500"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">种植日期</label>
            <input
              v-model="form.plantDate"
              type="date"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">批次号（留空自动生成）</label>
            <input
              v-model="form.batchId"
              type="text"
              placeholder="留空则系统自动生成"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-mono"
            />
          </div>
        </form>
      </section>

      <!-- 状态侧栏 -->
      <aside class="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
        <h3 class="text-base font-semibold text-slate-800 mb-4">批次状态</h3>
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between">
            <dt class="text-slate-500">当前状态</dt>
            <dd class="font-semibold" :class="successInfo ? 'text-emerald-600' : 'text-amber-600'">
              {{ successInfo ? '已上链' : '草稿' }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">当前环节</dt>
            <dd class="text-slate-800">农户录入</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">上链状态</dt>
            <dd :class="successInfo ? 'text-emerald-600' : 'text-amber-600'">
              {{ successInfo ? '已提交' : '未提交' }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">下一步</dt>
            <dd class="text-slate-800">{{ successInfo ? '录入农事记录' : '提交上链' }}</dd>
          </div>
        </dl>

        <div class="mt-6 pt-4 border-t border-slate-100">
          <h4 class="text-xs font-semibold text-slate-500 mb-2">说明</h4>
          <ul class="text-xs text-slate-500 space-y-1 list-disc pl-4">
            <li>产品名称、产地为必填项</li>
            <li>批次号留空则系统自动生成唯一编号</li>
            <li>提交后数据将写入区块链，不可篡改</li>
            <li>创建成功后可继续录入农事记录</li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { batchApi } from '../../services/api'

const router = useRouter()

const form = reactive({
  productName: '',
  category: '',
  origin: '',
  quantity: '',
  plantDate: '',
  batchId: '',
})

const submitting = ref(false)
const errorMsg = ref('')
const successInfo = ref(null)

async function handleSubmit() {
  errorMsg.value = ''

  if (!form.productName.trim()) {
    errorMsg.value = '产品名称不能为空'
    return
  }
  if (!form.origin.trim()) {
    errorMsg.value = '产地不能为空'
    return
  }

  submitting.value = true
  try {
    const payload = {
      productName: form.productName.trim(),
      origin: form.origin.trim(),
      category: form.category,
      quantity: form.quantity || 0,
      plantDate: form.plantDate || '',
    }
    if (form.batchId.trim()) {
      payload.batchId = form.batchId.trim()
    }

    const result = await batchApi.createBatch(payload)
    successInfo.value = {
      batchId: result.batchId || form.batchId || '(已生成)',
      txHash: result.txHash || '',
      blockNumber: result.blockNumber ?? '',
    }
  } catch (err) {
    errorMsg.value = err?.message || '创建批次失败，请检查网络或联系管理员'
  } finally {
    submitting.value = false
  }
}

function goToFarmRecord() {
  if (successInfo.value?.batchId) {
    router.push(`/farmer/records/${successInfo.value.batchId}`)
  }
}
</script>
