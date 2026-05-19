<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">溯源二维码</h1>
        <p class="text-sm text-slate-500 mt-1">生成并管理批次的消费者溯源二维码。</p>
      </div>
      <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="$router.push(`/retail/batch-detail/${batchId}`)">查看详情</button>
    </header>

    <section class="bg-blue-50 rounded-xl p-4 border border-blue-100 flex gap-4 text-sm">
      <div><span class="text-slate-500">批次号：</span><span class="font-mono font-semibold">{{ batchId }}</span></div>
      <div><span class="text-slate-500">产品：</span><span>{{ productName }}</span></div>
      <div><span class="text-slate-500">销售状态：</span><span class="text-emerald-700 font-semibold">在售</span></div>
    </section>

    <div class="grid grid-cols-12 gap-5">
      <section class="col-span-12 lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">消费者溯源码</h2>
        <div class="inline-block bg-white border-4 border-slate-900 rounded-2xl p-4 mb-4">
          <div ref="qrcodeRef" class="w-48 h-48 mx-auto"></div>
        </div>
        <p class="text-xs text-slate-500 mt-2">扫描二维码查看完整溯源信息</p>
        <p class="text-[10px] text-slate-400 font-mono mt-1">{{ traceUrl }}</p>
        <div class="flex justify-center gap-3 mt-4">
          <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold" @click="downloadQrcode">下载二维码</button>
          <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm" @click="copyLink">复制链接</button>
        </div>
      </section>

      <section class="col-span-12 lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">溯源页面预览</h2>
        <div class="bg-slate-50 rounded-lg p-4 text-xs text-slate-600 space-y-2">
          <p><span class="font-semibold">批次号：</span>{{ batchId }}</p>
          <p><span class="font-semibold">产品：</span>{{ productName }}</p>
          <p><span class="font-semibold">产地：</span>{{ origin }}</p>
          <p><span class="font-semibold">生产日期：</span>2026-04-15</p>
          <p><span class="font-semibold">加工方：</span>有机食品加工中心</p>
          <p><span class="font-semibold">物流方：</span>冷链物流A</p>
          <p><span class="font-semibold">超市：</span>有机超市旗舰店</p>
          <p class="text-emerald-600 font-semibold mt-3">链上存证验证: ✅ 通过</p>
        </div>
        <div class="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700">
          此批次的溯源二维码已生成，消费者扫码后可查看全链路溯源信息。
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'

const route = useRoute()
const qrcodeRef = ref(null)

const batchId = computed(() => route.params.batchId || 'SC20240521001')
const productName = ref('有机葡萄')
const origin = ref('新疆吐鲁番')

const traceUrl = computed(() => `${window.location.origin}/trace/${batchId.value}`)

async function renderQrcode() {
  if (!qrcodeRef.value) return
  try {
    QRCode.toCanvas(qrcodeRef.value, traceUrl.value, { width: 192, margin: 0 })
  } catch {
    qrcodeRef.value.innerHTML = '<p class="text-slate-400 text-xs">二维码加载失败</p>'
  }
}

function downloadQrcode() {
  const canvas = qrcodeRef.value?.querySelector?.('canvas') || qrcodeRef.value
  if (canvas) {
    const link = document.createElement('a')
    link.download = `trace-${batchId.value}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
}

function copyLink() {
  navigator.clipboard.writeText(traceUrl.value).then(() => window.alert('链接已复制到剪贴板'))
}

onMounted(() => {
  renderQrcode()
})
</script>
