<script setup lang="ts">
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
</script>

<template>
  <div id="basic-layout">
    <a href="#main-content" class="sr-only">跳至主要内容</a>
    <a-layout class="layout-container">
      <a-layout-header
        class="layout-header"
        style="height: 60px; line-height: 60px; background: transparent; padding: 0"
      >
        <GlobalHeader />
      </a-layout-header>
      <a-layout-content class="layout-content">
        <main id="main-content" class="content-wrapper glass-effect">
          <router-view />
        </main>
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
  background: transparent;
}

.layout-header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  padding: 0;
  height: 60px;
  line-height: 60px;
  background: transparent;
}

.layout-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.content-wrapper {
  padding: 32px;
  border-radius: 20px;
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
  scroll-margin-top: 60px;
}

.layout-footer {
  padding: 0;
  background: transparent;
}

/* 响应式设计适配手机等小屏设备 */
@media (max-width: 768px) {
  .layout-content {
    padding: 12px;
  }

  .content-wrapper {
    padding: 18px;
    border-radius: 14px;
  }
}
</style>
