<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'

const route = useRoute()
const compactFooter = computed(() => route.path !== '/')
</script>

<template>
  <div class="basic-layout">
    <a href="#main-content" class="sr-only skip-link">跳至主要内容</a>
    <GlobalHeader />
    <main id="main-content" class="layout-main">
      <router-view />
    </main>
    <GlobalFooter :compact="compactFooter" />
  </div>
</template>

<style scoped>
.basic-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: clip;
}

.layout-main {
  flex: 1;
  scroll-margin-top: var(--header-h);
}
</style>
