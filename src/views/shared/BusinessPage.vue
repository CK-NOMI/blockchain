<template>
  <div class="space-y-6 font-['Manrope',sans-serif]">
    <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">{{ title }}</h1>
        <p class="text-sm text-slate-500 mt-1">{{ description }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="action in actions"
          :key="action.label"
          type="button"
          class="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
          :class="action.primary ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
          @click="onAction(action)"
        >
          {{ action.label }}
        </button>
      </div>
    </header>

    <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <article
        v-for="card in statCards"
        :key="card.label"
        class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
      >
        <p class="text-xs uppercase tracking-wide text-slate-500">{{ card.label }}</p>
        <p class="text-2xl font-black text-slate-900 mt-2">{{ card.value }}</p>
        <p class="text-xs mt-2" :class="card.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'">
          {{ card.trend >= 0 ? '+' : '' }}{{ card.trend }}% 较上周期
        </p>
      </article>
    </section>

    <section class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div class="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
        <h2 class="text-lg font-bold text-slate-900">{{ tableTitle }}</h2>
        <div class="flex gap-2">
          <input
            v-model="query"
            type="text"
            placeholder="按关键词搜索"
            class="w-64 max-w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="button"
            class="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg border border-blue-100"
            @click="query = ''"
          >
            重置
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[720px]">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th v-for="col in columns" :key="col.key" class="text-left px-4 py-3 font-semibold">{{ col.label }}</th>
              <th class="text-left px-4 py-3 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.id" class="border-t border-slate-100">
              <td v-for="col in columns" :key="`${row.id}-${col.key}`" class="px-4 py-3">
                <span
                  v-if="col.key === 'status'"
                  class="px-2 py-1 rounded-full text-xs font-semibold"
                  :class="row.statusClass || 'bg-slate-100 text-slate-700'"
                >
                  {{ row.status }}
                </span>
                <span v-else class="text-slate-700">{{ row[col.key] }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="item in rowActions"
                    :key="item.label"
                    type="button"
                    class="px-3 py-1.5 text-xs font-semibold rounded-md border"
                    :class="item.primary ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700'"
                    @click="onRowAction(item, row)"
                  >
                    {{ item.label }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { filterRows } from '../../config/mock'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  statCards: { type: Array, default: () => [] },
  tableTitle: { type: String, default: '数据列表' },
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  searchableKeys: { type: Array, default: () => [] },
  actions: { type: Array, default: () => [] },
  rowActions: { type: Array, default: () => [{ label: '查看', action: 'view', primary: true }] },
})

const emit = defineEmits(['action', 'row-action'])
const query = ref('')

const filteredRows = computed(() => filterRows(props.rows, query.value, props.searchableKeys))

const onAction = (action) => emit('action', action)

const onRowAction = (action, row) => {
  if (action.confirm && !window.confirm(action.confirmText || `确认执行${action.label}？`)) {
    return
  }
  emit('row-action', { action, row })
}
</script>
