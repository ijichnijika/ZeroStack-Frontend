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
  background: #ffffff !important;
  border: 1px solid rgba(15, 23, 42, 0.08) !important;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

/* 让插槽内的 a-form 表单项间距统一 */
:deep(.ant-form-item) {
  margin-bottom: 12px;
  margin-right: 24px;
}

:deep(.ant-input),
:deep(.ant-select-selector) {
  background: #ffffff !important;
  border-color: #cbd5e1 !important;
  border-radius: 6px !important;
}

:deep(.ant-input:hover),
:deep(.ant-select-selector:hover) {
  border-color: #94a3b8 !important;
}

:deep(.ant-input:focus),
:deep(.ant-input-focused),
:deep(.ant-select-focused .ant-select-selector) {
  border-color: #4f46e5 !important;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15) !important;
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
