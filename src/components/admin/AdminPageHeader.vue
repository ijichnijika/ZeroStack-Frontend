<script setup lang="ts">
/**
 * AdminPageHeader — Admin 管理页顶部标题区
 *
 * 三个管理页（AppManagePage / ChatManagePage / UserManagePage）的页头结构完全一致：
 * 左侧标题 + 副标题，右侧可选操作按钮区。提取为组件后各页面无需重复编写样式。
 */
defineProps<{
  /** 页面主标题，如"用户管理看板" */
  title: string
  /** 副标题说明文字 */
  subtitle: string
}>()
</script>

<template>
  <div class="admin-page-header">
    <div class="header-left">
      <h2>{{ title }}</h2>
      <p class="subtitle">{{ subtitle }}</p>
    </div>
    <!-- 操作区，通过默认插槽传入（如「新建用户」按钮） -->
    <slot />
  </div>
</template>

<style scoped>
.admin-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
  padding-bottom: 16px;
}

.header-left h2 {
  font-size: 22px;
  font-weight: 700;
  color: #1f1f1f;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 0;
}
</style>
