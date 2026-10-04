<script setup lang="ts">
/**
 * 代码生成工序指示器组件
 * 展示“生成 -> 构建 -> 预览 -> 部署”多阶段流水线的当前执行状态。
 */
import { computed } from 'vue'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons-vue'

export type StationState = 'pending' | 'active' | 'done' | 'failed'

export interface Station {
  key: string
  label: string
  state: StationState
}

const props = defineProps<{
  stations: Station[]
}>()

// 状态图标动画类：存在进行中工序时呈现动态位移，预览就绪后对齐固定
const register = computed(() => {
  if (props.stations.some((s) => s.state === 'active')) return 'is-off'
  if (props.stations.some((s) => s.key === 'preview' && s.state === 'done')) return 'is-in'
  return ''
})

const stateText: Record<StationState, string> = {
  pending: '未开始',
  active: '进行中',
  done: '已完成',
  failed: '未完成',
}
</script>

<template>
  <ol class="stations" aria-label="生成进度">
    <li class="reg-mark" :class="register" aria-hidden="true"></li>
    <li
      v-for="s in stations"
      :key="s.key"
      class="station"
      :class="[`is-${s.state}`, `station-${s.key}`]"
      :aria-current="s.state === 'active' ? 'step' : undefined"
    >
      <span class="station-dot" aria-hidden="true">
        <CheckOutlined v-if="s.state === 'done'" />
        <CloseOutlined v-else-if="s.state === 'failed'" />
      </span>
      <span class="station-label">{{ s.label }}</span>
      <span class="sr-only">{{ stateText[s.state] }}</span>
    </li>
  </ol>
</template>

<style scoped>
.stations {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  gap: 0;
}

.reg-mark {
  position: relative;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-right: 14px;
  isolation: isolate;
}

.reg-mark::before,
.reg-mark::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  mix-blend-mode: multiply;
  transition: transform var(--t-register) var(--ease-out);
}

.reg-mark::before {
  --off: translate(3px, -2px);

  background: var(--pink);
  transform: translate(1.5px, -1px);
}

.reg-mark::after {
  --off: translate(-2px, 3px);

  background: var(--blue);
  transform: translate(-1px, 1.5px);
}

.reg-mark.is-off::before,
.reg-mark.is-off::after {
  transform: var(--off);
  animation: reg-drift 1500ms var(--ease-in-out) infinite alternate;
}

.reg-mark.is-in::before,
.reg-mark.is-in::after {
  transform: none;
}

@keyframes reg-drift {
  from {
    transform: translate(0.5px, 0.5px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reg-mark.is-off::before,
  .reg-mark.is-off::after {
    animation: none;
  }
}

.station {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-3);
  white-space: nowrap;
}

.station + .station::before {
  content: '';
  width: 22px;
  height: 1.5px;
  margin: 0 10px;
  background: var(--rule);
}

.station-dot {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--ink-4);
  font-size: 9px;
  color: #fff;
  transition:
    background-color var(--t-register) var(--ease-out),
    border-color var(--t-register) var(--ease-out);
}

.is-done {
  color: var(--ink);
}

.is-done .station-dot {
  border-color: var(--ink);
  background: var(--ink);
}

.is-done + .station::before {
  background: var(--ink);
}

.is-active {
  color: var(--ink);
}

.is-active .station-dot {
  border-color: var(--pink);
  background: var(--pink);
  animation: station-pulse 1.3s var(--ease-in-out) infinite;
}

.is-active.station-build .station-dot {
  border-color: var(--ink);
  background: var(--yellow);
  color: var(--ink);
  animation: station-pulse-yellow 1.3s var(--ease-in-out) infinite;
}

.is-failed {
  color: var(--danger);
}

.is-failed .station-dot {
  border-color: var(--danger);
  background: var(--danger);
}

@keyframes station-pulse {
  50% {
    box-shadow: 0 0 0 5px var(--pink-tint);
  }
}

@keyframes station-pulse-yellow {
  50% {
    box-shadow: 0 0 0 5px var(--yellow-tint);
  }
}
</style>
