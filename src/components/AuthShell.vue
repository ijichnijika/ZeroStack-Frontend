<script setup lang="ts">
/**
 * 身份认证页面通用双栏外壳组件
 * 左侧展示品牌视觉与标语，右侧承载登录/注册表单，并支持展示未登录前暂存的提示词。
 */
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { PENDING_PROMPT_KEY } from '@/components/home/presets'

// 读取首页未登录提交时暂存的提示词，便于在表单顶部回显当前上下文
const pending = sessionStorage.getItem(PENDING_PROMPT_KEY)

defineProps<{
  title: string
  subtitle: string
}>()
</script>

<template>
  <div class="auth">
    <aside class="poster" aria-hidden="true">
      <span class="poster-circle"></span>
      <span class="poster-bar"></span>
      <span class="poster-screen halftone"></span>

      <div class="poster-brand">
        <span class="poster-word">ZeroStack</span>
      </div>
      <p class="poster-line">
        一句话，<br />
        做出能上线的网站。
      </p>
      <p class="poster-foot">HTML 单页 · 多文件站点 · Vue 工程</p>
    </aside>

    <main class="auth-main">
      <router-link to="/" class="back-link">
        <ArrowLeftOutlined />
        返回首页
      </router-link>

      <div class="auth-form">
        <h1 class="auth-title">{{ title }}</h1>
        <p class="auth-sub">{{ subtitle }}</p>
        <p v-if="pending" class="pending-slug">
          <span class="pending-label">登录后开印</span>
          <span class="pending-text">「{{ pending }}」</span>
        </p>
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.auth {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(420px, 1fr);
  min-height: 100vh;
  min-height: 100dvh;
}

.poster {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 40px clamp(32px, 5vw, 64px);
  background: var(--pink);
  color: var(--ink);
}

.poster-circle {
  position: absolute;
  right: -14%;
  top: 8%;
  width: min(66vh, 580px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--yellow);
  mix-blend-mode: multiply;
  z-index: -1;
  animation: poster-in 1100ms var(--ease-out) both;
}

.poster-bar {
  position: absolute;
  left: 0;
  top: 44%;
  width: 46%;
  height: 22px;
  background: var(--ink);
  z-index: -1;
  animation: poster-in 1100ms var(--ease-out) 120ms both;
}

.poster-screen {
  position: absolute;
  left: 30%;
  top: 22%;
  width: 40%;
  height: 34%;
  color: var(--blue);
  mix-blend-mode: multiply;
  z-index: -1;
  animation: poster-in 1100ms var(--ease-out) 60ms both;
}

@keyframes poster-in {
  from {
    transform: translate(28px, -18px);
    opacity: 0;
  }
}

.poster-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.poster-word {
  font-family: var(--font-wide);
  font-stretch: 125%;
  font-weight: 850;
  font-size: 22px;
  letter-spacing: -0.02em;
}

.poster-line {
  margin-top: auto;
  font-family: var(--font-display);
  font-size: clamp(48px, 6vw, 92px);
  line-height: 1.04;
}

.poster-foot {
  margin-top: 28px;
  font-size: 13px;
  font-weight: 600;
}

.auth-main {
  display: flex;
  flex-direction: column;
  padding: 32px clamp(24px, 5vw, 72px);
  background: var(--paper);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-2);
}

.back-link:hover {
  color: var(--ink);
  text-decoration: none;
}

.auth-form {
  width: 100%;
  max-width: 400px;
  margin: auto 0;
  padding-block: 48px;
}

.auth-title {
  font-size: 48px;
}

.auth-sub {
  margin: 10px 0 32px;
  color: var(--ink-2);
}

.pending-slug {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: -12px 0 28px;
  padding: 12px 14px;
  border-left: 1px solid var(--ink);
  background: var(--yellow-tint);
}

.pending-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-2);
}

.pending-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 600;
  color: var(--ink);
}

.auth-form :deep(.ant-input-affix-wrapper) {
  height: 48px;
  border-radius: var(--radius-lg);
  border-width: 1.5px;
}

.auth-form :deep(.ant-input-affix-wrapper-focused) {
  border-color: var(--ink);
  box-shadow: 0 0 0 4px var(--yellow);
}

.auth-form :deep(.ant-input-prefix) {
  margin-right: 10px;
  color: var(--ink-3);
}

.auth-form :deep(.auth-submit) {
  height: 48px;
  margin-top: 8px;
  border-radius: var(--pill);
  font-weight: 700;
  font-size: 15px;
}

.auth-form :deep(.auth-foot) {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  font-size: 14px;
  color: var(--ink-3);
}

@media (max-width: 900px) {
  .auth {
    grid-template-columns: 1fr;
  }

  .poster {
    min-height: 240px;
  }

  .poster-line {
    font-size: 44px;
    margin-top: 48px;
  }

  .poster-foot {
    display: none;
  }

  .auth-form {
    margin: 0;
    padding-block: 32px;
  }
}
</style>
