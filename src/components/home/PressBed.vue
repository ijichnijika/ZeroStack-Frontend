<script setup lang="ts">
/**
 * 首页背景视觉组件
 * 包含刻度标尺、对齐标记及随光标缓动的多层视差背景。
 */
import { ref } from 'vue'
import { usePointerDrift } from '@/composables/usePointerDrift'

defineProps<{
  /** 是否处于提交中动效状态 */
  printing?: boolean
}>()

const swatches = [
  'var(--yellow)',
  'var(--pink)',
  'var(--blue)',
  'var(--ink)',
  'var(--op-pink-yellow)',
  'var(--op-blue-yellow)',
  'var(--op-pink-blue)',
]

const bedEl = ref<HTMLElement | null>(null)

usePointerDrift(bedEl, ({ x, y, vx, vy }) => {
  const bed = bedEl.value
  if (!bed) return
  bed.style.setProperty('--px', vx.toFixed(3))
  bed.style.setProperty('--py', vy.toFixed(3))
  bed.style.setProperty('--mx', `${x.toFixed(1)}px`)
  bed.style.setProperty('--my', `${y.toFixed(1)}px`)
})
</script>

<template>
  <div ref="bedEl" class="bed" :class="{ 'is-printing': printing }" aria-hidden="true">
    <span class="ball ball--yellow"><span class="ball-ink"></span></span>
    <span class="ball ball--blue"><span class="ball-ink"></span></span>
    <span class="ball ball--pink"><span class="ball-ink"></span></span>

    <div class="ruler ruler--x"><span class="tick tick--x"></span></div>
    <div class="ruler ruler--y"><span class="tick tick--y"></span></div>

    <svg class="crop crop--tl" viewBox="0 0 20 20"><path d="M0 13.5h8M13.5 0v8" /></svg>
    <svg class="crop crop--tr" viewBox="0 0 20 20"><path d="M20 13.5h-8M6.5 0v8" /></svg>

    <div class="slug">
      <svg class="crop crop--bl" viewBox="0 0 20 20"><path d="M0 6.5h8M13.5 20v-8" /></svg>
      <span class="colorbar">
        <span v-for="c in swatches" :key="c" class="swatch" :style="{ background: c }"></span>
      </span>
    </div>

    <div class="target">
      <svg
        v-for="ink in ['yellow', 'pink', 'blue', 'ink']"
        :key="ink"
        :class="`reg reg--${ink}`"
        viewBox="0 0 30 30"
      >
        <circle cx="15" cy="15" r="8" />
        <path d="M15 0v30M0 15h30" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* 背景容器：包含刻度标尺、裁切线与对齐基准标记 */
.bed {
  --px: 0;
  --py: 0;
  --mx: -100px;
  --my: -100px;
  --gutter: clamp(20px, 4vw, 48px);

  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

/* 背景视差色块：外层跟随光标阻尼微移，内层执行循环缓动 */
.ball {
  position: absolute;
  translate: calc(var(--px) * var(--k) * 1px) calc(var(--py) * var(--k) * 1px);
  animation: ball-in 1400ms var(--ease-out) 200ms backwards;
}

@keyframes ball-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
}

.ball-ink {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  mix-blend-mode: multiply;
  animation: var(--dur) var(--ease-in-out) infinite alternate;
}

.ball--yellow {
  --k: -10;

  left: -6vw;
  bottom: -14vw;
  width: clamp(360px, 38vw, 560px);
  aspect-ratio: 1;
}

.ball--yellow .ball-ink {
  animation-name: drift-a;
  --dur: 26s;

  background: rgba(255, 232, 0, 0.2);
}

.ball--blue {
  --k: 16;

  left: 38vw;
  top: 46%;
  width: clamp(220px, 22vw, 340px);
  aspect-ratio: 1;
}

.ball--blue .ball-ink {
  animation-name: drift-b;
  --dur: 34s;

  background: rgba(0, 120, 191, 0.07);
}

.ball--pink {
  --k: 12;

  right: -8vw;
  top: -10vw;
  width: clamp(300px, 32vw, 480px);
  aspect-ratio: 1;
}

.ball--pink .ball-ink {
  animation-name: drift-c;
  --dur: 30s;

  background: rgba(255, 72, 176, 0.08);
}

@keyframes drift-a {
  to {
    transform: translate(9vw, -5vh);
  }
}

@keyframes drift-b {
  to {
    transform: translate(-7vw, 8vh);
  }
}

@keyframes drift-c {
  to {
    transform: translate(-6vw, 10vh);
  }
}

/* ---------- rulers: ticks only ---------- */
.ruler {
  position: absolute;
  top: 0;
  left: 0;
  color: rgba(23, 23, 26, 0.18);
}

.ruler--x {
  right: 0;
  height: 12px;
  background:
    repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 8px) 0 0 / 100% 4px
      no-repeat,
    repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 80px) 0 0 / 100% 9px
      no-repeat;
}

.ruler--y {
  bottom: 0;
  width: 12px;
  background:
    repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px 8px) 0 0 / 4px 100%
      no-repeat,
    repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px 80px) 0 0 / 9px 100%
      no-repeat;
}

.tick {
  position: absolute;
  top: 0;
  left: 0;
  background: var(--pink);
}

.tick--x {
  width: 1.5px;
  height: 10px;
  transform: translate3d(var(--mx), 0, 0);
}

.tick--y {
  width: 10px;
  height: 1.5px;
  transform: translate3d(0, var(--my), 0);
}

/* ---------- slug: crop marks + colour bar ---------- */
.crop {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: var(--ink);
  stroke-width: 1.2;
  opacity: 0.45;
}

.crop--tl,
.crop--tr {
  position: absolute;
  top: 18px;
}

.crop--tl {
  left: 18px;
}

.crop--tr {
  right: 18px;
}

.slug {
  position: absolute;
  left: 18px;
  bottom: 14px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.colorbar {
  display: flex;
  margin-bottom: 2px;
  opacity: 0.8;
}

.swatch {
  width: 8px;
  height: 8px;
}

/* ---------- registration target ---------- */
.target {
  position: absolute;
  right: var(--gutter);
  bottom: 12px;
  width: 30px;
  height: 30px;
}

.reg {
  position: absolute;
  inset: 0;
  fill: none;
  stroke-width: 1.3;
  mix-blend-mode: multiply;
  translate: calc(var(--px) * var(--k) * 1px) calc(var(--py) * var(--k) * 1px);
  transition: transform var(--t-register) var(--ease-out);
}

.reg--ink {
  --k: 0;

  stroke: var(--ink);
}

.reg--yellow {
  --off: translate(4px, 5px);
  --k: 2;

  stroke: var(--yellow);
  animation: reg-in 900ms var(--ease-out) 500ms backwards;
}

.reg--pink {
  --off: translate(-6px, 3px);
  --k: -2.5;

  stroke: var(--pink);
  animation: reg-in 900ms var(--ease-out) 380ms backwards;
}

.reg--blue {
  --off: translate(5px, -5px);
  --k: 3;

  stroke: var(--blue);
  animation: reg-in 900ms var(--ease-out) 440ms backwards;
}

@keyframes reg-in {
  from {
    transform: var(--off);
  }
}

.is-printing .reg:not(.reg--ink) {
  transform: var(--off);
}

@media (max-width: 900px) {
  .ruler,
  .ball--blue {
    display: none;
  }
}

@media (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .tick {
    display: none;
  }
}
</style>
