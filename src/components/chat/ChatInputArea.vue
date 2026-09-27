<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ArrowUpOutlined, AimOutlined, CloseOutlined } from '@ant-design/icons-vue'
import AgentSwitch from '@/components/AgentSwitch.vue'
import type { SelectedElementInfo } from '@/utils/useVisualEditor'

const props = defineProps<{
  chatInput: string
  generating: boolean
  isCreator: boolean
  useAgent: boolean
  isEditMode: boolean
  selectedElement: SelectedElementInfo | null
  hasPreview: boolean
}>()

const emit = defineEmits<{
  (e: 'update:chatInput', val: string): void
  (e: 'update:useAgent', val: boolean): void
  (e: 'send'): void
  (e: 'stop'): void
  (e: 'toggleEditMode'): void
  (e: 'clearSelectedElement'): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

const placeholder = computed(() => {
  if (!props.isCreator) return '这是别人的作品，只能查看，不能继续对话'
  if (props.selectedElement) return '说说这个元素要怎么改，例如：换成深蓝色，字号再大一些'
  if (props.isEditMode) return '先在右侧预览里点选一个元素'
  return '继续描述要修改的地方，或提出新的需求'
})

const canSend = computed(() => props.isCreator && !props.generating && props.chatInput.trim().length > 0)

const elementLabel = computed(() => {
  const el = props.selectedElement
  if (!el) return ''
  const cls = el.className ? `.${el.className.split(' ')[0]}` : ''
  const id = el.id ? `#${el.id}` : ''
  return `<${el.tagName}${id}${cls}>`
})

const autoGrow = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`
}

watch(
  () => props.chatInput,
  () => nextTick(autoGrow),
)

watch(
  () => props.selectedElement,
  (val) => {
    if (val) nextTick(() => textareaRef.value?.focus())
  },
)

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    if (canSend.value) emit('send')
  }
}
</script>

<template>
  <div class="input-area">
    <div v-if="selectedElement" class="picked">
      <span class="picked-dot" aria-hidden="true"></span>
      <span class="picked-text">
        只修改 <code>{{ elementLabel }}</code>
        <span v-if="selectedElement.textContent" class="picked-snippet">“{{ selectedElement.textContent }}”</span>
      </span>
      <button type="button" class="picked-clear" aria-label="取消选中元素" @click="emit('clearSelectedElement')">
        <CloseOutlined />
      </button>
    </div>

    <div class="input-sheet" :class="{ 'is-disabled': !isCreator }">
      <label for="chat-input" class="sr-only">输入修改需求</label>
      <textarea
        id="chat-input"
        ref="textareaRef"
        :value="chatInput"
        rows="2"
        :placeholder="placeholder"
        :disabled="generating || !isCreator"
        class="chat-textarea"
        @input="emit('update:chatInput', ($event.target as HTMLTextAreaElement).value)"
        @keydown="handleKeydown"
      ></textarea>

      <div class="input-bar">
        <AgentSwitch
          :checked="useAgent"
          :disabled="isEditMode || !isCreator || generating"
          :disabled-reason="isEditMode ? '点选修改时只针对单个元素，不使用 Agent 模式' : ''"
          @update:checked="emit('update:useAgent', $event)"
        />

        <a-tooltip :title="hasPreview ? '在预览中点选一个元素，只修改它' : '生成预览后可用'">
          <button
            type="button"
            class="pick-btn"
            :class="{ 'is-on': isEditMode }"
            :aria-pressed="isEditMode"
            :disabled="!hasPreview || !isCreator || generating"
            @click="emit('toggleEditMode')"
          >
            <AimOutlined />
            <span>{{ isEditMode ? '退出点选' : '点选修改' }}</span>
          </button>
        </a-tooltip>

        <span class="send-hint">{{ isMac ? '⌘' : 'Ctrl' }} Enter</span>

        <button
          v-if="generating"
          type="button"
          class="send-btn is-stop"
          aria-label="停止生成"
          title="停止生成"
          :disabled="!isCreator"
          @click="emit('stop')"
        >
          <span class="stop-square" aria-hidden="true"></span>
        </button>
        <button
          v-else
          type="button"
          class="send-btn"
          aria-label="发送"
          title="发送"
          :disabled="!canSend"
          @click="emit('send')"
        >
          <ArrowUpOutlined />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-area {
  padding: 12px 20px 20px;
  background: var(--paper);
}

.picked {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px 8px 8px 14px;
  border-radius: var(--radius-lg);
  background: var(--pink-tint);
  font-size: 13px;
}

.picked-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pink);
  flex-shrink: 0;
}

.picked-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picked-text code {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
}

.picked-snippet {
  margin-left: 6px;
  color: var(--ink-3);
}

.picked-clear {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  color: var(--ink-2);
}

.picked-clear:hover {
  background: rgba(23, 23, 26, 0.08);
}

.input-sheet {
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-lg);
  background: var(--sheet);
  outline: 5px solid transparent;
  transition: outline-color 240ms var(--ease-out);
}

.input-sheet:focus-within {
  outline-color: var(--yellow);
}

.input-sheet.is-disabled {
  border-color: var(--rule);
  background: var(--paper-2);
}

.chat-textarea {
  display: block;
  width: 100%;
  min-height: 56px;
  max-height: 200px;
  padding: 14px 16px 4px;
  border: 0;
  outline: none;
  resize: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink);
}

.chat-textarea::placeholder {
  color: var(--ink-3);
}

.chat-textarea:disabled {
  cursor: not-allowed;
}

.input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 10px;
}

.pick-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 1.5px solid var(--rule);
  border-radius: var(--pill);
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
  cursor: pointer;
  transition:
    border-color var(--t-fast) var(--ease-out),
    background-color var(--t-fast) var(--ease-out);
}

.pick-btn:hover:not(:disabled) {
  border-color: var(--ink);
  color: var(--ink);
}

.pick-btn.is-on {
  border-color: var(--pink);
  background: var(--pink);
  color: var(--ink);
}

.pick-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.send-hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--ink-3);
  white-space: nowrap;
}

.send-btn {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: var(--ink);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition:
    background-color var(--t-fast) var(--ease-out),
    transform var(--t-fast) var(--ease-out);
}

.send-btn:hover:not(:disabled) {
  background: var(--blue);
}

.send-btn:disabled {
  background: var(--paper-3);
  color: var(--ink-3);
  cursor: not-allowed;
}

.send-btn.is-stop {
  background: var(--pink);
}

.send-btn.is-stop:hover:not(:disabled) {
  background: var(--op-pink-yellow);
}

.stop-square {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: var(--ink);
}

@media (max-width: 480px) {
  .send-hint {
    display: none;
  }

  .pick-btn > span:not(.anticon) {
    display: none;
  }

  .send-btn,
  .send-btn.is-stop {
    margin-left: auto;
  }
}
</style>
