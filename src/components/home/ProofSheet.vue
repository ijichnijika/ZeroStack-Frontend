<script setup lang="ts">
/**
 * 首页示意样张组件
 * 根据用户输入的提示词或所选预设，动态渲染对应版式（博客/作品集/看板/落地页/待办）的交互草样。
 */
import { computed, onUnmounted, ref, useId, watch } from 'vue'
import { PRESETS, type PresetKey } from './presets'
import ProofPlates from './ProofPlates.vue'
import ProofThumb from './ProofThumb.vue'
import RisoScene from './RisoScene.vue'
import { usePointerDrift } from '@/composables/usePointerDrift'

const props = defineProps<{
  title: string
  layout: PresetKey
  /** 提交中状态：触发图层动态位移动效 */
  printing?: boolean
  /** 输入聚焦状态：标题末尾显示输入光标 */
  composing?: boolean
}>()

const shadeId = `pf-shade-${useId()}`

const statTiles = [
  { value: '¥48.2k', label: '销售额', ink: 'pink' },
  { value: '1,284', label: '订单', ink: 'yellow' },
  { value: '9,730', label: '访客', ink: 'blue' },
]
const chartBars = [34, 48, 40, 62, 55, 70, 58, 76, 64, 82, 72, 90, 78, 96]
const todos = [
  { done: true, w: 72 },
  { done: true, w: 54 },
  { done: false, w: 80 },
  { done: false, w: 46 },
]

const layoutLabel = computed(() => PRESETS.find((preset) => preset.key === props.layout)?.label)
const isCustomTitle = computed(
  () => props.composing || (Boolean(props.title) && props.title !== '你的网站，从这一句开始'),
)
const headerTitle = computed(() => (isCustomTitle.value ? props.title : layoutLabel.value))

// 副样张固定取当前版式之外的前两种，切换版式时主样张始终在最前
const BACK_ORDER: PresetKey[] = ['blog', 'dashboard', 'portfolio', 'product', 'todo']
const backLayouts = computed(() => BACK_ORDER.filter((key) => key !== props.layout).slice(0, 2))
const BACK_PLATES = ['blue', 'pink'] as const

const stageRef = ref<HTMLElement | null>(null)
usePointerDrift(stageRef, ({ vx, vy }) => {
  stageRef.value?.style.setProperty('--sx', vx.toFixed(3))
  stageRef.value?.style.setProperty('--sy', vy.toFixed(3))
})

// 版式切换时立即触发刷新；文本输入则防抖 420ms 触发，避免逐字输入时高频重置动效
const pull = ref(0)
let pullTimer: ReturnType<typeof setTimeout> | null = null

watch([() => props.layout, () => props.title], ([layout], [prevLayout]) => {
  if (pullTimer) clearTimeout(pullTimer)
  if (layout !== prevLayout) {
    pull.value++
    return
  }
  pullTimer = setTimeout(() => {
    pull.value++
  }, 420)
})

onUnmounted(() => {
  if (pullTimer) clearTimeout(pullTimer)
})
</script>

<template>
  <figure class="proof">
    <div ref="stageRef" class="stage">
      <div class="backdrop" aria-hidden="true">
        <span class="dots dots-blue halftone"></span>
        <span class="dots dots-pink halftone"></span>
        <span class="blob blob-yellow"></span>
        <span class="blob blob-pink"></span>
        <svg class="burst" viewBox="0 0 72 64" fill="none">
          <polygon points="16,46 8,8 22,5 24,44" fill="var(--pink)" />
          <polygon points="28,50 38,14 52,21 34,53" fill="var(--yellow)" />
          <polygon points="36,58 62,38 69,50 39,62" fill="var(--blue)" />
        </svg>
      </div>

      <ProofThumb
        v-for="(key, i) in backLayouts"
        :key="key"
        :layout="key"
        :plate="BACK_PLATES[i]"
        class="back"
        :class="`back-${i}`"
      />

      <div class="press">
        <ProofPlates :trigger="pull" :printing="printing" />

        <div class="frame" aria-hidden="true">
          <div class="frame-bar">
            <span class="dot dot-pink"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-blue"></span>
            <p class="sheet-title">
              <span
                v-if="isCustomTitle"
                :key="pull"
                class="title-plate p p-yellow"
                :class="{ 'is-inking': pull > 0 }"
              ></span>
              <span class="title-text"
                >{{ headerTitle }}<span v-if="composing" :key="pull" class="type-caret"></span
              ></span>
            </p>
            <span v-if="isCustomTitle" class="frame-tag">{{ layoutLabel }}</span>
            <span v-else class="frame-nav"><i></i><i></i><i></i></span>
          </div>

          <div :key="layout" class="frame-body" :class="`layout-${layout}`">
            <!-- 作品集 -->
            <template v-if="layout === 'portfolio'">
              <svg class="pf-hero" viewBox="0 0 360 138" preserveAspectRatio="xMidYMax slice">
                <defs>
                  <pattern :id="shadeId" width="4" height="4" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.35" fill="var(--blue)" />
                  </pattern>
                </defs>
                <rect width="360" height="138" fill="#faf6ee" />
                <circle class="p p-yellow" cx="268" cy="92" r="68" fill="var(--yellow)" />
                <polygon class="p p-pink" points="32,138 44,54 118,16 112,138" fill="var(--pink)" />
                <polygon
                  class="p p-pink"
                  points="118,16 214,76 206,138 112,138"
                  fill="var(--pink)"
                />
                <polygon
                  points="118,16 214,76 206,138 112,138"
                  :fill="`url(#${shadeId})`"
                  opacity="0.78"
                />
                <polygon points="196,64 334,138 190,138" fill="var(--blue)" opacity="0.86" />
              </svg>

              <div class="pf-grid">
                <div class="pf-card">
                  <span class="pf-stamp p p-blue">
                    <svg viewBox="0 0 88 52">
                      <circle cx="24" cy="17" r="6" fill="#fff" />
                      <polygon points="6,52 34,24 54,42 70,20 88,52" fill="#fff" />
                    </svg>
                  </span>
                  <span class="bar bar-ink"></span>
                  <span class="bar bar-rule short"></span>
                </div>
                <div class="pf-card">
                  <span class="pf-stamp p p-yellow">
                    <svg viewBox="0 0 88 52">
                      <g fill="var(--pink)">
                        <ellipse cx="28" cy="26" rx="13" ry="5" />
                        <ellipse cx="28" cy="26" rx="13" ry="5" transform="rotate(60 28 26)" />
                        <ellipse cx="28" cy="26" rx="13" ry="5" transform="rotate(120 28 26)" />
                      </g>
                      <circle cx="28" cy="26" r="3.5" fill="var(--yellow)" />
                      <g fill="#fff">
                        <ellipse cx="60" cy="26" rx="13" ry="5" />
                        <ellipse cx="60" cy="26" rx="13" ry="5" transform="rotate(60 60 26)" />
                        <ellipse cx="60" cy="26" rx="13" ry="5" transform="rotate(120 60 26)" />
                      </g>
                      <circle cx="60" cy="26" r="3.5" fill="var(--pink)" />
                    </svg>
                  </span>
                  <span class="bar bar-ink"></span>
                  <span class="bar bar-rule short"></span>
                </div>
                <div class="pf-card">
                  <span class="pf-stamp p p-pink">
                    <svg viewBox="0 0 88 52" fill="none" stroke="#fff" stroke-width="2">
                      <polygon points="44,9 64,20 64,41 44,50 24,41 24,20" />
                      <polyline points="24,20 44,30 64,20" />
                      <line x1="44" y1="30" x2="44" y2="50" />
                    </svg>
                  </span>
                  <span class="bar bar-ink"></span>
                  <span class="bar bar-rule short"></span>
                </div>
              </div>
            </template>

            <!-- 博客 -->
            <template v-else-if="layout === 'blog'">
              <RisoScene class="blog-scene" />
              <div v-for="i in 2" :key="i" class="post-row">
                <span class="post-thumb p" :class="['p-pink', 'p-blue'][i - 1]"></span>
                <span class="post-lines">
                  <span class="bar bar-ink" :style="{ width: `${[78, 64][i - 1]}%` }"></span>
                  <span class="bar bar-rule"></span>
                  <span class="bar bar-rule short"></span>
                </span>
              </div>
            </template>

            <!-- 看板 -->
            <template v-else-if="layout === 'dashboard'">
              <div class="stats">
                <span v-for="s in statTiles" :key="s.label" class="stat p" :class="`p-${s.ink}`">
                  <span class="stat-value">{{ s.value }}</span>
                  <span class="stat-label">{{ s.label }}</span>
                </span>
              </div>
              <div class="chart">
                <span
                  v-for="(h, i) in chartBars"
                  :key="i"
                  class="chart-bar p"
                  :class="i === chartBars.length - 1 ? 'p-pink' : 'p-blue'"
                  :style="{ height: `${h}%` }"
                ></span>
              </div>
            </template>

            <!-- 落地页 -->
            <div v-else-if="layout === 'product'" class="product">
              <span class="product-disc p p-pink"></span>
              <span class="product-ring p p-blue"></span>
              <span class="product-copy">
                <span class="bar bar-ink"></span>
                <span class="bar bar-rule"></span>
                <span class="bar bar-rule short"></span>
                <span class="buy-pill">立即购买</span>
              </span>
            </div>

            <!-- 待办 -->
            <template v-else>
              <div v-for="(t, i) in todos" :key="i" class="todo-row">
                <span class="todo-box p" :class="t.done ? 'p-blue is-done' : 'is-open'"></span>
                <span
                  class="bar"
                  :class="t.done ? 'bar-rule is-struck' : 'bar-ink'"
                  :style="{ width: `${t.w}%` }"
                ></span>
              </div>
              <div class="todo-add">
                <span class="bar bar-rule"></span>
                <span class="add-disc p p-pink">+</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </figure>
</template>

<style scoped>
.proof {
  position: relative;
  margin: 0;
  isolation: isolate;
}

/* 舞台给两张副样张预留上方扇面空间，主样张斜落于右下方形成三叠拼贴 */
.stage {
  --sx: 0;
  --sy: 0;

  position: relative;
  isolation: isolate;
  padding: 228px 7% 14px 19%;
}

.backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
  pointer-events: none;
}

.blob,
.dots {
  position: absolute;
  border-radius: 50%;
  mix-blend-mode: multiply;
}

/* 细微白色噪点模拟孔版干墨在再生纸上的露白颗粒 */
.blob {
  background-image: radial-gradient(rgba(254, 252, 246, 0.24) 1px, transparent 1.5px);
  background-size: 5px 5px;
}

.blob-yellow {
  top: -24px;
  left: 5%;
  width: 92%;
  aspect-ratio: 1;
  background-color: var(--yellow);
  translate: calc(var(--sx) * -10px) calc(var(--sy) * -8px);
  animation: blob-in 900ms var(--ease-out) var(--proof-delay, 0ms) backwards;
}

.blob-pink {
  bottom: -6px;
  left: 2%;
  width: 42%;
  aspect-ratio: 1;
  background-color: var(--pink);
  translate: calc(var(--sx) * 14px) calc(var(--sy) * 10px);
}

.dots-blue {
  top: 2px;
  left: -4%;
  width: 28%;
  aspect-ratio: 1;
  color: var(--blue);
  translate: calc(var(--sx) * 16px) calc(var(--sy) * 12px);
}

.dots-pink {
  bottom: 2px;
  right: -2%;
  width: 34%;
  aspect-ratio: 1;
  color: var(--pink);
  translate: calc(var(--sx) * -12px) calc(var(--sy) * 10px);
}

.burst {
  position: absolute;
  top: 2px;
  right: 0;
  width: 66px;
  height: 58px;
  translate: calc(var(--sx) * -6px) calc(var(--sy) * -6px);
}

@keyframes blob-in {
  from {
    opacity: 0;
    transform: scale(0.82);
  }
}

/* 副样张：斜放在主样张左上方与右上方，入场时从叠心向外展开 */
.back {
  position: absolute;
  z-index: -1;
  box-shadow: 0 12px 26px -16px rgba(23, 23, 26, 0.36);
  transition: transform var(--t-register) var(--ease-out);
  animation: back-fan 900ms var(--ease-out) var(--proof-delay, 0ms) backwards;
}

.back-0 {
  top: 26px;
  left: -1%;
  width: 57%;
  transform: translate(calc(var(--sx) * 6px), calc(var(--sy) * 4px)) rotate(-11deg);
}

.back-1 {
  top: 84px;
  right: -4%;
  width: 58%;
  transform: translate(calc(var(--sx) * 8px), calc(var(--sy) * 6px)) rotate(11.5deg);
}

.proof:hover .back-0 {
  transform: translate(-10px, -6px) rotate(-13deg);
}

.proof:hover .back-1 {
  transform: translate(10px, -4px) rotate(13.5deg);
}

@keyframes back-fan {
  from {
    opacity: 0;
    transform: translateY(84px) rotate(0deg);
  }
}

.press {
  position: relative;
  transform: rotate(5.5deg);
  box-shadow: 0 18px 36px -22px rgba(23, 23, 26, 0.42);
  transition: transform var(--t-register) var(--ease-out);
}

.proof:hover .press {
  transform: translateY(-4px) rotate(4deg);
}

.frame {
  position: relative;
  background: var(--sheet);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius);
  overflow: hidden;
}

.frame-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 13px;
  border-bottom: 1.5px solid var(--ink);
}

.dot {
  width: 8.5px;
  height: 8.5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-pink {
  background: var(--pink);
}

.dot-yellow {
  background: var(--yellow);
}

.dot-blue {
  background: var(--blue);
}

.frame-nav {
  display: inline-flex;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
}

.frame-nav i {
  width: 15px;
  height: 4px;
  border-radius: 1px;
  background: var(--ink-3);
}

.frame-tag {
  margin-left: auto;
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: var(--pill);
  background: var(--paper-2);
  font-size: 11px;
  font-weight: 700;
  color: var(--blue);
}

.frame-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 278px;
  padding: 15px 16px;
  overflow: hidden;
}

/* ---------- plates ---------- */
.p {
  mix-blend-mode: multiply;
}

.p-pink {
  background-color: var(--pink);
  color: var(--pink);
}

.p-blue {
  background-color: var(--blue);
  color: var(--blue);
}

.p-yellow {
  background-color: var(--yellow);
  color: var(--yellow);
}

/* --proof-delay 由首页在入场期间传入，让样张落定后再套印 */
.frame-body .p-pink {
  animation: register-pink var(--t-register) var(--ease-out) var(--proof-delay, 0ms) both;
}

.frame-body .p-blue {
  animation: register-blue var(--t-register) var(--ease-out) calc(var(--proof-delay, 0ms) + 60ms)
    both;
}

.frame-body .p-yellow {
  animation: register-yellow var(--t-register) var(--ease-out) calc(var(--proof-delay, 0ms) + 120ms)
    both;
}

@keyframes register-pink {
  from {
    transform: translate(-9px, 6px);
    opacity: 0;
  }
}

@keyframes register-blue {
  from {
    transform: translate(8px, -7px);
    opacity: 0;
  }
}

@keyframes register-yellow {
  from {
    transform: translate(5px, 9px);
    opacity: 0;
  }
}

/* ---------- title ---------- */
.sheet-title {
  position: relative;
  isolation: isolate;
  min-width: 0;
  margin-left: 7px;
  font-family: var(--font-wide);
  font-size: 15px;
  font-weight: 900;
  font-stretch: 112%;
  line-height: 1.2;
  color: var(--ink);
}

.title-plate {
  position: absolute;
  left: -4px;
  right: -5px;
  bottom: 0;
  height: 48%;
  z-index: -1;
}

.sheet-title .title-plate.is-inking {
  animation: ink-roll 560ms var(--ease-out) both;
}

@keyframes ink-roll {
  from {
    clip-path: inset(0 100% 0 0);
  }

  to {
    clip-path: inset(0 0 0 0);
  }
}

.type-caret {
  display: inline-block;
  width: 2.5px;
  height: 0.9em;
  margin-left: 3px;
  vertical-align: -0.08em;
  background: var(--pink);
  mix-blend-mode: multiply;
  animation: caret-blink 1060ms steps(1) 4;
}

@keyframes caret-blink {
  50% {
    opacity: 0;
  }
}

.title-text {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ---------- shared bars ---------- */
.bar {
  display: block;
  height: 7px;
  border-radius: 1.5px;
}

.bar-ink {
  width: 82%;
  background: var(--ink);
}

.bar-rule {
  background: var(--paper-3);
}

.bar.short {
  width: 56%;
}

/* ---------- portfolio ---------- */
.pf-hero {
  width: 100%;
  height: 136px;
  flex-shrink: 0;
  border-radius: 2px;
}

.pf-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 11px;
  flex: 1;
  min-height: 0;
}

.pf-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pf-stamp {
  flex: 1;
  min-height: 0;
  border-radius: 2px;
  overflow: hidden;
}

.pf-stamp svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* ---------- blog ---------- */
.blog-scene {
  flex-shrink: 0;
  height: 104px;
  border-radius: 2px;
  overflow: hidden;
}

.post-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid var(--rule);
}

.post-thumb {
  width: 46px;
  height: 46px;
  border-radius: 2px;
  flex-shrink: 0;
}

.post-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

/* ---------- dashboard ---------- */
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 11px 10px;
  border-radius: 3px;
}

.stat-value,
.stat-label {
  color: var(--ink);
}

.p-blue .stat-value,
.p-blue .stat-label {
  color: #fff;
}

.stat-value {
  font-family: var(--font-wide);
  font-stretch: 112%;
  font-weight: 800;
  font-size: 16px;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  flex: 1;
  padding-top: 12px;
  border-bottom: 1.5px solid var(--ink);
}

.chart-bar {
  flex: 1;
  border-radius: 1px 1px 0 0;
}

/* ---------- product ---------- */
.product {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
}

.product-disc {
  width: 156px;
  aspect-ratio: 1;
  border-radius: 50%;
  flex-shrink: 0;
}

.product-ring {
  position: absolute;
  left: 52px;
  top: 50%;
  width: 106px;
  aspect-ratio: 1;
  border-radius: 50%;
  margin-top: -53px;
}

.product-copy {
  display: flex;
  flex-direction: column;
  gap: 9px;
  flex: 1;
  margin-left: 24px;
}

.buy-pill {
  align-self: flex-start;
  margin-top: 8px;
  padding: 7px 14px;
  border-radius: var(--pill);
  background: var(--ink);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

/* ---------- todo ---------- */
.todo-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid var(--rule);
}

.todo-box {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.todo-box.is-open {
  border: 2px solid var(--ink);
}

.todo-add {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding: 7px 8px 7px 14px;
  border: 1.5px solid var(--ink);
  border-radius: var(--pill);
}

.todo-add .bar {
  flex: 1;
}

.add-disc {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 800;
  color: var(--ink) !important;
}

@media (max-width: 900px) {
  .stage {
    padding: 172px 5% 16px 14%;
  }
}

@media (max-width: 560px) {
  .stage {
    padding: 132px 3% 14px 8%;
  }

  .back-0 {
    top: 16px;
    left: 0;
    width: 60%;
    transform: rotate(-8deg);
  }

  .back-1 {
    top: 52px;
    right: -2%;
    width: 60%;
    transform: rotate(8deg);
  }

  .back :deep(.thumb-body) {
    height: 142px;
  }

  .press {
    transform: rotate(3deg);
  }

  .burst {
    display: none;
  }

  .frame-body {
    height: 248px;
    padding: 13px;
  }

  .pf-hero {
    height: 112px;
  }

  .product-disc {
    width: 124px;
  }

  .product-ring {
    left: 40px;
    width: 86px;
    margin-top: -43px;
  }

  .product-copy {
    min-width: 0;
    margin-left: 16px;
  }
}
</style>
