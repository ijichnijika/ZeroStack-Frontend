<script setup lang="ts">
/**
 * 首页需求输入组件
 * 承载用户需求输入、快捷键提交、字数限制统计、预设需求切换与草稿还原。
 */
import { ref } from 'vue'
import { ArrowRightOutlined, LoadingOutlined, UndoOutlined } from '@ant-design/icons-vue'
import AgentSwitch from '@/components/AgentSwitch.vue'
import { PRESETS, type PresetKey } from './presets'

withDefaults(
  defineProps<{
    modelValue: string
    agent: boolean
    submitting: boolean
    activePreset: PresetKey | null
    hasDraft?: boolean
    /** 自动演示正在输入的内容；null 表示非演示态 */
    demoText?: string | null
    /** 自动演示当前对应的预设 key */
    demoPreset?: PresetKey | null
    /** 是否需要登录提示 */
    needsLogin?: boolean
  }>(),
  { hasDraft: false, demoText: null, demoPreset: null, needsLogin: false },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'update:agent', val: boolean): void
  (e: 'preset', key: PresetKey): void
  (e: 'preview', key: PresetKey | null): void
  (e: 'restoreDraft'): void
  (e: 'submit'): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isInvalid = ref(false)
let invalidTimer: ReturnType<typeof setTimeout> | null = null

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const modKey = isMac ? '⌘' : 'Ctrl'

const triggerInvalid = () => {
  isInvalid.value = true
  if (invalidTimer) clearTimeout(invalidTimer)
  invalidTimer = setTimeout(() => {
    isInvalid.value = false
  }, 1200)
}

const handleInput = (e: Event) => {
  if (isInvalid.value) isInvalid.value = false
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    emit('submit')
  }
}

defineExpose({
  focus: () => textareaRef.value?.focus(),
  triggerInvalid,
})
</script>

<template>
  <div class="composer">
    <form
      class="composer-sheet"
      :class="{ 'is-invalid': isInvalid }"
      @submit.prevent="emit('submit')"
    >
      <label for="prompt-input" class="sr-only">描述你想要的网站</label>
      <textarea
        id="prompt-input"
        ref="textareaRef"
        :value="modelValue"
        rows="3"
        maxlength="2000"
        :aria-invalid="isInvalid"
        class="composer-input"
        :placeholder="
          demoText !== null
            ? `示例 ｜ ${demoText}`
            : '描述你想要的网站：给谁用、有哪些页面、想要什么感觉……'
        "
        @input="handleInput"
        @keydown="handleKeydown"
      ></textarea>

      <div class="composer-bar">
        <AgentSwitch :checked="agent" @update:checked="emit('update:agent', $event)" />
        <span class="mode-note">{{ agent ? '带素材与自检，更慢' : '快速出稿' }}</span>
        <span
          v-if="modelValue.length > 1600"
          class="composer-counter tabular"
          :class="{ 'is-limit': modelValue.length >= 1900 }"
        >
          {{ modelValue.length }}/2000{{ modelValue.length >= 2000 ? ' · 已到上限' : '' }}
        </span>
        <!-- 读屏只在跨过阈值时播报一次，不随每个字重复 -->
        <span class="sr-only" aria-live="polite">{{
          modelValue.length >= 2000 ? '已到 2000 字上限' : modelValue.length >= 1900 ? '接近 2000 字上限' : ''
        }}</span>
        <span class="composer-hint">
          <kbd>{{ modKey }}</kbd
          ><kbd>Enter</kbd> 生成
        </span>
        <button type="submit" class="btn btn--pink btn--lg composer-submit" :disabled="submitting">
          <LoadingOutlined v-if="submitting" />
          <span>{{ submitting ? '正在创建' : '生成' }}</span>
          <ArrowRightOutlined v-if="!submitting" />
        </button>
      </div>
    </form>

    <p v-if="needsLogin" class="login-note">生成前需要登录，你写的这句话会一直保留。</p>

    <div class="preset-row" role="group" aria-label="示例需求">
      <span class="preset-label">试试</span>
      <button
        v-for="p in PRESETS"
        :key="p.key"
        type="button"
        class="preset-chip"
        :class="{ 'is-active': activePreset === p.key, 'is-demo': demoPreset === p.key }"
        :aria-pressed="activePreset === p.key"
        @click="emit('preset', p.key)"
        @mouseenter="emit('preview', p.key)"
        @mouseleave="emit('preview', null)"
        @focus="emit('preview', p.key)"
        @blur="emit('preview', null)"
      >
        {{ p.label }}
      </button>

      <button
        v-if="hasDraft && activePreset"
        type="button"
        class="preset-chip restore-chip"
        title="还原点击预设前你自己输入的内容"
        @click="emit('restoreDraft')"
      >
        <UndoOutlined aria-hidden="true" />
        还原我的输入
      </button>
    </div>
  </div>
</template>

<style scoped>
.composer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.composer-sheet {
  background: var(--sheet);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius);
  outline: 6px solid transparent;
  transition: outline-color 240ms var(--ease-out);
}

/* 聚焦态：使用高对比度边框以确保键盘/鼠标聚焦的可识别度 */
.composer-sheet:focus-within {
  outline-color: var(--yellow-tint);
  box-shadow: inset 0 0 0 1.5px var(--ink);
}

.composer-sheet.is-invalid {
  border-color: var(--danger);
  outline-color: var(--danger) !important;
  animation: composer-shake 360ms var(--ease-out);
}

@keyframes composer-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-4px);
  }
  40%,
  80% {
    transform: translateX(4px);
  }
}

.composer-input {
  display: block;
  width: 100%;
  min-height: 108px;
  max-height: 200px;
  padding: 16px 18px 6px;
  border: 0;
  outline: none;
  resize: none;
  field-sizing: content;
  background: transparent;
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.65;
  color: var(--ink);
}

.composer-input::placeholder {
  color: var(--ink-3);
}

.composer-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 10px 10px 14px;
}

.mode-note {
  font-size: 12px;
  color: var(--ink-3);
  white-space: nowrap;
}

.composer-counter {
  font-size: 12px;
  color: var(--ink-3);
}

.composer-counter.is-limit {
  font-weight: 700;
  color: var(--danger);
}

.composer-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-size: 12px;
  color: var(--ink-3);
}

kbd {
  display: inline-block;
  min-width: 20px;
  padding: 2px 5px;
  border: 1px solid var(--rule);
  border-bottom-width: 2px;
  border-radius: 4px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  color: var(--ink-2);
  background: var(--paper);
}

.composer-submit {
  min-width: 118px;
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.preset-label {
  margin-right: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-3);
}

.preset-chip {
  height: 32px;
  padding: 0 14px;
  border: 1.5px solid rgba(23, 23, 26, 0.5);
  border-radius: var(--pill);
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
  cursor: pointer;
  transition:
    border-color var(--t-fast) var(--ease-out),
    background-color var(--t-fast) var(--ease-out),
    color var(--t-fast) var(--ease-out);
}

.preset-chip:hover {
  border-color: var(--ink);
  color: var(--ink);
}

/* 自动演示高亮标签：使用虚线描边区别于已选中的实色背景态 */
.preset-chip.is-demo:not(.is-active) {
  border-style: dashed;
  border-color: var(--ink);
  color: var(--ink);
}

.login-note {
  margin-top: -4px;
  font-size: 12px;
  color: var(--ink-3);
}

/* 触控设备无障碍优化：最小可点击高度 44px */
@media (pointer: coarse) {
  .preset-chip {
    height: 44px;
  }
}

.preset-chip.is-active {
  border-color: var(--ink);
  background: var(--ink);
  color: #fff;
}

@media (max-width: 560px) {
  .composer-hint {
    display: none;
  }

  .composer-submit {
    margin-left: auto;
    min-width: 0;
  }
}
</style>
