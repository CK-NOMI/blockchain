<template>
  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-2">{{ provinceLabel || '省/直辖市' }}</label>
      <select
        :value="province"
        @change="onProvinceChange($event.target.value)"
        class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
      >
        <option value="">请选择</option>
        <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>
    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-2">{{ cityLabel || '市/区' }}</label>
      <select
        :value="city"
        @change="$emit('update:city', $event.target.value)"
        :disabled="!province"
        class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <option value="">请选择</option>
        <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getProvinceList, getCitiesByProvince } from '../data/chinaCities.js'

const props = defineProps({
  province: { type: String, default: '' },
  city: { type: String, default: '' },
  provinceLabel: { type: String, default: '' },
  cityLabel: { type: String, default: '' },
})

const emit = defineEmits(['update:province', 'update:city'])

const provinces = getProvinceList()

const cities = computed(() => {
  if (!props.province) return []
  return getCitiesByProvince(props.province)
})

function onProvinceChange(val) {
  emit('update:province', val)
  if (val !== props.province) {
    emit('update:city', '')  // 切换省份时清空城市
  }
}
</script>
