<script setup lang="ts">
/**
 * AdminSearchPanel — Admin 管理页搜索面板容器
 *
 * 封装三个管理页共用的 glassmorphism 搜索区域样式，
 * 内容通过默认插槽传入，各页面自行定义具体的表单字段。
 */
</script>

<template>
  <div class="search-panel">
    <slot />
  </div>
</template>

<style scoped>
.search-panel {
  background: rgba(255, 255, 255, 0.3) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
}

/* 让插槽内的 a-form 表单项间距统一 */
:deep(.ant-form-item) {
  margin-bottom: 12px;
  margin-right: 24px;
}

:deep(.ant-input),
:deep(.ant-select-selector) {
  background: rgba(255, 255, 255, 0.45) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

:deep(.ant-input:hover),
:deep(.ant-select-selector:hover) {
  border-color: #1890ff !important;
}

@media (max-width: 768px) {
  :deep(.ant-form-item) {
    margin-right: 0;
    width: 100%;
    margin-bottom: 16px;
  }

  :deep(.ant-form-item-control-input) {
    width: 100%;
  }
}
</style>
