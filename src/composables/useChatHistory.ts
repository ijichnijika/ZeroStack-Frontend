import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { listAppChatHistory } from '@/api/chatHistoryController'

/** 消息对象结构 */
export interface ChatMessage {
  id?: number | string
  role: 'user' | 'ai'
  content: string
  createTime?: string
}

const PAGE_SIZE = 10

/**
 * 应用对话历史：按 lastCreateTime 游标向前分页
 */
export function useChatHistory(appId: string) {
  const messages = ref<ChatMessage[]>([])
  const historyLoading = ref(false)
  const hasMoreHistory = ref(false)

  const loadHistory = async (lastCreateTime?: string) => {
    historyLoading.value = true
    try {
      const res = await listAppChatHistory({
        appId: appId as unknown as number,
        pageSize: PAGE_SIZE,
        lastCreateTime,
      })
      if (res.data.code === 0 && res.data.data?.records) {
        const records = res.data.data.records
        const formatted: ChatMessage[] = records
          .map((r) => ({
            id: r.id,
            role: r.messageType?.toLowerCase() === 'user' ? ('user' as const) : ('ai' as const),
            content: r.message || '',
            createTime: r.createTime,
          }))
          .sort((a, b) => new Date(a.createTime!).getTime() - new Date(b.createTime!).getTime())

        messages.value = lastCreateTime ? [...formatted, ...messages.value] : formatted
        hasMoreHistory.value = records.length >= PAGE_SIZE
      }
    } catch {
      message.error('加载对话记录失败')
    } finally {
      historyLoading.value = false
    }
  }

  const loadMore = () => {
    const first = messages.value[0]
    if (first) loadHistory(first.createTime)
  }

  return { messages, historyLoading, hasMoreHistory, loadHistory, loadMore }
}
