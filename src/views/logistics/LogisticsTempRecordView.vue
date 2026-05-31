<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">温湿度与运输节点记录</h1>
        <p class="text-sm text-slate-500 mt-1">记录运输过程中的温度、湿度、位置节点信息。</p>
      </div>
      <div class="flex gap-2">
        <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="$router.push(`/logistics/batch-detail/${batchId}`)">查看详情</button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold" :disabled="submitting" @click="submitRecord">
          {{ submitting ? '提交中...' : '提交上链' }}
        </button>
      </div>
    </header>

    <!-- 批次摘要 -->
    <section class="bg-blue-50 rounded-xl p-4 border border-blue-100 flex gap-4 text-sm">
      <div><span class="text-slate-500">批次号：</span><span class="font-mono font-semibold">{{ batchId }}</span></div>
      <div><span class="text-slate-500">状态：</span><span class="text-blue-700 font-semibold">运输中</span></div>
    </section>

    <div class="grid grid-cols-12 gap-5">
      <!-- 温控设置 -->
      <section class="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-5">温控阈值设置</h2>
        <form class="space-y-4" @submit.prevent>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-2">最低温度(°C)</label>
              <input v-model.number="threshold.minTemp" type="number" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-2">最高温度(°C)</label>
              <input v-model.number="threshold.maxTemp" type="number" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-2">最低湿度(%)</label>
              <input v-model.number="threshold.minHumidity" type="number" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-2">最高湿度(%)</label>
              <input v-model.number="threshold.maxHumidity" type="number" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
          </div>
        </form>
      </section>

      <!-- 温湿度对比图 -->
      <section class="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-5">温湿度概览</h2>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="bg-slate-50 rounded-lg p-4 text-center">
            <p class="text-xs text-slate-500">当前温度</p>
            <p class="text-3xl font-black" :class="tempAlert ? 'text-rose-600' : 'text-slate-900'">{{ currentTemp }}°C</p>
            <p class="text-[10px] text-slate-400">阈值: {{ threshold.minTemp }} ~ {{ threshold.maxTemp }}°C</p>
          </div>
          <div class="bg-slate-50 rounded-lg p-4 text-center">
            <p class="text-xs text-slate-500">当前湿度</p>
            <p class="text-3xl font-black" :class="humidityAlert ? 'text-rose-600' : 'text-slate-900'">{{ currentHumidity }}%</p>
            <p class="text-[10px] text-slate-400">阈值: {{ threshold.minHumidity }} ~ {{ threshold.maxHumidity }}%</p>
          </div>
        </div>
        <div v-if="tempAlert || humidityAlert" class="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-600">
          温湿度异常！请检查冷链设备。
        </div>
      </section>

      <!-- 节点记录表 -->
      <section class="col-span-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-slate-800">运输节点记录</h2>
          <button class="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-md" @click="addNode">添加节点</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[600px]">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="text-left px-4 py-3 font-semibold">时间</th>
                <th class="text-left px-4 py-3 font-semibold">地点</th>
                <th class="text-left px-4 py-3 font-semibold">温度(°C)</th>
                <th class="text-left px-4 py-3 font-semibold">湿度(%)</th>
                <th class="text-left px-4 py-3 font-semibold">节点类型</th>
                <th class="text-left px-4 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(node, idx) in nodes" :key="idx" class="border-t border-slate-100">
                <td class="px-4 py-3">
                  <input v-model="node.time" type="text" class="w-full px-2 py-1 border border-slate-200 rounded text-sm" />
                </td>
                <td class="px-4 py-3">
                  <input v-model="node.location" type="text" placeholder="输入地点" class="w-full px-2 py-1 border border-slate-200 rounded text-sm" />
                </td>
                <td class="px-4 py-3">
                  <input v-model.number="node.temp" type="number" step="0.1" class="w-20 px-2 py-1 border border-slate-200 rounded text-sm" :class="node.temp < threshold.minTemp || node.temp > threshold.maxTemp ? 'text-rose-600 font-semibold' : 'text-slate-700'" />
                </td>
                <td class="px-4 py-3">
                  <input v-model.number="node.humidity" type="number" step="1" class="w-20 px-2 py-1 border border-slate-200 rounded text-sm" :class="node.humidity < threshold.minHumidity || node.humidity > threshold.maxHumidity ? 'text-rose-600 font-semibold' : 'text-slate-700'" />
                </td>
                <td class="px-4 py-3">
                  <select v-model="node.type" class="px-2 py-1 border border-slate-200 rounded text-sm bg-white">
                    <option value="出发">出发</option>
                    <option value="途中">途中</option>
                    <option value="到达">到达</option>
                  </select>
                </td>
                <td class="px-4 py-3">
                  <button class="text-xs text-rose-600 font-semibold" @click="removeNode(idx)">删除</button>
                </td>
              </tr>
              <tr v-if="!nodes.length">
                <td colspan="6" class="px-4 py-8 text-center text-slate-400">暂无节点记录，请添加</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 状态卡 -->
      <aside class="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
        <h3 class="text-base font-semibold text-slate-800 mb-4">链上状态</h3>
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500">节点数</dt><dd class="text-slate-800">{{ nodes.length }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">异常节点</dt><dd :class="abnormalCount > 0 ? 'text-rose-600' : 'text-slate-800'">{{ abnormalCount }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">上链状态</dt><dd class="text-amber-600">未上链</dd></div>
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
import { onMounted, computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLogisticsStore } from '../../stores'
import { batchApi } from '../../services/api'

const route = useRoute()
const router = useRouter()
const store = useLogisticsStore()

const batchId = computed(() => route.params.batchId || '')
const submitting = ref(false)
const txHash = ref('')

const threshold = reactive({ minTemp: 2, maxTemp: 8, minHumidity: 40, maxHumidity: 80 })
const currentTemp = ref(0)
const currentHumidity = ref(0)

const nodes = ref([])

const tempAlert = computed(() => currentTemp.value < threshold.minTemp || currentTemp.value > threshold.maxTemp)
const humidityAlert = computed(() => currentHumidity.value < threshold.minHumidity || currentHumidity.value > threshold.maxHumidity)
const abnormalCount = computed(() => nodes.value.filter(n =>
  n.temp < threshold.minTemp || n.temp > threshold.maxTemp || n.humidity < threshold.minHumidity || n.humidity > threshold.maxHumidity
).length)

onMounted(async () => {
  if (!batchId.value) return
  try {
    const res = await batchApi.getBatchDetail(batchId.value)
    const d = res?.data || res
    if (!d || !d.productName) return

    // 回显温湿度节点数据
    if (d.tempHumidity) {
      try {
        const parsed = JSON.parse(d.tempHumidity)
        if (parsed.threshold) {
          if (parsed.threshold.minTemp !== undefined) threshold.minTemp = parsed.threshold.minTemp
          if (parsed.threshold.maxTemp !== undefined) threshold.maxTemp = parsed.threshold.maxTemp
          if (parsed.threshold.minHumidity !== undefined) threshold.minHumidity = parsed.threshold.minHumidity
          if (parsed.threshold.maxHumidity !== undefined) threshold.maxHumidity = parsed.threshold.maxHumidity
        }
        if (Array.isArray(parsed.nodes)) {
          nodes.value = parsed.nodes
          // 更新当前温湿度为最新节点值
          if (parsed.nodes.length) {
            const last = parsed.nodes[parsed.nodes.length - 1]
            currentTemp.value = last.temp
            currentHumidity.value = last.humidity
          }
        }
      } catch { /* JSON 解析失败忽略 */ }
    }
    if (d.logisticsTxHash) txHash.value = d.logisticsTxHash
  } catch { /* ignore */ }
})

function nodeTypeClass(type) {
  if (type === '出发') return 'bg-blue-100 text-blue-700'
  if (type === '途中') return 'bg-amber-100 text-amber-700'
  if (type === '到达') return 'bg-emerald-100 text-emerald-700'
  return 'bg-slate-100 text-slate-700'
}

function addNode() {
  nodes.value.push({ time: new Date().toISOString().slice(0, 16), location: '', temp: currentTemp.value, humidity: currentHumidity.value, type: '途中' })
}

function removeNode(idx) {
  nodes.value.splice(idx, 1)
}

async function submitRecord() {
  if (!nodes.value.length) {
    window.alert('请至少添加一个节点记录。')
    return
  }
  submitting.value = true
  try {
    const tempData = JSON.stringify({ threshold, nodes: nodes.value })
    const vehicleInfo = `节点数:${nodes.value.length} | 异常:${abnormalCount.value}`
    const result = await store.submitTempRecord(batchId.value, { vehicleInfo, tempHumidity: tempData })
    txHash.value = result?.txHash || ''
    window.alert('温湿度记录已提交上链')
    router.push(`/logistics/batch-detail/${batchId.value}`)
  } catch (e) {
    window.alert('提交失败: ' + (e?.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}
</script>
