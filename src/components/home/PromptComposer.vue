<script setup lang="ts">
/**
 * 首页需求输入组件
 * 承载用户需求输入、快捷键提交、字数限制统计、预设需求切换与草稿还原。
 */
import { computed, onUnmounted, ref } from 'vue'
import {
  ArrowRightOutlined,
  ArrowUpOutlined,
  LoadingOutlined,
  UndoOutlined,
} from '@ant-design/icons-vue'
import AgentSwitch from '@/components/AgentSwitch.vue'
import type { PromptOptimizationVO } from '@/api/promptController'
import { PRESETS, type PresetKey } from './presets'

const props = withDefaults(
  defineProps<{
    modelValue: string
    agent: boolean
    submitting: boolean
    optimizing?: boolean
    optimization?: PromptOptimizationVO | null
    activePreset: PresetKey | null
    hasDraft?: boolean
    /** 自动演示正在输入的内容；null 表示非演示态 */
    demoText?: string | null
    /** 自动演示当前对应的预设 key */
    demoPreset?: PresetKey | null
    /** 是否需要登录提示 */
    needsLogin?: boolean
  }>(),
  {
    hasDraft: false,
    demoText: null,
    demoPreset: null,
    needsLogin: false,
    optimizing: false,
    optimization: null,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'update:agent', val: boolean): void
  (e: 'preset', key: PresetKey): void
  (e: 'preview', key: PresetKey | null): void
  (e: 'restoreDraft'): void
  (e: 'submit'): void
  (e: 'optimize'): void
  (e: 'applyOptimization'): void
  (e: 'cancelOptimization'): void
}>()

const optimizationSections = computed(() =>
  [
    { title: '默认假设', items: props.optimization?.assumptions },
    { title: '待补充问题', items: props.optimization?.questions },
    { title: '依赖说明', items: props.optimization?.requiredDependencies },
  ]
    .map((section) => ({ ...section, items: section.items?.filter((item) => item.trim()) ?? [] }))
    .filter((section) => section.items.length),
)

const canApplyOptimization = computed(() => {
  const text = props.optimization?.optimizedPrompt.trim()
  return Boolean(text && text.length <= 5000)
})

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isInvalid = ref(false)
let invalidTimer: ReturnType<typeof setTimeout> | null = null

onUnmounted(() => {
  if (invalidTimer) clearTimeout(invalidTimer)
})

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
  if (e.isComposing) return
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    emit('submit')
  }
}

const dismissOptimization = () => {
  emit('cancelOptimization')
  textareaRef.value?.focus()
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
        maxlength="5000"
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
          v-if="modelValue.length > 4000"
          class="composer-counter tabular"
          :class="{ 'is-limit': modelValue.length >= 4900 }"
        >
          {{ modelValue.length }}/5000{{ modelValue.length >= 5000 ? ' · 已到上限' : '' }}
        </span>
        <!-- 读屏只在跨过阈值时播报一次，不随每个字重复 -->
        <span class="sr-only" aria-live="polite">{{
          modelValue.length >= 5000
            ? '已到 5000 字上限'
            : modelValue.length >= 4900
              ? '接近 5000 字上限'
              : ''
        }}</span>
        <div class="composer-actions">
          <span class="composer-hint">
            <kbd>{{ modKey }}</kbd
            ><kbd>Enter</kbd> 生成
          </span>
          <a-tooltip
            :title="optimizing ? '正在帮你整理需求' : '优化提示词'"
            :trigger="['hover', 'focus']"
            :mouse-enter-delay="0.4"
          >
            <button
              type="button"
              class="btn composer-optimize"
              :disabled="optimizing || submitting"
              :aria-busy="optimizing"
              :aria-label="optimizing ? '正在优化提示词' : '优化提示词'"
              @click="emit('optimize')"
            >
              <LoadingOutlined v-if="optimizing" aria-hidden="true" />
              <svg
                v-else
                class="optimize-spark"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path
                  d="M10 5c1.2 4.6 2.4 5.8 7 7-4.6 1.2-5.8 2.4-7 7-1.2-4.6-2.4-5.8-7-7 4.6-1.2 5.8-2.4 7-7Z"
                />
                <path d="M19 2v6m-3-3h6" />
              </svg>
              <span>优化</span>
            </button>
          </a-tooltip>
          <button
            type="submit"
            class="btn btn--pink btn--lg composer-submit"
            :disabled="submitting || optimizing"
          >
            <LoadingOutlined v-if="submitting" aria-hidden="true" />
            <span>{{ submitting ? '正在创建' : '生成' }}</span>
            <ArrowRightOutlined v-if="!submitting" aria-hidden="true" />
          </button>
        </div>
      </div>
    </form>

    <p v-if="needsLogin" class="login-note">优化或生成前需要登录，你写的这句话会一直保留。</p>

    <span class="sr-only" role="status">{{
      optimizing
        ? '正在帮你整理需求'
        : optimization
          ? canApplyOptimization
            ? '整理好了一版，请查看后决定是否使用'
            : '还需要补充一些想法，请查看下面的问题'
          : ''
    }}</span>
    <div v-if="optimizing" class="optimization-wait">
      <div class="optimization-wait-copy">
        <strong>正在帮你把想法理顺</strong>
        <p class="optimization-note">你可以继续写，结果出来再决定用不用。</p>
      </div>
      <button type="button" class="btn btn--quiet btn--sm" @click="dismissOptimization">
        取消优化
      </button>
    </div>
    <section v-else-if="optimization" class="optimization" aria-label="优化结果">
      <h2 class="optimization-title">
        {{ canApplyOptimization ? '帮你理顺了一版' : '还差一点你的想法' }}
      </h2>
      <p v-if="canApplyOptimization" class="optimization-note">先看看，合你心意再用。</p>
      <p
        v-if="optimization.optimizedPrompt.trim()"
        class="optimization-prompt"
        tabindex="0"
        aria-label="优化后的提示词"
      >
        {{ optimization.optimizedPrompt }}
      </p>
      <p v-else class="optimization-note">
        不用一次想周全。把下面的问题补进输入里，再点一次“优化提示词”就好。
      </p>
      <div v-if="optimizationSections.length" class="optimization-details">
        <div
          v-for="section in optimizationSections"
          :key="section.title"
          class="optimization-section"
        >
          <h3>{{ section.title }}</h3>
          <ul>
            <li v-for="(item, index) in section.items" :key="index">{{ item }}</li>
          </ul>
        </div>
      </div>
      <p class="optimization-note">
        {{
          canApplyOptimization
            ? '采用会替换当前输入。可以再改改，满意了再点“生成”。'
            : '你已经写的内容会保留，慢慢补充就好。'
        }}
      </p>
      <div class="optimization-actions">
        <button type="button" class="btn btn--quiet" @click="dismissOptimization">
          {{ canApplyOptimization ? '先不采用' : '去补充' }}
        </button>
        <button
          type="button"
          class="btn btn--ink"
          :disabled="!canApplyOptimization || submitting"
          @click="emit('applyOptimization')"
        >
          <ArrowUpOutlined aria-hidden="true" />
          使用此提示词
        </button>
      </div>
    </section>

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
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  padding: 10px 10px 10px 14px;
}

.composer-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-left: auto;
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

.composer-optimize {
  flex-shrink: 0;
  gap: 6px;
  height: 44px;
  padding: 0 12px;
  background: var(--paper-2);
  color: var(--ink-2);
  font-size: 13px;
}

.composer-optimize:hover:not(:disabled) {
  background: var(--paper-3);
  color: var(--ink);
}

.composer-optimize:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 3px;
}

.optimize-spark,
.composer-optimize :deep(.anticon) {
  width: 20px;
  height: 20px;
  font-size: 20px;
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

.optimization {
  padding: 20px;
  border: 1px solid var(--ink);
  border-radius: var(--radius);
  background: var(--sheet);
  overflow-wrap: anywhere;
}

.optimization-title {
  position: relative;
  isolation: isolate;
  width: fit-content;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 400;
  line-height: 1.3;
}

/* 沿用首页的黄色叠印，只在新结果出现时划过一次。 */
.optimization-title::before {
  content: '';
  position: absolute;
  inset: 0 -5px;
  z-index: -1;
  background: var(--yellow);
  animation: optimization-proof-mark 320ms var(--ease-out);
}

@keyframes optimization-proof-mark {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .optimization-title::before {
    animation: none;
  }
}

.optimization-prompt {
  max-height: 320px;
  margin-top: 16px;
  overflow-y: auto;
  white-space: pre-wrap;
  line-height: 1.7;
}

.optimization-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--rule);
}

.optimization-section {
  font-size: 14px;
  color: var(--ink-2);
}

.optimization-section + .optimization-section {
  margin-top: 14px;
}

.optimization-section h3 {
  margin-bottom: 4px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 700;
}

.optimization-section ul {
  margin: 0;
  padding-left: 20px;
  list-style: disc;
}

.optimization-note {
  margin-top: 12px;
  font-size: 13px;
  color: var(--ink-2);
}

.optimization-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.optimization-wait {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-block: 4px;
}

.optimization-wait-copy {
  flex: 1;
  min-width: 0;
}

.optimization-wait-copy strong {
  font-size: 14px;
}

.optimization-wait-copy .optimization-note {
  margin-top: 4px;
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
  .optimization {
    padding: 18px;
  }

  .optimization-title {
    font-size: 22px;
  }

  .composer-hint {
    display: none;
  }

  .mode-note {
    display: none;
  }

  .composer-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .composer-counter {
    margin-left: auto;
  }
}
</style>
