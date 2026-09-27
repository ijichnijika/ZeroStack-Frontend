<script setup lang="ts">
import { CheckOutlined, CloseOutlined } from '@ant-design/icons-vue'

export type StationState = 'pending' | 'active' | 'done' | 'failed'

export interface Station {
  key: string
  label: string
  state: StationState
}

defineProps<{
  stations: Station[]
}>()

const stateText: Record<StationState, string> = {
  pending: '未开始',
  active: '进行中',
  done: '已完成',
  failed: '未完成',
}
</script>

<template>
  <ol class="stations" aria-label="生成进度">
    <li
      v-for="s in stations"
      :key="s.key"
      class="station"
      :class="`is-${s.state}`"
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
</style>
