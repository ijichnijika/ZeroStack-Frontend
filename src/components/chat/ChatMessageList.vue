<script setup lang="ts">
import MarkdownViewer from '@/components/MarkdownViewer.vue'
import BrandMark from '@/components/BrandMark.vue'
import ThinkingBlock from '@/components/chat/ThinkingBlock.vue'
import type { ChatMessage } from '@/composables/useChatHistory'

interface Segment {
  type: 'thinking' | 'text'
  content: string
}

const props = defineProps<{
  messages: ChatMessage[]
  generating: boolean
  historyLoading: boolean
  hasMoreHistory: boolean
}>()

const emit = defineEmits<{
  (e: 'loadMore'): void
}>()

/**
 * 将 AI 回复拆成「思考块」与「正文」交错的段落；
 * 兼容流式生成中 <think> 尚未闭合的情况。
 */
function parseSegments(content: string): Segment[] {
  const segments: Segment[] = []
  let remaining = content || ''

  while (remaining.length > 0) {
    const start = remaining.indexOf('<think>')
    if (start === -1) {
      const t = remaining.trim()
      if (t) segments.push({ type: 'text', content: t })
      break
    }
    const before = remaining.slice(0, start).trim()
    if (before) segments.push({ type: 'text', content: before })

    const afterOpen = remaining.slice(start + '<think>'.length)
    const end = afterOpen.indexOf('</think>')
    const body = (end === -1 ? afterOpen : afterOpen.slice(0, end)).trim()
    if (body) segments.push({ type: 'thinking', content: body })
    if (end === -1) break
    remaining = afterOpen.slice(end + '</think>'.length)
  }

  return segments
}

const isLiveMessage = (index: number) => props.generating && index === props.messages.length - 1

/** 历史里可能带上点选修改时追加的内部上下文，展示时只留用户原话 */
function displayUserText(content: string) {
  const cut = content.search(/\n+\s*---\s*\n【用户在页面中选中/)
  return (cut === -1 ? content : content.slice(0, cut)).trim()
}
</script>

<template>
  <div class="message-list">
    <div v-if="hasMoreHistory" class="load-more">
      <button type="button" class="btn btn--quiet btn--sm" :disabled="historyLoading" @click="emit('loadMore')">
        {{ historyLoading ? '加载中…' : '查看更早的对话' }}
      </button>
    </div>

    <div v-if="!historyLoading && messages.length === 0" class="list-empty">
      <p>还没有对话。在下面描述你想要的网站，或者告诉 AI 要怎么修改。</p>
    </div>

    <template v-for="(msg, index) in messages" :key="msg.id ?? `m-${index}`">
      <div v-if="msg.role === 'user'" class="msg msg-user">
        <p class="user-text">{{ displayUserText(msg.content) }}</p>
      </div>

      <div v-else class="msg msg-ai">
        <BrandMark class="ai-mark" :size="24" :drifting="isLiveMessage(index)" />
        <div class="ai-body">
          <p v-if="isLiveMessage(index) && !msg.content" class="waiting" role="status">
            正在理解你的需求，第一段内容马上出现…
          </p>
          <template v-else>
            <template v-for="(seg, sIdx) in parseSegments(msg.content)" :key="sIdx">
              <ThinkingBlock
                v-if="seg.type === 'thinking'"
                :content="seg.content"
                :streaming="isLiveMessage(index) && sIdx === parseSegments(msg.content).length - 1"
              />
              <MarkdownViewer v-else :content="seg.content" />
            </template>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.message-list {
  display: flex;
  flex-direction: column;
  gap: 26px;
  padding: 28px 24px 32px;
}

.load-more {
  display: flex;
  justify-content: center;
}

.list-empty {
  padding: 40px 8px;
  color: var(--ink-3);
  font-size: 14px;
}

.msg-user {
  display: flex;
  justify-content: flex-end;
  padding-left: 40px;
}

.user-text {
  max-width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-lg) var(--radius-lg) 2px var(--radius-lg);
  background: var(--yellow);
  font-size: 15px;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.msg-ai {
  display: flex;
  gap: 12px;
  min-width: 0;
}

.ai-mark {
  margin-top: 2px;
}

.ai-body {
  flex: 1;
  min-width: 0;
}

.waiting {
  color: var(--ink-3);
  font-size: 14px;
}
</style>
