<script setup lang="ts">
/**
 * ChatMessageList — 聊天消息列表区域
 *
 * 职责：渲染消息气泡列表，包含：
 * - 「加载更多」历史记录按钮
 * - 用户消息气泡 / AI 消息气泡（含思考块 + Markdown 正文）
 * - 流式生成中的 loading 状态气泡
 *
 * 从 AppChatPage.vue 拆出，解耦消息渲染与输入逻辑。
 * 父组件通过 ref="messagesContainer" 控制滚动，这里暴露容器 ref。
 */
import { LoadingOutlined, RobotOutlined } from '@ant-design/icons-vue'
import MarkdownViewer from '@/components/MarkdownViewer.vue'

/** 消息对象结构 */
export interface ChatMessage {
  id?: number
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
        <img src="@/assets/logo.png" alt="ai" />
      </div>

      <!-- 气泡主体 -->
      <div class="message-bubble">
        <!-- 流式生成中、内容为空时显示 loading 占位 -->
        <div
          v-if="msg.role === 'ai' && generating && index === messages.length - 1 && !msg.content"
          class="typing-indicator"
        >
          <LoadingOutlined /> 正在生成您的应用，这可能需要一点时间...
        </div>

        <!-- AI 消息：思考块 + 正文交错渲染 -->
        <template v-else-if="msg.role === 'ai'">
          <template
            v-for="(seg, sIdx) in parseMessageContent(msg.content).segments"
            :key="sIdx"
          >
            <!-- 思考块：以折叠面板展示 -->
            <div v-if="seg.type === 'thinking'" class="thinking-block">
              <a-collapse :bordered="false" ghost>
                <a-collapse-panel :key="String(sIdx)">
                  <template #header>
                    <span class="thinking-header">
                      <RobotOutlined /> AI思考过程
                      <!-- 最后一段且仍在生成中（未收到 </think>）时显示 loading -->
                      <LoadingOutlined
                        v-if="generating && index === messages.length - 1 && sIdx === parseMessageContent(msg.content).segments.length - 1"
                        class="thinking-loading"
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
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  width: 32px;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ai-avatar {
  background: #f0f7ff;
  padding: 4px;
}

.message-bubble {
  background: #f5f5f5;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  word-wrap: break-word;
  max-width: calc(100% - 44px);
  min-width: 0;
}

.message-row.user .message-bubble {
  background: #1890ff;
  color: #ffffff;
  border-top-right-radius: 4px;
}

.message-row.ai .message-bubble {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-top-left-radius: 4px;
}

.thinking-block {
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.thinking-block :deep(.ant-collapse) {
  background: transparent;
}

.thinking-block :deep(.ant-collapse-header) {
  padding: 8px 12px !important;
  color: #888;
}

.thinking-block :deep(.ant-collapse-content > .ant-collapse-content-box) {
  padding: 0;
}

.thinking-header {
  font-size: 13px;
  color: #888;
}

.thinking-loading {
  margin-left: 8px;
}

.thinking-inner {
  padding: 0 12px 12px 12px;
  color: #666;
  font-size: 13px;
}

.thinking-inner :deep(*) {
  font-size: 13px !important;
  color: #666 !important;
}

.typing-indicator {
  color: #1890ff;
}
</style>
