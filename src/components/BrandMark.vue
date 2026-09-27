<script setup lang="ts">
/**
 * 三块专色版叠印成的品牌标。
 * drifting=true 表示系统正在工作：色版轻微错位；结束后回到套准位置。
 */
withDefaults(
  defineProps<{
    size?: number
    drifting?: boolean
  }>(),
  { size: 28, drifting: false },
)
</script>

<template>
  <svg
    class="brand-mark"
    :class="{ 'is-drifting': drifting }"
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    aria-hidden="true"
  >
    <circle class="plate plate-yellow" cx="16" cy="20.5" r="8.5" />
    <circle class="plate plate-pink" cx="11" cy="12" r="8.5" />
    <circle class="plate plate-blue" cx="21" cy="12" r="8.5" />
  </svg>
</template>

<style scoped>
.brand-mark {
  display: block;
  flex-shrink: 0;
  overflow: visible;
}

.plate {
  mix-blend-mode: multiply;
  transform-box: fill-box;
  transform-origin: center;
  transition: transform var(--t-register) var(--ease-out);
}

.plate-yellow {
  fill: var(--yellow);
}

.plate-pink {
  fill: var(--pink);
}

.plate-blue {
  fill: var(--blue);
}

.is-drifting .plate-pink {
  animation: drift-a 1.6s var(--ease-in-out) infinite;
}

.is-drifting .plate-blue {
  animation: drift-b 1.6s var(--ease-in-out) infinite;
}

.is-drifting .plate-yellow {
  animation: drift-c 1.6s var(--ease-in-out) infinite;
}

@keyframes drift-a {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-2.5px, -1.5px);
  }
}

@keyframes drift-b {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(2.5px, -1px);
  }
}

@keyframes drift-c {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(0.5px, 2.5px);
  }
}
</style>
