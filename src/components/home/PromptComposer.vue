<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRightOutlined, LoadingOutlined } from '@ant-design/icons-vue'
import AgentSwitch from '@/components/AgentSwitch.vue'
import { PRESETS, type PresetKey } from './presets'

defineProps<{
  modelValue: string
  agent: boolean
  submitting: boolean
  activePreset: PresetKey | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'update:agent', val: boolean): void
  (e: 'preset', key: PresetKey): void
  (e: 'submit'): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const modKey = isMac ? '⌘' : 'Ctrl'

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    emit('submit')
  }
}

defineExpose({
  focus: () => textareaRef.value?.focus(),
})
</script>

<template>
  <div class="composer">
    <form class="composer-sheet" @submit.prevent="emit('submit')">
      <label for="prompt-input" class="sr-only">描述你想要的网站</label>
      <textarea
        id="prompt-input"
        ref="textareaRef"
        :value="modelValue"
        rows="3"
        maxlength="2000"
        class="composer-input"
        placeholder="描述你想要的网站：给谁用、有哪些页面、想要什么感觉……"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @keydown="handleKeydown"
      ></textarea>

      <div class="composer-bar">
        <AgentSwitch :checked="agent" @update:checked="emit('update:agent', $event)" />
        <span class="composer-hint">
          <kbd>{{ modKey }}</kbd><kbd>Enter</kbd> 生成
        </span>
        <button type="submit" class="btn btn--pink btn--lg composer-submit" :disabled="submitting">
          <LoadingOutlined v-if="submitting" />
          <span>{{ submitting ? '正在创建' : '生成' }}</span>
          <ArrowRightOutlined v-if="!submitting" />
        </button>
      </div>
    </form>

    <div class="preset-row" role="group" aria-label="示例需求">
      <span class="preset-label">试试</span>
      <button
        v-for="p in PRESETS"
        :key="p.key"
        type="button"
        class="preset-chip"
        :class="{ 'is-active': activePreset === p.key }"
        :aria-pressed="activePreset === p.key"
        @click="emit('preset', p.key)"
      >
        {{ p.label }}
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

.composer-sheet:focus-within {
  outline-color: var(--yellow);
}

.composer-input {
  display: block;
  width: 100%;
  min-height: 108px;
  max-height: 320px;
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
  border: 1.5px solid var(--rule);
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
