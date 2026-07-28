<template>
  <div class="agent-switch-wrapper" @click="toggle" :class="{ 'is-agent': checked, 'is-disabled': disabled }">
    <!-- 液态玻璃底座 -->
    <div class="glass-backdrop"></div>
    
    <!-- 滑块 -->
    <div class="slider"></div>
    
    <!-- 文本选项 -->
    <div class="option normal" :class="{ 'active': !checked }">
      普通模式
    </div>
    <div class="option agent" :class="{ 'active': checked }">
      <svg class="sparkle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L13.2 8.8L20 10L13.2 11.2L12 18L10.8 11.2L4 10L10.8 8.8L12 2Z" fill="currentColor"/>
      </svg>
      Agent
    </div>
  </div>
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
  width: 170px;
  height: 36px;
  padding: 3px;
  cursor: pointer;
  user-select: none;
  border-radius: 20px;
  transition: transform 0.2s ease;
}

.agent-switch-wrapper:active:not(.is-disabled) {
  transform: scale(0.97);
}

.agent-switch-wrapper.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 底部液态玻璃材质 */
.glass-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background: rgba(235, 238, 245, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
    inset 0 1px 3px rgba(255, 255, 255, 0.6),
    inset 0 -1px 4px rgba(0, 0, 0, 0.02),
    0 4px 10px rgba(0, 0, 0, 0.03);
  z-index: 0;
}

.agent-switch-wrapper:hover .glass-backdrop {
  background: rgba(230, 235, 245, 0.55);
}

/* 悬浮滑块 */
.slider {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 
    0 3px 8px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04),
    inset 0 1px 1px rgba(255, 255, 255, 1);
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s ease, box-shadow 0.4s ease;
  z-index: 1;
}

/* 开启 Agent 时的流光滑块 */
.is-agent .slider {
  transform: translateX(100%);
  background: linear-gradient(135deg, rgba(43, 116, 255, 0.9) 0%, rgba(133, 45, 226, 0.9) 100%);
  box-shadow: 
    0 4px 12px rgba(69, 93, 255, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.4);
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
  font-size: 13px;
  font-weight: 600;
  color: #8c92a4;
  letter-spacing: 0.2px;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

/* 普通模式高亮 */
.option.normal.active {
  color: #1a1a1a;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* Agent模式开启时，普通文字变灰 */
.is-agent .option.normal {
  color: #8c92a4;
  text-shadow: none;
}

/* Agent模式高亮 */
.is-agent .option.agent.active {
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 星星图标 */
.sparkle-icon {
  width: 14px;
  height: 14px;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

.is-agent .sparkle-icon {
  opacity: 1;
  animation: pulse-sparkle 2s infinite ease-in-out;
}

@keyframes pulse-sparkle {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}
</style>
