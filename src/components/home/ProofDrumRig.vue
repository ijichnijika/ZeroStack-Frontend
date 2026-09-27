<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 触发涟漪动画的外部信号（例如输入文字或切换预设） */
    trigger?: string | number
  }>(),
  { trigger: '' },
)

const containerEl = ref<HTMLElement | null>(null)
const prefersReducedMotion = ref(false)

const target = { x: 0, y: 0 }
const current = { x: 0, y: 0 }
let rafId: number | null = null

const isHovered = ref(false)
const isPressed = ref(false)
const isRippling = ref(false)
let rippleTimer: ReturnType<typeof setTimeout> | null = null

const updateParallax = () => {
  if (prefersReducedMotion.value) return

  // 阻尼线性平滑插值
  const ease = 0.08
  current.x += (target.x - current.x) * ease
  current.y += (target.y - current.y) * ease

  if (containerEl.value) {
    containerEl.value.style.setProperty('--tilt-x', `${(-current.y * 10).toFixed(2)}deg`)
    containerEl.value.style.setProperty('--tilt-y', `${(current.x * 12).toFixed(2)}deg`)
    containerEl.value.style.setProperty('--shift-x', `${(current.x * 14).toFixed(2)}px`)
    containerEl.value.style.setProperty('--shift-y', `${(current.y * 10).toFixed(2)}px`)
  }

  rafId = requestAnimationFrame(updateParallax)
}

const handleMouseMove = (e: MouseEvent) => {
  if (prefersReducedMotion.value) return
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  target.x = Math.max(-1, Math.min(1, (e.clientX - cx) / cx))
  target.y = Math.max(-1, Math.min(1, (e.clientY - cy) / cy))
}

const handleMouseLeave = () => {
  target.x = 0
  target.y = 0
  isHovered.value = false
  isPressed.value = false
}

const triggerRipple = () => {
  if (prefersReducedMotion.value) return
  isRippling.value = true
  if (rippleTimer) clearTimeout(rippleTimer)
  rippleTimer = setTimeout(() => {
    isRippling.value = false
  }, 640)
}

const handleMouseDown = () => {
  isPressed.value = true
  triggerRipple()
}

const handleMouseUp = () => {
  isPressed.value = false
}

watch(
  () => props.trigger,
  (val, oldVal) => {
    if (val !== undefined && val !== oldVal) {
      triggerRipple()
    }
  },
)

onMounted(() => {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = mql.matches
  const handleMql = (e: MediaQueryListEvent) => {
    prefersReducedMotion.value = e.matches
  }
  mql.addEventListener('change', handleMql)

  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  window.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('mouseleave', handleMouseLeave)

  if (!prefersReducedMotion.value) {
    rafId = requestAnimationFrame(updateParallax)
  }

  onUnmounted(() => {
    mql.removeEventListener('change', handleMql)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('mouseleave', handleMouseLeave)
    if (rafId) cancelAnimationFrame(rafId)
    if (rippleTimer) clearTimeout(rippleTimer)
  })
})
</script>

<template>
  <div
    ref="containerEl"
    class="pink-orb-container"
    :class="{
      'is-hovered': isHovered,
      'is-pressed': isPressed,
    }"
    @mouseenter="isHovered = true"
    @mouseleave="handleMouseLeave"
    @mousedown="handleMouseDown"
  >
    <!-- 核心粉色立体光感球 -->
    <div class="pink-orb" aria-hidden="true">
      <!-- 柔和高光弧面 -->
      <div class="orb-specular"></div>
      <!-- 次表面微光晕 -->
      <div class="orb-inner-light"></div>
    </div>

    <!-- 独立的柔和涟漪环，完全不干扰球体尺寸 -->
    <div v-if="isRippling" class="orb-ripple"></div>
  </div>
</template>

<style scoped>
.pink-orb-container {
  --tilt-x: 0deg;
  --tilt-y: 0deg;
  --shift-x: 0px;
  --shift-y: 0px;

  position: absolute;
  top: -40px;
  right: -66px;
  width: 304px;
  height: 304px;
  pointer-events: auto;
  perspective: 800px;
  transform-style: preserve-3d;
  cursor: pointer;
  user-select: none;
  transform:
    translate3d(var(--shift-x), var(--shift-y), 0)
    rotateX(var(--tilt-x))
    rotateY(var(--tilt-y));
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* 核心粉色球体：纯粉色系光影，采用连续的弹性平滑过渡 */
.pink-orb {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(
    circle at calc(36% + var(--shift-x) * 0.3) calc(32% + var(--shift-y) * 0.3),
    #ff8cd0 0%,
    #ff48b0 44%,
    #ea2a9b 74%,
    #d11384 100%
  );
  box-shadow:
    inset -10px -14px 26px rgba(180, 8, 108, 0.32),
    inset 8px 10px 20px rgba(255, 255, 255, 0.46),
    0 16px 44px -10px rgba(255, 72, 176, 0.34);
  mix-blend-mode: multiply;
  transform: scale(1);
  will-change: transform;
  /* 平滑阻尼回弹曲线，松开时弹性回复，绝无尺寸跳变 */
  transition:
    transform 420ms cubic-bezier(0.34, 1.45, 0.64, 1),
    box-shadow 360ms var(--ease-out);
}

/* 悬停微动：轻柔放大 3% */
.pink-orb-container.is-hovered .pink-orb {
  transform: scale(1.03);
  box-shadow:
    inset -8px -12px 24px rgba(180, 8, 108, 0.28),
    inset 10px 12px 22px rgba(255, 255, 255, 0.58),
    0 22px 56px -8px rgba(255, 72, 176, 0.44);
}

/* 按下受压：柔和下陷 3%，过渡快速敏捷 */
.pink-orb-container.is-pressed .pink-orb {
  transform: scale(0.97);
  transition: transform 120ms ease-out;
}

/* 顶部白粉柔光高光 */
.orb-specular {
  position: absolute;
  top: 13%;
  left: 16%;
  width: 38%;
  height: 25%;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.72) 0%,
    rgba(255, 255, 255, 0.22) 55%,
    transparent 80%
  );
  transform: rotate(-26deg);
  pointer-events: none;
  filter: blur(1.5px);
  transition: transform 200ms var(--ease-out), opacity 240ms var(--ease-out);
}

.pink-orb-container.is-hovered .orb-specular {
  opacity: 0.95;
  transform: rotate(-26deg) scale(1.08);
}

/* 底部次表面透光 */
.orb-inner-light {
  position: absolute;
  bottom: 9%;
  right: 15%;
  width: 42%;
  height: 30%;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 180, 226, 0.42) 0%,
    transparent 75%
  );
  transform: rotate(18deg);
  pointer-events: none;
}

/* 独立涟漪环：仅在外部扩散淡出，完全不影响球体自身尺寸 */
.orb-ripple {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px solid var(--pink);
  mix-blend-mode: multiply;
  pointer-events: none;
  animation: orb-pulse-wave 640ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes orb-pulse-wave {
  0% {
    transform: scale(0.96);
    opacity: 0.75;
  }
  100% {
    transform: scale(1.24);
    opacity: 0;
  }
}

/* 减弱动效模式 */
@media (prefers-reduced-motion: reduce) {
  .pink-orb-container {
    perspective: none;
    transform: none !important;
    transition: none !important;
  }
  .pink-orb {
    transform: none !important;
    transition: none !important;
  }
  .orb-ripple {
    display: none;
  }
}
</style>
