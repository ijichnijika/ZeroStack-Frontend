<script setup lang="ts">
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
</script>

<template>
  <main class="lost">
    <p class="lost-code" aria-hidden="true">
      <span class="code-plate cp-pink">404</span>
      <span class="code-plate cp-blue">404</span>
      <span class="code-plate cp-ink">404</span>
    </p>
    <h1 class="lost-title">这一页没有印出来</h1>
    <p class="lost-desc">地址可能写错了，或者这个页面已经被删除。</p>
    <router-link to="/" class="btn btn--ink btn--lg">
      <ArrowLeftOutlined />
      回到首页
    </router-link>
  </main>
</template>

<style scoped>
.lost {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 40px 24px;
  text-align: center;
  background: var(--paper);
}

.lost-code {
  position: relative;
  isolation: isolate;
  display: grid;
  margin-bottom: 12px;
  font-family: var(--font-wide);
  font-stretch: 125%;
  font-weight: 900;
  font-size: clamp(120px, 26vw, 320px);
  line-height: 0.9;
  letter-spacing: -0.04em;
}

.code-plate {
  grid-area: 1 / 1;
  mix-blend-mode: multiply;
}

.cp-pink {
  color: var(--pink);
  animation: lost-drift-a 3.2s var(--ease-in-out) infinite;
}

.cp-blue {
  color: var(--blue);
  animation: lost-drift-b 3.2s var(--ease-in-out) infinite;
}

.cp-ink {
  color: var(--yellow);
}

@keyframes lost-drift-a {
  0%,
  100% {
    transform: translate(-0.04em, 0.02em);
  }
  50% {
    transform: translate(-0.07em, -0.01em);
  }
}

@keyframes lost-drift-b {
  0%,
  100% {
    transform: translate(0.035em, -0.025em);
  }
  50% {
    transform: translate(0.06em, 0.01em);
  }
}

.lost-title {
  font-size: clamp(32px, 4vw, 48px);
}

.lost-desc {
  margin-bottom: 18px;
  color: var(--ink-2);
}
</style>
