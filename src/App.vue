<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'

dayjs.locale('zh-cn')

const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#17171a',
    colorInfo: '#0078bf',
    colorLink: '#0078bf',
    colorLinkHover: '#005a8f',
    colorSuccess: '#006d00',
    colorWarning: '#bfae00',
    colorError: '#bf3100',
    colorText: '#17171a',
    colorTextSecondary: '#4a4a50',
    colorTextTertiary: '#6b6b72',
    colorTextPlaceholder: '#6b6b72',
    colorBorder: 'rgba(23, 23, 26, 0.22)',
    colorBorderSecondary: 'rgba(23, 23, 26, 0.12)',
    colorBgLayout: '#fafaf7',
    colorBgContainer: '#ffffff',
    borderRadius: 6,
    borderRadiusLG: 10,
    controlHeight: 38,
    controlOutline: 'rgba(0, 120, 191, 0.18)',
    fontFamily:
      "'Archivo Variable', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif",
    fontSize: 14,
    wireframe: false,
  },
}
</script>

<template>
  <a-config-provider :locale="zhCN" :theme="themeConfig">
    <router-view />
  </a-config-provider>
</template>
