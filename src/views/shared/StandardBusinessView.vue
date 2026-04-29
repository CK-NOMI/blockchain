<template>
  <BusinessPage
    :title="config.title"
    :description="config.desc"
    :actions="config.actions"
    :stat-cards="statCards"
    :table-title="tableTitle"
    :columns="columns"
    :rows="rows"
    :searchable-keys="searchableKeys"
    :row-actions="rowActions"
    @action="handleAction"
    @row-action="handleRowAction"
  />
</template>

<script setup>
import BusinessPage from './BusinessPage.vue'
import { useBusinessPage } from './useBusinessPage'

const props = defineProps({
  page: {
    type: String,
    required: true,
  },
})

const {
  config,
  columns,
  rows,
  searchableKeys,
  tableTitle,
  statCards,
  rowActions,
  handleAction,
  handleRowAction,
} = useBusinessPage(props.page)
</script>
