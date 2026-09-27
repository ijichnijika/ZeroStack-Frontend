<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    checked: boolean
    disabled?: boolean
    /** 禁用时在提示里说明原因 */
    disabledReason?: string
  }>(),
  { disabled: false, disabledReason: '' },
)

const emit = defineEmits<{
  (e: 'update:checked', val: boolean): void
}>()

const tip = computed(() =>
  props.disabled && props.disabledReason
    ? props.disabledReason
    : 'Agent 模式会先收集图片素材、补全需求，生成后自动质检并修正。耗时更长，结果更完整。',
)

const select = (val: boolean) => {
  if (props.disabled || val === props.checked) return
  emit('update:checked', val)
}
</script>

<template>
  <a-tooltip :title="tip" placement="top" :mouse-enter-delay="0.4">
    <div
      class="mode-switch"
      :class="{ 'is-agent': checked, 'is-disabled': disabled }"
      role="radiogroup"
      aria-label="生成模式"
    >
      <span class="knob" aria-hidden="true"></span>
      <button
        type="button"
        role="radio"
        :aria-checked="!checked"
        :disabled="disabled"
        class="option"
        :class="{ 'is-on': !checked }"
        @click="select(false)"
      >
        标准
      </button>
      <button
        type="button"
        role="radio"
        :aria-checked="checked"
        :disabled="disabled"
        class="option"
        :class="{ 'is-on': checked }"
        @click="select(true)"
      >
        Agent
      </button>
    </div>
  </a-tooltip>
</template>

<style scoped>
.mode-switch {
  position: relative;
  display: inline-grid;
  grid-template-columns: 1fr 1fr;
  height: 34px;
  padding: 3px;
  border-radius: var(--pill);
  background: var(--paper-2);
  flex-shrink: 0;
}

.knob {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc(50% - 3px);
  border-radius: var(--pill);
  background: var(--ink);
  transition:
    transform var(--t-register) var(--ease-out),
    background-color var(--t-fast) var(--ease-out);
}

.is-agent .knob {
  transform: translateX(100%);
  background: var(--blue);
}

.option {
  position: relative;
  z-index: 1;
  min-width: 58px;
  padding: 0 12px;
  border: 0;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
  cursor: pointer;
  transition: color var(--t-fast) var(--ease-out);
}

.option.is-on {
  color: #fff;
}

.option:disabled {
  cursor: not-allowed;
}

.is-disabled {
  opacity: 0.45;
}
</style>
