<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="not-found-container">
    <div class="error-card animate-fade-in">
      <div class="tech-icon-wrapper">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="disconnect-svg" aria-hidden="true">
          <circle cx="32" cy="32" r="28" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="4 4" />
          <rect x="20" y="20" width="24" height="24" rx="6" fill="#EEF2FF" stroke="#4F46E5" stroke-width="2" />
          <path d="M28 28L36 36M36 28L28 36" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="32" cy="8" r="3" fill="#6366F1" />
          <circle cx="56" cy="32" r="3" fill="#6366F1" />
          <circle cx="32" cy="56" r="3" fill="#6366F1" />
          <circle cx="8" cy="32" r="3" fill="#6366F1" />
        </svg>
      </div>

      <div class="content-wrapper">
        <h1 class="error-code">404</h1>
        <h2 class="error-title">抱歉，页面走丢了</h2>
        <p class="error-desc">您访问的资源不存在或已被重新编译调度</p>

        <a-button type="primary" size="large" class="primary-animated-btn back-btn" @click="goHome">
          <template #icon><ArrowLeftOutlined aria-hidden="true" /></template>
          返回控制台首页
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: transparent;
  padding: 40px 24px;
}

.error-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.78) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(31, 38, 135, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.9) !important;
  padding: 48px 36px;
  text-align: center;
}

.tech-icon-wrapper {
  width: 72px;
  height: 72px;
  margin-bottom: 20px;
}

.disconnect-svg {
  width: 100%;
  height: 100%;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.error-code {
  font-size: 64px;
  font-weight: 800;
  color: #4f46e5;
  letter-spacing: -2px;
  margin-bottom: 8px;
  line-height: 1;
}

.error-title {
  font-size: 20px;
  color: #0f172a;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: -0.3px;
}

.error-desc {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 28px;
}

.back-btn {
  height: 42px;
  border-radius: 9999px !important;
  padding: 0 26px;
  font-size: 14px;
}

.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
