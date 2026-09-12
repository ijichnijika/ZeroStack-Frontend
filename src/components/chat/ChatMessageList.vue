<script setup lang="ts">
import { ref } from 'vue'
import { LoadingOutlined, RobotOutlined } from '@ant-design/icons-vue'
import MarkdownViewer from '@/components/MarkdownViewer.vue'

const userCollapsedKeys = ref<Set<string>>(new Set())

const getThinkingKey = (msg: ChatMessage, index: number, sIdx: number) => {
  const base = msg.id !== undefined ? `id-${msg.id}` : `idx-${index}`
  return `${base}-${sIdx}`
}

const isThinkingExpanded = (key: string) => !userCollapsedKeys.value.has(key)

const handleCollapseChange = (key: string, activeKeys: string[] | string) => {
  const isExpanded = Array.isArray(activeKeys) ? activeKeys.length > 0 : Boolean(activeKeys)
  if (isExpanded) {
    userCollapsedKeys.value.delete(key)
  } else {
    userCollapsedKeys.value.add(key)
  }
}

/** 消息对象结构 */
export interface ChatMessage {
  id?: number | string
  role: 'user' | 'ai'
  content: string
  createTime?: string
}

/** 解析后的消息段（思考块 or 正文） */
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
 * 将 AI 回复内容解析为「思考块」与「正文」交错的段落序列
 *
 * 为何这样处理：部分模型返回 <think>...</think> 标签包裹的推理过程，
 * 需要将其与正文分离并以折叠块形式展示，同时兼容流式生成中未闭合的情况。
 */
function parseMessageContent(content: string): { segments: Segment[] } {
  if (!content) return { segments: [] }

  const segments: Segment[] = []
  let remaining = content

  while (remaining.length > 0) {
    const thinkStart = remaining.indexOf('<think>')

    if (thinkStart === -1) {
      // 无更多 <think>，剩余全部为正文
      const t = remaining.trim()
      if (t) segments.push({ type: 'text', content: t })
      break
    }

    // <think> 之前的内容归为正文
    if (thinkStart > 0) {
      const t = remaining.slice(0, thinkStart).trim()
      if (t) segments.push({ type: 'text', content: t })
    }

    const afterOpen = remaining.slice(thinkStart + '<think>'.length)
    const thinkEnd = afterOpen.indexOf('</think>')

    if (thinkEnd !== -1) {
      // 正常闭合的思考块
      const t = afterOpen.slice(0, thinkEnd).trim()
      if (t) segments.push({ type: 'thinking', content: t })
      remaining = afterOpen.slice(thinkEnd + '</think>'.length)
    } else {
      // 未闭合（流式生成中）：剩余内容为正在进行的思考
      const t = afterOpen.trim()
      if (t) segments.push({ type: 'thinking', content: t })
      break
    }
  }

  return { segments }
}
</script>

<template>
  <div class="messages-area">
    <!-- 加载更多历史记录 -->
    <div v-if="hasMoreHistory" class="load-more-wrapper">
      <a-button type="link" :loading="historyLoading" @click="emit('loadMore')">加载更多</a-button>
    </div>

    <!-- 消息列表 -->
    <div v-for="(msg, index) in messages" :key="index" :class="['message-row', msg.role]">
      <!-- AI 头像 -->
      <div v-if="msg.role === 'ai'" class="avatar ai-avatar">
        <img src="@/assets/logo.png" alt="AI 助手" width="28" height="28" />
      </div>

      <!-- 气泡主体 -->
      <div class="message-bubble">
        <!-- 流式生成中、内容为空时显示 loading 占位 -->
        <div
          v-if="msg.role === 'ai' && generating && index === messages.length - 1 && !msg.content"
          class="typing-indicator"
          role="status"
          aria-live="polite"
        >
          <LoadingOutlined aria-hidden="true" /> 正在生成您的应用，这可能需要一点时间…
        </div>

        <!-- AI 消息：思考块 + 正文交错渲染 -->
        <template v-else-if="msg.role === 'ai'">
          <template
            v-for="(seg, sIdx) in parseMessageContent(msg.content).segments"
            :key="sIdx"
          >
            <!-- 思考块折叠面板 -->
            <div v-if="seg.type === 'thinking'" class="thinking-block">
              <a-collapse
                :activeKey="isThinkingExpanded(getThinkingKey(msg, index, sIdx)) ? ['thinking'] : []"
                @change="(keys: any) => handleCollapseChange(getThinkingKey(msg, index, sIdx), keys)"
                :bordered="false"
                ghost
              >
                <a-collapse-panel key="thinking">
                  <template #header>
                    <span class="thinking-header">
                      <RobotOutlined aria-hidden="true" /> 推理与思考过程
                      <!-- 最后一段且仍在生成中（未收到 </think>）时显示 loading -->
                      <LoadingOutlined
                        v-if="generating && index === messages.length - 1 && sIdx === parseMessageContent(msg.content).segments.length - 1"
                        class="thinking-loading"
                        aria-hidden="true"
                      />
                    </span>
                  </template>
                  <div class="thinking-inner">
                    <MarkdownViewer :content="seg.content" />
                  </div>
                </a-collapse-panel>
              </a-collapse>
            </div>

            <!-- 正文段：Markdown 渲染 -->
            <MarkdownViewer v-else-if="seg.content" :content="seg.content" />
          </template>
        </template>

        <!-- 用户消息：纯文本 -->
        <div v-else class="user-text">{{ msg.content }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.messages-area {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
}

.load-more-wrapper {
  text-align: center;
  margin-bottom: 8px;
}

.message-row {
  display: flex;
  gap: 12px;
  max-width: 100%;
  min-width: 0;
}

.message-row.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ai-avatar {
  background: #f1f5f9;
  padding: 3px;
}

.message-bubble {
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  max-width: calc(100% - 44px);
  min-width: 0;
}

/* 用户消息气泡 */
.message-row.user .message-bubble {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #ffffff;
  padding: 12px 18px;
  border-radius: 18px;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

/* AI 消息文本 */
.message-row.ai .message-bubble {
  background: transparent;
  padding: 2px 4px;
  color: #0f172a;
}

/* 思考过程区域 */
.thinking-block {
  margin: 8px 0 16px 0;
  border-left: 2px solid #a5b4fc;
  padding-left: 12px;
  transition: border-color 0.2s ease;
}

.thinking-block:hover {
  border-left-color: #6366f1;
}

.thinking-block :deep(.ant-collapse) {
  background: transparent;
}

.thinking-block :deep(.ant-collapse-header) {
  padding: 4px 0 !important;
  color: #64748b;
  font-size: 12px;
}

.thinking-block :deep(.ant-collapse-content > .ant-collapse-content-box) {
  padding: 6px 0 0 0;
}

.thinking-header {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  letter-spacing: 0.2px;
}

.thinking-loading {
  margin-left: 8px;
  color: #4f46e5;
}

.thinking-inner {
  padding: 4px 0 8px 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.6;
}

.thinking-inner :deep(*) {
  font-size: 13px !important;
  color: #475569 !important;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #4f46e5;
  font-size: 13px;
  padding: 6px 0;
}
</style>
