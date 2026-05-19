<template>
  <div class="space-y-6 font-['Manrope',sans-serif]">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">新建批次</h1>
        <p class="text-sm text-slate-500 mt-1">在源头侧初始化溯源批次信息。</p>
      </div>
      <div class="flex gap-2">
        <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm">保存草稿</button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold" @click="submitAndNext">
          提交
        </button>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-5">
      <section class="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800 mb-5">基础信息</h2>
        <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">产品名称</label>
            <input
              v-model="form.productName"
              type="text"
              placeholder="例如：有机苹果"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">品种</label>
            <input
              v-model="form.variety"
              type="text"
              placeholder="请输入品种"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">分类</label>
            <select
              v-model="form.category"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">请选择分类</option>
              <option value="fruit">水果</option>
              <option value="vegetable">蔬菜</option>
              <option value="grain">粮食</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">产地编码</label>
            <input
              type="text"
              readonly
              value="ORG-CN-SD-0042"
              class="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-2">产地地址</label>
            <input
              v-model="form.address"
              type="text"
              placeholder="省/市/农场"
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
        </form>
      </section>

      <aside class="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
        <h3 class="text-base font-semibold text-slate-800 mb-4">批次状态</h3>
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between">
            <dt class="text-slate-500">当前状态</dt>
            <dd class="text-blue-700 font-semibold">草稿</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">当前环节</dt>
            <dd class="text-slate-800">农户录入</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">上链状态</dt>
            <dd class="text-amber-600">未提交</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">下一步</dt>
            <dd class="text-slate-800">农事记录</dd>
          </div>
        </dl>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = reactive({
  productName: '',
  variety: '',
  category: '',
  address: '',
  plantDate: '',
})

const submitAndNext = () => {
  window.alert('批次已创建，进入农事记录。')
  router.push('/farmer/records/SC20240521001')
}
</script>
