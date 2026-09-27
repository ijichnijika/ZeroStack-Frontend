<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer" :class="{ 'is-compact': compact }">
    <div class="footer-band">
      <div class="page band-inner">
        <p class="band-word" aria-hidden="true">ZeroStack</p>
        <span class="band-dot" aria-hidden="true"></span>
      </div>
    </div>
    <div class="page footer-meta">
      <span>© {{ year }} ZeroStack · 由 nijika 制作</span>
      <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 120px;
}

.is-compact {
  margin-top: 72px;
}

.footer-band {
  position: relative;
  overflow: hidden;
  background: var(--yellow);
}

.band-inner {
  position: relative;
  isolation: isolate;
  height: clamp(110px, 13vw, 190px);
}

.is-compact .band-inner {
  height: 80px;
}

.is-compact .band-word {
  font-size: 64px;
}

.is-compact .band-dot {
  width: 100px;
  right: 28px;
}

.band-word {
  position: absolute;
  left: clamp(20px, 4vw, 48px);
  bottom: -0.2em;
  font-family: var(--font-wide);
  font-stretch: 125%;
  font-weight: 900;
  font-size: min(calc((100vw - 2 * clamp(20px, 4vw, 48px)) / 7.6), 162px);
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--ink);
  white-space: nowrap;
  user-select: none;
}

.band-dot {
  position: absolute;
  right: clamp(20px, 8vw, 120px);
  top: 50%;
  width: clamp(120px, 20vw, 280px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--pink);
  mix-blend-mode: multiply;
  transform: translateY(-38%);
  z-index: -1;
}

.footer-meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-block: 18px 28px;
  font-size: 13px;
  color: var(--ink-3);
}

.footer-meta a {
  color: var(--ink-2);
  font-weight: 600;
}
</style>
