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
    <div class="glass-card animate-fade-in">
      <div class="mascot-wrapper">
        <svg class="mascot-robot" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- 天线 -->
          <rect x="47" y="10" width="6" height="15" fill="#3b82f6" rx="2" />
          <circle cx="50" cy="10" r="6" fill="#f59e0b" />
          <!-- 头部 -->
          <rect x="20" y="25" width="60" height="50" fill="#e0f2fe" rx="18" stroke="#bae6fd" stroke-width="2" />
          <!-- 脸部屏幕 -->
          <rect x="28" y="33" width="44" height="34" fill="#1e293b" rx="10" />
          <!-- 眼睛 (迷茫状) -->
          <path d="M 37 47 Q 41 45 45 47" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
          <path d="M 55 47 Q 59 45 63 47" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
          <!-- 腮红 -->
          <circle cx="34" cy="56" r="3" fill="#fda4af" />
          <circle cx="66" cy="56" r="3" fill="#fda4af" />
          <!-- 嘴巴 (波浪形，表示疑惑) -->
          <path d="M46,57 Q48,55 50,57 T54,57" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>

      <div class="content-wrapper">
        <h1 class="error-code">404</h1>
        <h2 class="error-title">抱歉，页面走丢了</h2>
        <p class="error-desc">您访问的页面不存在或已被移除</p>
        
        <a-button type="primary" size="large" class="primary-animated-btn back-btn" @click="goHome">
          <template #icon><ArrowLeftOutlined /></template>
          带我回主页
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
  background: linear-gradient(135deg, #f6f8fb 0%, #e5e9f0 100%);
  padding: 40px 24px;
}

.glass-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 500px;
  min-height: 400px;
  background: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(20px) saturate(120%);
  -webkit-backdrop-filter: blur(20px) saturate(120%);
  border-radius: 28px;
  box-shadow: 0 15px 35px rgba(31, 38, 135, 0.08), 0 5px 15px rgba(0, 0, 0, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.35) !important;
  position: relative;
  padding: 40px;
  text-align: center;
}

.mascot-wrapper {
  position: absolute;
  top: -60px;
  width: 120px;
  height: 120px;
}

.mascot-robot {
  width: 100%;
  height: 100%;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-8px) rotate(3deg);
  }
}

.content-wrapper {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.error-code {
  font-size: 84px;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
  line-height: 1;
}

.error-title {
  font-size: 24px;
  color: #111827;
  font-weight: 700;
  margin-bottom: 12px;
}

.error-desc {
  font-size: 15px;
  color: #6b7280;
  margin-bottom: 32px;
}

.back-btn {
  height: 48px;
  border-radius: 99px;
  padding: 0 32px;
  font-size: 16px;
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(59, 130, 246, 0.3);
}

.animate-fade-in {
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
