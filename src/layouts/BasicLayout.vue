<script setup lang="ts">
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
</script>

<template>
  <div id="basic-layout">
    <a-layout class="layout-container">
      <a-layout-header
        class="layout-header"
        style="height: 72px; line-height: 72px; background: #fff; padding: 0"
      >
        <GlobalHeader />
      </a-layout-header>
      <a-layout-content class="layout-content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </a-layout-content>
      <a-layout-footer class="layout-footer">
        <GlobalFooter />
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<style scoped>
#basic-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.layout-header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  padding: 0;
  height: 72px;
  line-height: 72px;
  background: #fff;
}

.layout-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.content-wrapper {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  min-height: 360px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.layout-footer {
  padding: 0;
  background: #f0f2f5;
}

/* 响应式设计适配手机等小屏设备 */
@media (max-width: 768px) {
  .layout-content {
    padding: 12px;
  }

  .content-wrapper {
    padding: 16px;
    border-radius: 4px;
  }
}
</style>
