<script setup lang="ts">
/**
 * 首页示意样张组件
 * 根据用户输入的提示词或所选预设，动态渲染对应版式（博客/作品集/看板/落地页/待办）的交互草样。
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import type { PresetKey } from './presets'
import ProofPlates from './ProofPlates.vue'
import { DEPLOY_BASE_URL } from '@/config/env'

const deployHost = DEPLOY_BASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')

const props = defineProps<{
  title: string
  layout: PresetKey
  /** 提交中状态：触发图层动态位移动效 */
  printing?: boolean
  /** 输入聚焦状态：标题末尾显示输入光标 */
  composing?: boolean
}>()

const statTiles = [
  { value: '¥48.2k', label: '销售额', ink: 'yellow' },
  { value: '1,284', label: '订单', ink: 'pink' },
  { value: '9,730', label: '访客', ink: 'blue' },
]
const chartBars = [34, 48, 40, 62, 55, 70, 58, 76, 64, 82, 72, 90, 78, 96]
const masonry = [
  { h: 96, ink: 'pink' },
  { h: 140, ink: 'blue', screen: true },
  { h: 72, ink: 'yellow' },
  { h: 120, ink: 'yellow', screen: true },
  { h: 84, ink: 'pink', screen: true },
  { h: 110, ink: 'blue' },
]
const todos = [
  { done: true, w: 72 },
  { done: true, w: 54 },
  { done: false, w: 80 },
  { done: false, w: 46 },
]

const titleText = computed(() => props.title)

// 版式切换时立即触发刷新；文本输入则防抖 420ms 触发，避免逐字输入时高频重置动效
const pull = ref(0)
let pullTimer: ReturnType<typeof setTimeout> | null = null

// 合并监听版式与标题：切换预设时二者同时变更，合并为单次动画触发
watch([() => props.layout, titleText], ([layout], [prevLayout]) => {
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
    <div class="press">
      <ProofPlates :trigger="pull" :printing="printing" />

      <div class="frame" aria-hidden="true">
        <div class="frame-bar">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          <span class="frame-url">{{ deployHost }}/你的站点</span>
        </div>

        <div :key="layout" class="frame-body" :class="`layout-${layout}`">
          <p class="sheet-title">
            <span
              :key="pull"
              class="title-plate p p-yellow"
              :class="{ 'is-inking': pull > 0 }"
            ></span>
            <span class="title-text"
              >{{ titleText }}<span v-if="composing" :key="pull" class="type-caret"></span
            ></span>
          </p>

          <!-- 博客 -->
          <template v-if="layout === 'blog'">
            <div class="chip-row">
              <span class="mini-pill p p-yellow"></span>
              <span class="mini-pill p p-pink"></span>
              <span class="mini-pill p p-blue"></span>
            </div>
            <div v-for="i in 3" :key="i" class="post-row">
              <span class="post-thumb p" :class="['p-pink', 'p-blue', 'p-yellow'][i - 1]"></span>
              <span class="post-lines">
                <span class="bar bar-ink" :style="{ width: `${[78, 64, 70][i - 1]}%` }"></span>
                <span class="bar bar-rule"></span>
                <span class="bar bar-rule short"></span>
              </span>
            </div>
          </template>

          <!-- 作品集 -->
          <div v-else-if="layout === 'portfolio'" class="masonry">
            <span
              v-for="(m, i) in masonry"
              :key="i"
              class="tile p"
              :class="[`p-${m.ink}`, { 'is-screen halftone': m.screen }]"
              :style="{ height: `${m.h}px` }"
            ></span>
          </div>

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

    <figcaption class="proof-caption">
      示意样张：标题取自你的描述，版式粗略匹配，真实页面由 AI 生成。
    </figcaption>
  </figure>
</template>

<style scoped>
.proof {
  position: relative;
  margin: 0;
  isolation: isolate;
}

.press {
  position: relative;
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
  padding: 0 12px;
  border-bottom: 1.5px solid var(--ink);
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1.5px solid var(--ink);
}

.frame-url {
  margin-left: 10px;
  padding: 3px 12px;
  border-radius: var(--pill);
  background: var(--paper-2);
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-3);
}

.frame-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 340px;
  padding: 20px 22px;
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

.is-screen {
  background-color: transparent;
}

.frame-body .p-pink {
  animation: register-pink var(--t-register) var(--ease-out) both;
}

.frame-body .p-blue {
  animation: register-blue var(--t-register) var(--ease-out) 60ms both;
}

.frame-body .p-yellow {
  animation: register-yellow var(--t-register) var(--ease-out) 120ms both;
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
  min-height: 1.15em;
  isolation: isolate;
  align-self: flex-start;
  max-width: 100%;
  /* 中小字号下避免特定艺术字体笔画粘连，标题采用宽体黑体保持清晰度 */
  flex-shrink: 0;
  font-family: var(--font-wide);
  font-size: 24px;
  font-weight: 900;
  font-stretch: 125%;
  line-height: 1.2;
  color: var(--ink);
  word-break: break-all;
}

.title-plate {
  position: absolute;
  left: -6px;
  right: -8px;
  bottom: 2px;
  height: 46%;
  z-index: -1;
}

/* 标题底色高亮动画：内容更新时从左向右展开 */
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

/* 标题同步输入光标 */
.type-caret {
  display: inline-block;
  width: 3px;
  height: 0.86em;
  margin-left: 4px;
  vertical-align: -0.08em;
  background: var(--pink);
  mix-blend-mode: multiply;
  /* 闪烁指定次数后停止，避免持续动画消耗性能 */
  animation: caret-blink 1060ms steps(1) 4;
}

@keyframes caret-blink {
  50% {
    opacity: 0;
  }
}

.title-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ---------- shared bars ---------- */
.bar {
  display: block;
  height: 9px;
  border-radius: var(--pill);
}

.bar-ink {
  background: var(--ink);
}

.bar-rule {
  background: var(--paper-3);
}

.bar.short {
  width: 45%;
}

/* ---------- blog ---------- */
.chip-row {
  display: flex;
  gap: 8px;
}

.mini-pill {
  width: 54px;
  height: 20px;
  border-radius: var(--pill);
}

.post-row {
  display: flex;
  gap: 14px;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid var(--rule);
}

.post-thumb {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.post-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

/* ---------- portfolio ---------- */
.masonry {
  columns: 3;
  column-gap: 10px;
}

.tile {
  display: block;
  margin-bottom: 10px;
  break-inside: avoid;
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
  padding: 12px 10px;
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
  font-size: 17px;
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
  gap: 6px;
  flex: 1;
  padding-top: 12px;
  border-bottom: 1.5px solid var(--ink);
}

.chart-bar {
  flex: 1;
}

/* ---------- product ---------- */
.product {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
}

.product-disc {
  width: 172px;
  aspect-ratio: 1;
  border-radius: 50%;
  flex-shrink: 0;
}

.product-ring {
  position: absolute;
  left: 58px;
  top: 50%;
  width: 116px;
  aspect-ratio: 1;
  border-radius: 50%;
  margin-top: -58px;
}

.product-copy {
  display: flex;
  flex-direction: column;
  gap: 9px;
  flex: 1;
  margin-left: 28px;
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
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
}

.todo-box.is-open {
  border: 2px solid var(--ink);
}

.bar.is-struck {
  position: relative;
}

.todo-add {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding: 8px 8px 8px 16px;
  border: 1.5px solid var(--ink);
  border-radius: var(--pill);
}

.todo-add .bar {
  flex: 1;
}

.add-disc {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-weight: 800;
  color: var(--ink) !important;
}

/* ---------- caption ---------- */
.proof-caption {
  margin-top: 28px;
  font-size: 13px;
  color: var(--ink-2);
}
</style>
