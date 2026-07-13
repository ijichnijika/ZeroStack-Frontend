<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ArrowRightOutlined, SafetyCertificateOutlined, CodeOutlined, RocketOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const userStore = useUserStore()
</script>

<template>
  <div class="home-container">
    <div class="hero-section">
      <h1 class="hero-title">
        <span class="gradient-text">ZeroStack</span> 快捷开发平台
      </h1>
      <p class="hero-desc">
        一站式企业级快速开发脚手架，集成 Spring Boot 与 Vue 3 的完美全栈落地方案。
      </p>

      <div class="cta-group">
        <template v-if="userStore.loginUser?.id">
          <a-space size="middle">
            <a-button type="primary" size="large" class="gradient-btn" @click="router.push('/admin/user-manage')">
              进入管理看板
              <template #icon><ArrowRightOutlined /></template>
            </a-button>
            <span class="welcome-text">欢迎回来，<strong>{{ userStore.loginUser.userName || userStore.loginUser.userAccount }}</strong></span>
          </a-space>
        </template>
        <template v-else>
          <a-space size="middle">
            <a-button type="primary" size="large" class="gradient-btn" @click="router.push('/user/login')">
              快速开始
              <template #icon><ArrowRightOutlined /></template>
            </a-button>
            <a-button size="large" @click="router.push('/user/register')">
              注册账号
            </a-button>
          </a-space>
        </template>
      </div>
    </div>

    <div class="features-grid">
      <div class="feature-card">
        <div class="icon-wrapper primary">
          <RocketOutlined />
        </div>
        <h3>极速启动</h3>
        <p>前后端统一代码生成器，零基础开箱即用，支持一键对接 API。</p>
      </div>

      <div class="feature-card">
        <div class="icon-wrapper success">
          <SafetyCertificateOutlined />
        </div>
        <h3>安全鉴权</h3>
        <p>集成多角色权限过滤，基于角色与注解的细粒度安全访问控制。</p>
      </div>

      <div class="feature-card">
        <div class="icon-wrapper warning">
          <CodeOutlined />
        </div>
        <h3>卓越体验</h3>
        <p>运用 Ant Design Vue 4 + 玻璃拟态设计，保障系统界面操作极致流畅。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 60px;
}

.hero-section {
  text-align: center;
  max-width: 800px;
  margin-top: 40px;
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  line-height: 1.2;
  color: #1a1a1a;
  margin-bottom: 24px;
}

.gradient-text {
  background: linear-gradient(135deg, #1890ff 0%, #0050b3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-desc {
  font-size: 20px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 40px;
}

.cta-group {
  display: flex;
  justify-content: center;
  align-items: center;
}

.welcome-text {
  font-size: 16px;
  color: #555;
}

.gradient-btn {
  background: linear-gradient(135deg, #1890ff 0%, #0050b3 100%);
  border: none;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(24, 144, 255, 0.4);
}

.gradient-btn:hover {
  background: linear-gradient(135deg, #40a9ff 0%, #096dd9 100%);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.5);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  width: 100%;
  max-width: 1000px;
}

.feature-card {
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  border-color: #e0e0e0;
}

.icon-wrapper {
  font-size: 32px;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.icon-wrapper.primary {
  background: rgba(24, 144, 255, 0.08);
  color: #1890ff;
}

.icon-wrapper.success {
  background: rgba(82, 196, 26, 0.08);
  color: #52c41a;
}

.icon-wrapper.warning {
  background: rgba(250, 173, 20, 0.08);
  color: #faad14;
}

.feature-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12px;
}

.feature-card p {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
  }

  .hero-desc {
    font-size: 16px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>

