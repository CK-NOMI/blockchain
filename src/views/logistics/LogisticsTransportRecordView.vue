<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">运输任务录入</h1>
        <p class="text-sm text-slate-500 mt-1">录入车辆、司机、运输起终点和预计到达时间。</p>
      </div>
      <div class="flex gap-2">
        <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="saveDraft">保存草稿</button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold" :disabled="submitting" @click="submitTransport">
          {{ submitting ? '提交中...' : '下一步录入温湿度' }}
        </button>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-5">
      <!-- 批次摘要 -->
      <section class="col-span-12 bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div class="flex gap-4 text-sm">
          <div><span class="text-slate-500">批次号：</span><span class="font-mono font-semibold">{{ batchId }}</span></div>
          <div><span class="text-slate-500">产品：</span><span>{{ productName }}</span></div>
          <div><span class="text-slate-500">当前状态：</span><span class="text-blue-700 font-semibold">{{ currentStatus || '--' }}</span></div>
        </div>
      </section>

      <!-- 车辆信息 -->
      <section class="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-5">车辆与司机信息</h2>
        <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">车辆编号</label>
            <input v-model="form.vehicleId" type="text" placeholder="例如：VL-0042" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">车牌号</label>
            <input v-model="form.licensePlate" type="text" placeholder="例如：京A12345" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">冷链车类型</label>
            <select v-model="form.vehicleType" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600">
              <option value="">请选择车型</option>
              <option value="refrigerated">冷藏车</option>
              <option value="frozen">冷冻车</option>
              <option value="insulated">保温车</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">温控能力(°C)</label>
            <input v-model="form.tempRange" type="text" placeholder="例如：-5~10" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">司机姓名</label>
            <input v-model="form.driverName" type="text" placeholder="请输入司机姓名" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">联系电话</label>
            <input v-model="form.driverPhone" type="tel" placeholder="请输入联系电话" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
        </form>
      </section>

      <!-- 运输信息 -->
      <section class="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-5">运输路线</h2>
        <form class="grid grid-cols-1 gap-4" @submit.prevent>
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-3">出发地</label>
            <CascadingLocationSelect
              :province="form.originProvince"
              :city="form.originCity"
              province-label="省/直辖市"
              city-label="市/区"
              @update:province="form.originProvince = $event"
              @update:city="form.originCity = $event"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-3">目的地</label>
            <CascadingLocationSelect
              :province="form.destProvince"
              :city="form.destCity"
              province-label="省/直辖市"
              city-label="市/区"
              @update:province="form.destProvince = $event"
              @update:city="form.destCity = $event"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">出发时间</label>
            <input v-model="form.departTime" type="datetime-local" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">预计到达时间</label>
            <input v-model="form.arriveTime" type="datetime-local" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
        </form>
      </section>

      <!-- 状态卡 -->
      <aside class="col-span-12 lg:col-span-5 lg:col-start-8 lg:row-start-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
        <h3 class="text-base font-semibold text-slate-800 mb-4">运输状态</h3>
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500">当前环节</dt><dd class="text-slate-800 font-semibold">物流运输录入</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">上链状态</dt><dd class="text-amber-600">未上链</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">下一步</dt><dd class="text-slate-800">温湿度与节点记录</dd></div>
        </dl>
        <div v-if="txHash" class="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs">
          <p class="text-emerald-700 font-semibold mb-1">上链成功</p>
          <p class="text-emerald-600 font-mono break-all">TX: {{ txHash }}</p>
        </div>
        <div v-if="error" class="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-600">{{ error }}</div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLogisticsStore } from '../../stores'
import { batchApi } from '../../services/api'
import CascadingLocationSelect from '../../components/CascadingLocationSelect.vue'

const route = useRoute()
const router = useRouter()
const store = useLogisticsStore()

const batchId = computed(() => route.params.batchId || '')
const productName = ref('')
const currentStatus = ref('')
const submitting = ref(false)
const txHash = ref('')
const error = ref('')

const form = reactive({
  vehicleId: '',
  licensePlate: '',
  vehicleType: '',
  tempRange: '',
  driverName: '',
  driverPhone: '',
  originProvince: '',
  originCity: '',
  destProvince: '',
  destCity: '',
  departTime: '',
  arriveTime: '',
})

onMounted(async () => {
  if (!batchId.value) return
  try {
    const res = await batchApi.getBatchDetail(batchId.value)
    const d = res?.data || res
    if (!d || !d.productName) return
    productName.value = d.productName

    // 回显物流运输信息
    if (d.vehicleInfo) {
      const parts = d.vehicleInfo.split(' | ')
      if (parts[0]) form.vehicleType = parts[0]
      if (parts[1]) form.licensePlate = parts[1]
      if (parts[2]) form.driverName = parts[2].replace(/^司机:/, '')
    }
    if (d.routeInfo) {
      // "福建省 漳州市 → 江西省 宜春市 | 2026-05-11T13:15 ~ 2026-05-27T13:16"
      const routeParts = d.routeInfo.split(' | ')
      if (routeParts[0]) {
        const locs = routeParts[0].split(' → ')
        if (locs[0]) {
          const originParts = locs[0].split(' ')
          form.originProvince = originParts[0] || ''
          form.originCity = originParts.slice(1).join('') || ''
        }
        if (locs[1]) {
          const destParts = locs[1].split(' ')
          form.destProvince = destParts[0] || ''
          form.destCity = destParts.slice(1).join('') || ''
        }
      }
      if (routeParts[1]) {
        const times = routeParts[1].split(' ~ ')
        if (times[0]) form.departTime = times[0]
        if (times[1]) form.arriveTime = times[1]
      }
    }
    if (d.logisticsTxHash) txHash.value = d.logisticsTxHash
    if (d.status) currentStatus.value = d.status
  } catch { /* ignore */ }
})

function saveDraft() {
  window.alert('草稿已保存。')
}

async function submitTransport() {
  if (!form.vehicleId || !form.licensePlate || !form.driverName || !form.originProvince || !form.destProvince) {
    window.alert('请填写车辆编号、车牌号、司机姓名、出发地和目的地。')
    return
  }
  submitting.value = true
  error.value = ''
  try {
    const origin = [form.originProvince, form.originCity].filter(Boolean).join(' ')
    const destination = [form.destProvince, form.destCity].filter(Boolean).join(' ')
    const vehicleInfo = `${form.vehicleType} | ${form.licensePlate} | 司机:${form.driverName}`
    const routeInfo = `${origin} → ${destination} | ${form.departTime} ~ ${form.arriveTime}`
    const result = await store.submitTransportRecord(batchId.value, { vehicleInfo, routeInfo })
    txHash.value = result?.txHash || ''
    window.alert('物流运输信息已提交上链')
    router.push(`/logistics/temp-record/${batchId.value}`)
  } catch (e) {
    error.value = e?.message || '提交失败'
  } finally {
    submitting.value = false
  }
}
</script>
