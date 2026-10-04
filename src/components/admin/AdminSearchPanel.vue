<script setup lang="ts">
/**
 * AdminSearchPanel — 管理页筛选区容器，表单字段由各页面通过插槽传入
 */
</script>

<template>
  <div class="search-panel">
    <slot />
  </div>
</template>

<style scoped>
.search-panel {
  margin-bottom: 24px;
  padding: 18px 20px 6px;
  border-radius: var(--radius-lg);
  background: var(--paper-2);
  border: 1px solid var(--rule);
}

:deep(.ant-form-item) {
  margin-bottom: 12px;
  margin-right: 20px;
}

@media (max-width: 768px) {
  :deep(.ant-form-item) {
    width: 100%;
    margin-right: 0;
  }
}
</style>
