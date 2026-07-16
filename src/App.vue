<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')
</script>

<template>
  <a-config-provider :locale="zhCN">
    <div class="liquid-bg-container">
      <div class="liquid-ball ball-1"></div>
      <div class="liquid-ball ball-2"></div>
      <div class="liquid-ball ball-3"></div>
    </div>
    <router-view />
  </a-config-provider>
</template>

<style>
@import url('https://fonts.googleapis.com/css?family=Google+Sans:400,500,700&display=swap');

body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #ffffff;
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
}
</style>
