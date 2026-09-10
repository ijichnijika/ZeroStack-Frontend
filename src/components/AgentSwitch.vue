<template>
  <button
    type="button"
    role="switch"
    :aria-checked="checked"
    :aria-disabled="disabled"
    :disabled="disabled"
    aria-label="Agent 模式切换开关"
    class="agent-switch-wrapper"
    :class="{ 'is-agent': checked, 'is-disabled': disabled }"
    @click="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
  >
    <!-- 滑块 -->
    <div class="slider" aria-hidden="true"></div>
    
    <!-- 选项文本 -->
    <span class="option normal" :class="{ 'active': !checked }">
      普通模式
    </span>
    <span class="option agent" :class="{ 'active': checked }">
      <svg class="sparkle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2L13.2 8.8L20 10L13.2 11.2L12 18L10.8 11.2L4 10L10.8 8.8L12 2Z" fill="currentColor"/>
      </svg>
      Agent
    </span>
  </button>
</template>

<script setup lang="ts">
const props = defineProps({
  checked: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:checked'])

const toggle = () => {
  if (props.disabled) return
  emit('update:checked', !props.checked)
}
</script>

<style scoped>
.agent-switch-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 160px;
  height: 34px;
  padding: 3px;
  cursor: pointer;
  user-select: none;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  font-family: inherit;
  outline: none;
}

.agent-switch-wrapper:hover:not(:disabled) {
  border-color: rgba(99, 102, 241, 0.35);
  background: rgba(255, 255, 255, 0.88);
}

.agent-switch-wrapper:focus-visible {
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #6366f1;
}

.agent-switch-wrapper.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 滑块 */
.slider {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  border-radius: 9999px;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, box-shadow 0.2s ease;
  z-index: 1;
}

/* 开启 Agent 时的滑块 */
.is-agent .slider {
  transform: translateX(100%);
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.45);
}

/* 选项文本容器 */
.option {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 50%;
  height: 100%;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  letter-spacing: 0.2px;
  transition: color 0.2s ease;
}

/* 普通模式选中状态 */
.option.normal.active {
  color: #0f172a;
  font-weight: 600;
}

/* Agent 模式开启时普通选项文字样式 */
.is-agent .option.normal {
  color: #64748b;
}

/* Agent 模式激活状态 */
.is-agent .option.agent.active {
  color: #ffffff;
  font-weight: 600;
}

/* 图标样式 */
.sparkle-icon {
  width: 13px;
  height: 13px;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.is-agent .sparkle-icon {
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
}

@media (prefers-reduced-motion: reduce) {
  .agent-switch-wrapper,
  .slider,
  .option,
  .sparkle-icon {
    transition: none !important;
  }
}
</style>
