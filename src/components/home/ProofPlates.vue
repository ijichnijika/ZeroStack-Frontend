<script setup lang="ts">
/**
 * 样张底层衬板视觉组件
 * 位于主样张下方提供分层阴影与动态偏移，响应数据变更脉冲与光标缓动。
 */
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { usePointerDrift } from '@/composables/usePointerDrift'

const props = withDefaults(
  defineProps<{
    /** 触发计数器：数值变化时执行一次脉冲位移动效 */
    trigger?: number
    /** 提交中状态：保持展开偏移态 */
    printing?: boolean
  }>(),
  { trigger: 0, printing: false },
)

const stackEl = ref<HTMLElement | null>(null)
const fanned = ref(false)
const off = ref(false)
let offTimer: ReturnType<typeof setTimeout> | null = null
let fanFrame = 0

const pulse = () => {
  off.value = true
  if (offTimer) clearTimeout(offTimer)
  offTimer = setTimeout(() => {
    off.value = false
  }, 150)
}

watch(() => props.trigger, pulse)

usePointerDrift(stackEl, ({ vx, vy }) => {
  stackEl.value?.style.setProperty('--px', vx.toFixed(3))
  stackEl.value?.style.setProperty('--py', vy.toFixed(3))
})

onMounted(() => {
  // 双帧 rAF 确保 DOM 挂载稳定后触发入场展开动画
  fanFrame = requestAnimationFrame(() => {
    fanFrame = requestAnimationFrame(() => {
      fanned.value = true
    })
  })
})

onUnmounted(() => {
  if (fanFrame) cancelAnimationFrame(fanFrame)
  if (offTimer) clearTimeout(offTimer)
})

defineExpose({ pulse })
</script>

<template>
  <div
    ref="stackEl"
    class="plates"
    :class="{ 'is-fanned': fanned, 'is-off': off || printing }"
    aria-hidden="true"
  >
    <span class="plate"></span>
  </div>
</template>

<style scoped>
/* 衬板容器：--fan 为 0 时与主样张对齐隐藏，1 时斜向平移展开为衬底 */
.plates {
  --fan: 0;
  --px: 0;
  --py: 0;

  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.plates.is-fanned {
  --fan: 1;
}

.proof:hover .plates.is-fanned {
  --fan: 1.35;
}

.plates.is-fanned.is-off {
  --fan: 2;
}

.plate {
  position: absolute;
  inset: 0;
  border-radius: var(--radius);
  background: var(--yellow);
  translate: calc(var(--px) * 4px) calc(var(--py) * 4px);
  transform: translate(calc(14px * var(--fan)), calc(14px * var(--fan)));
  transition: transform var(--t-register) var(--ease-out);
}

.is-off .plate {
  transition-duration: 140ms;
}
</style>
