<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">入库验收记录</h1>
        <p class="text-sm text-slate-500 mt-1">验收批次商品并录入存储信息。</p>
      </div>
      <div class="flex gap-2">
        <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="$router.push(`/retail/batch-detail/${batchId}`)">查看详情</button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold" :disabled="submitting" @click="submitRecord">
          {{ submitting ? '提交中...' : '提交上链' }}
        </button>
      </div>
    </header>

    <section class="bg-blue-50 rounded-xl p-4 border border-blue-100 flex gap-4 text-sm">
      <div><span class="text-slate-500">批次号：</span><span class="font-mono font-semibold">{{ batchId }}</span></div>
      <div><span class="text-slate-500">状态：</span><span class="text-blue-700 font-semibold">待入库</span></div>
    </section>

    <div class="grid grid-cols-12 gap-5">
      <section class="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-5">入库信息</h2>
        <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent>
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-3">存储位置</label>
            <CascadingLocationSelect
              :province="form.storeProvince"
              :city="form.storeCity"
              province-label="省/直辖市"
              city-label="市/区"
              @update:province="form.storeProvince = $event"
              @update:city="form.storeCity = $event"
            />
            <input v-model="form.storeDetail" type="text" placeholder="详细地址：冷库A区-货架12" class="w-full mt-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">入库时间</label>
            <input v-model="form.storedAt" type="datetime-local" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">验收人</label>
            <input v-model="form.reviewer" type="text" placeholder="请输入验收人姓名" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">入库数量</label>
            <input v-model="form.quantity" type="text" placeholder="例如：200箱" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">验收结果</label>
            <select v-model="form.checkResult" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600">
              <option value="">请选择</option>
              <option value="pass">合格</option>
              <option value="partial">部分合格</option>
              <option value="fail">不合格</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-2">备注</label>
            <textarea v-model="form.remark" rows="3" placeholder="入库备注信息..." class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 resize-none"></textarea>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-2">上传验收报告（可选）</label>
            <input type="file" @change="onFileChange" class="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
        </form>
      </section>

      <aside class="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
        <h3 class="text-base font-semibold text-slate-800 mb-4">链上状态</h3>
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500">当前环节</dt><dd class="text-slate-800 font-semibold">超市入库验收</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">上链状态</dt><dd class="text-amber-600">未上链</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">验收结果</dt><dd class="text-slate-800">{{ form.checkResult || '--' }}</dd></div>
        </dl>
        <div v-if="txHash" class="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs">
          <p class="text-emerald-700 font-semibold mb-1">提交成功</p>
          <p class="text-emerald-600 font-mono break-all">{{ txHash }}</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetailStore } from '../../stores'
import CascadingLocationSelect from '../../components/CascadingLocationSelect.vue'

const route = useRoute()
const router = useRouter()
const store = useRetailStore()

const batchId = computed(() => route.params.batchId || 'SC20240521001')
const submitting = ref(false)
const txHash = ref('')
const selectedFile = ref(null)

const form = reactive({
  storeProvince: '',
  storeCity: '',
  storeDetail: '',
  storedAt: '',
  reviewer: '',
  quantity: '',
  checkResult: '',
  remark: '',
})

function onFileChange(e) {
  selectedFile.value = e.target.files?.[0] || null
}

async function submitRecord() {
  if (!form.storeProvince || !form.reviewer || !form.checkResult) {
    window.alert('请填写存储位置（省份）、验收人和验收结果。')
    return
  }
  const storeLocation = [form.storeProvince, form.storeCity, form.storeDetail].filter(Boolean).join(' ')
  submitting.value = true
  try {
    let fileHash = ''
    if (selectedFile.value) {
      const fd = new FormData()
      fd.append('file', selectedFile.value)
      const uploadResult = await store.uploadFile(batchId.value, fd)
      fileHash = uploadResult?.fileHash || ''
    }
    const saleStatus = `验收:${form.checkResult} | 验收人:${form.reviewer} | 数量:${form.quantity} | ${form.remark}`
    const result = await store.submitRetailRecord(batchId.value, {
      storeLocation,
      saleStatus,
      fileHash,
    })
    txHash.value = result?.txHash || ''
    window.alert('入库验收记录已提交上链')
    router.push(`/retail/sale-status/${batchId.value}`)
  } catch (e) {
    window.alert('提交失败: ' + (e?.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}
</script>
