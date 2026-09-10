<script setup lang="ts">
/**
 * AdminPagination — Admin 管理页分页组件
 *
 * 封装三个管理页完全一致的分页展示逻辑（glassmorphism 卡片 + 固定配置）。
 * 通过 v-model 双向绑定当前页和每页大小，@change 事件向上传递。
 */
defineProps<{
  /** 数据总条数 */
  total: number
  /** 当前页码（支持 v-model） */
  current: number
  /** 每页条数（支持 v-model） */
  pageSize: number
}>()

defineEmits<{
  /** 页码或每页条数变化时触发，参数与 a-pagination 的 @change 一致 */
  (e: 'change', page: number, pageSize: number): void
  (e: 'update:current', val: number): void
  (e: 'update:pageSize', val: number): void
}>()
</script>

<template>
  <div class="pagination-wrapper">
    <a-pagination
      :current="current"
      :page-size="pageSize"
      :total="total"
      :show-total="(totalNum: number) => `共 ${totalNum} 条记录`"
      show-size-changer
      show-quick-jumper
      @change="(page: number, size: number) => $emit('change', page, size)"
      @update:current="(val: number) => $emit('update:current', val)"
      @update:page-size="(val: number) => $emit('update:pageSize', val)"
    />
  </div>
</template>

<style scoped>
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding: 10px 16px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
  position: relative;
  z-index: 10;
}
</style>
