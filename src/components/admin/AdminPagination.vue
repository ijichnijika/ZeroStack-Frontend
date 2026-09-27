<script setup lang="ts">
/**
 * AdminPagination — 管理页分页，与 useAdminTable 的 handlePageChange 配合
 */
defineProps<{
  total: number
  current: number
  pageSize: number
}>()

defineEmits<{
  (e: 'change', page: number, pageSize: number): void
  (e: 'update:current', val: number): void
  (e: 'update:pageSize', val: number): void
}>()
</script>

<template>
  <div class="pagination">
    <a-pagination
      :current="current"
      :page-size="pageSize"
      :total="total"
      :show-total="(n: number) => `共 ${n} 条`"
      show-size-changer
      show-quick-jumper
      @change="(page: number, size: number) => $emit('change', page, size)"
      @update:current="(val: number) => $emit('update:current', val)"
      @update:page-size="(val: number) => $emit('update:pageSize', val)"
    />
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
}
</style>
