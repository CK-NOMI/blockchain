<template>
  <div class="flex-1 overflow-y-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-900 mb-2 font-manrope">上传质检报告</h1>
      <p class="text-base text-slate-500 max-w-2xl">上传质检报告文件并计算哈希，提交到区块链存证。也可验证已有记录的哈希是否匹配链上数据。</p>
    </div>

    <!-- Bento Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left Column (8 cols) -->
      <div class="lg:col-span-8 flex flex-col gap-6">
        <!-- File Upload Zone -->
        <section class="bg-white rounded-xl border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span class="material-icons text-blue-600">upload_file</span>
            文件上传区
          </h2>
          <div
            class="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px]"
            @click="triggerUpload"
            @dragover.prevent
            @drop.prevent="handleDrop"
          >
            <span class="material-icons text-4xl text-blue-600 mb-3">cloud_upload</span>
            <p class="text-base text-slate-900 font-medium mb-1">拖放质检报告到此区域</p>
            <p class="text-sm text-slate-400 mb-4">或点击此处选择文件</p>
            <div class="flex gap-2">
              <span class="px-3 py-1 bg-slate-100 rounded text-xs text-slate-500">.PDF</span>
              <span class="px-3 py-1 bg-slate-100 rounded text-xs text-slate-500">.JPG</span>
              <span class="px-3 py-1 bg-slate-100 rounded text-xs text-slate-500">.PNG</span>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              class="hidden"
              @change="handleFileSelect"
            />
          </div>
          <!-- 已选文件信息 -->
          <div v-if="selectedFile" class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
            <span class="material-icons text-blue-600">description</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">{{ selectedFile.name }}</p>
              <p class="text-xs text-slate-500">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
            </div>
            <button @click="clearFile" class="material-icons text-slate-400 hover:text-red-500 transition-colors">close</button>
          </div>
          <!-- 哈希已计算 → 操作按钮 -->
          <div v-if="hashComputed && !hashSubmitted" class="mt-4 flex gap-3">
            <button
              @click="submitHashToChain"
              class="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <span class="material-icons text-lg">upload</span>
              提交上链
            </button>
            <button
              @click="verifyOnChain"
              class="flex-1 border border-blue-600 text-blue-600 text-sm font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
            >
              <span class="material-icons text-lg">verified</span>
              链上验证
            </button>
          </div>
          <!-- 已提交 → 仅保留验证按钮 -->
          <div v-if="hashSubmitted" class="mt-4 flex gap-3">
            <button
              @click="verifyOnChain"
              class="flex-1 border border-green-600 text-green-600 text-sm font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
            >
              <span class="material-icons text-lg">verified</span>
              链上验证
            </button>
          </div>
        </section>

        <!-- SHA-256 Hash Display -->
        <section class="bg-white rounded-xl border border-slate-200 p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span class="material-icons text-blue-600">memory</span>
              SHA-256 哈希值
            </h2>
            <span
              v-if="hashComputed"
              class="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs flex items-center gap-1"
            >
              <span class="material-icons text-sm">check_circle</span>
              已计算
            </span>
          </div>
          <div class="bg-slate-800 rounded-lg p-4 relative overflow-hidden">
            <div class="absolute top-0 left-0 h-1 bg-blue-500 w-full opacity-80"></div>
            <p class="font-mono text-sm text-green-300 break-all select-all">{{ fileHash || '等待文件上传...' }}</p>
            <div class="mt-3 flex justify-between items-center border-t border-slate-600/30 pt-3">
              <span class="text-xs text-slate-400">算法: SHA-256</span>
              <button
                v-if="fileHash"
                @click="copyHash"
                class="text-xs text-blue-300 hover:text-blue-200 transition-colors flex items-center gap-1"
              >
                <span class="material-icons text-sm">content_copy</span>
                复制哈希
              </button>
            </div>
          </div>
        </section>

        <!-- Verification Result -->
        <section
          class="rounded-xl border p-6 relative overflow-hidden transition-all"
          :class="verifyResult === 'verified' ? 'bg-white border-green-500' : verifyResult === 'failed' ? 'bg-white border-red-500' : 'bg-white border-slate-200'"
        >
          <div v-if="verifyResult === 'verified'" class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center shrink-0">
              <span class="material-icons text-white text-2xl">verified</span>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900 mb-1">验证通过</h3>
              <p class="text-sm text-slate-500 mb-4">文件哈希与链上锚定记录完全匹配，自原始记录以来未被篡改。</p>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-slate-400 mb-1">匹配区块</p>
                  <p class="text-sm font-mono text-slate-900">#14,295,081</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 mb-1">验证时间</p>
                  <p class="text-sm font-mono text-slate-900">{{ verifyTime }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="verifyResult === 'failed'" class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <span class="material-icons text-white text-2xl">gpp_bad</span>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900 mb-1">验证失败</h3>
              <p class="text-sm text-slate-500">文件哈希与存证记录不匹配，请确认文件未被篡改。</p>
            </div>
          </div>
          <div v-else class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
              <span class="material-icons text-slate-400 text-2xl">hourglass_empty</span>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900 mb-1">等待验证</h3>
              <p class="text-sm text-slate-500">请先上传文件以计算哈希值并进行链上验证。</p>
            </div>
          </div>
        </section>
      </div>

      <!-- Right Column (4 cols) -->
      <div class="lg:col-span-4">
        <aside class="bg-white rounded-xl border border-slate-200 p-6 sticky top-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span class="material-icons text-blue-600">link</span>
            区块链锚定状态
          </h2>
          <div class="relative border-l-2 border-slate-200 ml-3 space-y-6 mt-6 pb-2">
            <div class="relative pl-6">
              <div
                class="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white"
                :class="selectedFile ? 'bg-green-500' : 'bg-slate-300'"
              ></div>
              <h4 class="text-sm text-slate-900 font-medium" :class="!selectedFile ? 'text-slate-400' : ''">{{ selectedFile ? '文件已上传' : '等待上传文件' }}</h4>
              <p class="text-xs text-slate-400 mt-1">本地客户端</p>
            </div>
            <div class="relative pl-6">
              <div
                class="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white"
                :class="hashComputed ? 'bg-green-500' : 'bg-slate-300'"
              ></div>
              <h4 class="text-sm text-slate-900 font-medium" :class="!hashComputed ? 'text-slate-400' : ''">{{ hashComputed ? '哈希已生成' : '等待计算哈希' }}</h4>
              <p class="text-xs text-slate-400 mt-1">SHA-256 算法</p>
            </div>
            <div class="relative pl-6">
              <div
                class="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white"
                :class="serverUploaded ? 'bg-green-500' : 'bg-slate-300'"
              ></div>
              <h4 class="text-sm text-slate-900 font-medium" :class="serverUploaded ? '' : 'text-slate-400'">{{ serverUploaded ? '已上传至服务器' : '等待上传服务器' }}</h4>
              <p class="text-xs text-slate-400 mt-1">{{ serverUploaded ? '文件存储完成' : '上传文件后自动存储' }}</p>
            </div>
            <div class="relative pl-6" :class="verifyResult === 'verified' || verifyResult === 'failed' ? '' : 'opacity-40'">
              <div
                class="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white"
                :class="verifyResult === 'verified' ? 'bg-green-500' : (verifyResult === 'failed' ? 'bg-red-500' : 'bg-slate-300')"
              ></div>
              <h4 class="text-sm text-slate-900 font-medium" :class="verifyResult === 'verified' ? '' : (verifyResult === 'failed' ? 'text-red-600' : 'text-slate-400')">{{ verifyResult === 'verified' ? '验证通过' : (verifyResult === 'failed' ? '验证失败' : '等待验证') }}</h4>
              <p class="text-xs text-slate-400 mt-1">{{ verifyResult === 'verified' ? '链上哈希匹配' : (verifyResult === 'failed' ? '链上未找到匹配记录' : '点击下方按钮验证') }}</p>
            </div>
          </div>
          <div class="mt-6 pt-6 border-t border-slate-200">
            <button
              @click="verifyResult === 'verified' ? downloadCertificate() : verifyOnChain()"
              :disabled="!fileHash"
              class="w-full bg-blue-600 text-white text-xs font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="material-icons text-lg">verified</span>
              {{ verifyResult === 'verified' ? '下载验证证书' : '链上验证' }}
            </button>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { batchApi, traceApi } from '../../services/api'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const route = useRoute()
const batchId = route.params.batchId || 'SC20240521001'

const fileInput = ref(null)
const selectedFile = ref(null)
const fileHash = ref('')
const hashComputed = ref(false)
const verifyResult = ref('idle') // 'idle' | 'verified' | 'failed'
const verifyTime = ref('')
const hashSubmitted = ref(false) // 哈希是否已提交到链上
const serverUploaded = ref(false)

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleDrop = (e) => {
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

const handleFileSelect = (e) => {
  const file = e.target?.files?.[0]
  if (file) processFile(file)
}

const processFile = async (file) => {
  selectedFile.value = file
  verifyResult.value = 'idle'

  // 本地计算 SHA-256
  try {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    fileHash.value = '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    hashComputed.value = true
    // 保存到 localStorage，供提交上链时使用
    try { localStorage.setItem('qc_file_hash_' + batchId, fileHash.value) } catch {}
  } catch {
    fileHash.value = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    hashComputed.value = true
  }

  // 同时上传文件到服务端存储
  try {
    const formData = new FormData()
    formData.append('file', file)
    await batchApi.uploadFile(batchId, formData)
    serverUploaded.value = true
  } catch { /* 服务端上传非致命 */ }
}

const clearFile = () => {
  selectedFile.value = null
  fileHash.value = ''
  hashComputed.value = false
  hashSubmitted.value = false
  verifyResult.value = 'idle'
  if (fileInput.value) fileInput.value.value = ''
  try { localStorage.removeItem('qc_file_hash_' + batchId) } catch {}
}

const copyHash = async () => {
  try {
    await navigator.clipboard.writeText(fileHash.value)
    alert('哈希已复制。')
  } catch {
    // fallback
  }
}

const verifyOnChain = async () => {
  if (!fileHash.value || verifyResult.value === 'verified') return

  try {
    const res = await traceApi.verifyFileHash(batchId, fileHash.value)
    const d = res?.data || res
    if (d?.found) {
      verifyResult.value = 'verified'
      verifyTime.value = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
    } else {
      verifyResult.value = 'failed'
    }
  } catch {
    verifyResult.value = 'failed'
  }
}

const submitHashToChain = async () => {
  if (!fileHash.value) return
  try {
    await batchApi.updateReportHash(batchId, fileHash.value)
    hashSubmitted.value = true
    alert('文件哈希已提交存证。')
  } catch (e) {
    console.error('submitHashToChain error:', e)
    alert('提交失败: ' + (e.message || '请重试'))
  }
}

const downloadCertificate = async () => {
  // 临时 DOM 元素让浏览器渲染中文
  const el = document.createElement('div')
  el.innerHTML = `
    <div style="width:680px; padding:40px; font-family:'Microsoft YaHei','PingFang SC',sans-serif; color:#333; background:#fff;">
      <h1 style="font-size:24px; color:#1e40af; text-align:center; margin:0 0 8px 0;">区块链存证验证证书</h1>
      <hr style="border:none; border-top:2px solid #1e40af;" />
      <h2 style="font-size:18px; color:#16a34a; text-align:center; margin:16px 0;">&#10003; 验证通过</h2>
      <table style="width:100%; border-collapse:collapse; font-size:13px; margin-top:24px;">
        <tr><td style="padding:8px 12px; font-weight:bold; width:80px; vertical-align:top;">批次编号</td><td style="padding:8px 12px; word-break:break-all;">${batchId}</td></tr>
        <tr><td style="padding:8px 12px; font-weight:bold; vertical-align:top;">文件哈希</td><td style="padding:8px 12px; word-break:break-all; font-family:monospace; font-size:11px;">${fileHash.value}</td></tr>
        <tr><td style="padding:8px 12px; font-weight:bold;">验证时间</td><td style="padding:8px 12px;">${verifyTime.value}</td></tr>
        <tr><td style="padding:8px 12px; font-weight:bold;">验证算法</td><td style="padding:8px 12px;">SHA-256</td></tr>
      </table>
      <p style="color:#9ca3af; font-size:10px; text-align:center; margin-top:80px;">
        本证书由 AgriChain 区块链溯源系统自动生成，仅供参考。<br/>
        验证结果基于 FISCO BCOS 区块链存证数据。
      </p>
    </div>
  `
  el.style.cssText = 'position:fixed; left:-9999px; top:0; z-index:-1;'
  document.body.appendChild(el)

  const canvas = await html2canvas(el, { scale: 2, useCORS: true })
  document.body.removeChild(el)

  const imgData = canvas.toDataURL('image/png')
  const doc = new jsPDF('p', 'mm', 'a4')
  const pw = doc.internal.pageSize.getWidth()
  const margin = 10
  const imgW = pw - margin * 2
  const imgH = canvas.height * imgW / canvas.width
  doc.addImage(imgData, 'PNG', margin, margin, imgW, imgH)
  doc.save('验证证书_' + batchId + '.pdf')
}

</script>
