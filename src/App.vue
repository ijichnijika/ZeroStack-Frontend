<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const themeConfig = {
  token: {
    colorPrimary: '#4f46e5',
    colorLink: '#4f46e5',
    colorLinkHover: '#6366f1',
    borderRadius: 12,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
}
</script>

<template>
  <a-config-provider :locale="zhCN" :theme="themeConfig">
    <div class="aurora-glow-container" aria-hidden="true">
      <div class="aurora-orb orb-1"></div>
      <div class="aurora-orb orb-2"></div>
      <div class="aurora-orb orb-3"></div>
      <div class="aurora-orb orb-4"></div>
      <div class="aurora-grid-overlay"></div>
    </div>
    <router-view />
  </a-config-provider>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
