<script setup lang="ts">
import { ref } from 'vue'
import { DownOutlined } from '@ant-design/icons-vue'
import MarkdownViewer from '@/components/MarkdownViewer.vue'

defineProps<{
  content: string
  streaming: boolean
}>()

const open = ref(false)
</script>

<template>
  <div class="thinking" :class="{ 'is-open': open, 'is-streaming': streaming }">
    <button type="button" class="thinking-head" :aria-expanded="open" @click="open = !open">
      <span class="thinking-dot" aria-hidden="true"></span>
      <span class="thinking-label">{{ streaming ? '正在思考' : '思考过程' }}</span>
      <span class="thinking-count tabular">{{ content.length.toLocaleString() }} 字</span>
      <DownOutlined class="thinking-caret" aria-hidden="true" />
    </button>
    <div v-show="open" class="thinking-body">
      <MarkdownViewer :content="content" />
    </div>
  </div>
</template>

<style scoped>
.thinking {
  margin: 4px 0 12px;
}

.thinking-head {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--pill);
  background: var(--paper-2);
  font-size: 13px;
  color: var(--ink-2);
  cursor: pointer;
  transition: background-color var(--t-fast) var(--ease-out);
}

.thinking-head:hover {
  background: var(--paper-3);
}

.thinking-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--blue);
  transition: transform var(--t-fast) var(--ease-out), background-color var(--t-fast) var(--ease-out);
}

.thinking-head:hover .thinking-dot {
  transform: scale(1.15);
}

.is-streaming .thinking-dot {
  background: var(--pink);
  animation: think-pulse 1.1s var(--ease-in-out) infinite;
}

@keyframes think-pulse {
  50% {
    transform: scale(0.55);
  }
}

.thinking-label {
  font-weight: 600;
}

.thinking-count {
  color: var(--ink-3);
}

.thinking-caret {
  font-size: 10px;
  transition: transform var(--t-fast) var(--ease-out);
}

.is-open .thinking-caret {
  transform: rotate(180deg);
}

.thinking-body {
  margin-top: 10px;
  padding: 4px 0 4px 16px;
  border-left: 1.5px solid var(--rule);
  max-height: 360px;
  overflow-y: auto;
  transition: border-color var(--t-fast) var(--ease-out);
}

.is-streaming .thinking-body {
  border-left-color: var(--pink);
}

.thinking-body :deep(.markdown-body) {
  font-size: 13.5px;
  color: var(--ink-2);
}
</style>
