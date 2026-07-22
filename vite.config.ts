import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // 将 /api 代理到后端，保持与已有配置一致
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 将 /preview-static 代理到后端静态资源，解决跨域问题
      // 使得 iframe 与主页同源，可以直接访问 contentDocument
      '/preview-static': {
        target: 'http://localhost:8080/api/static',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/preview-static/, ''),
      },
    },
  },
})

