import { onBeforeUnmount, ref, type Ref } from 'vue'
import { message } from 'ant-design-vue'
import { API_BASE_URL } from '@/config/env'
import { stopAppGenCode } from '@/api/appController'
import { postEventStream } from '@/utils/postEventStream'
import type { ChatMessage } from '@/composables/useChatHistory'

interface Options {
  appId: string
  messages: Ref<ChatMessage[]>
  useAgent: Ref<boolean>
  /** 每收到一段流式内容 */
  onChunk?: () => void
  /** Agent 写入/修改了某个文件 */
  onCodeUpdate?: (filePath: string) => void
  /** 生成结束（正常完成或中断） */
  onFinish?: () => void | Promise<void>
}

/**
 * 代码生成 SSE 流
 *
 * Agent 模式下 d 字段是 JSON 字符串（WorkflowProgressMessage），
 * 普通模式下是纯文本流，需要分别解析再追加到消息内容。
 */
export function useCodeGeneration(options: Options) {
  const { appId, messages, useAgent } = options
  const generating = ref(false)
  const codeFiles = ref<Map<string, string>>(new Map())
  const activeCodeFile = ref('')
  let controller: AbortController | null = null
  onBeforeUnmount(() => controller?.abort())

  const appendChunk = (target: ChatMessage, dataStr: string) => {
    try {
      const parsed = JSON.parse(dataStr)
      if (parsed.d === undefined) {
        target.content += dataStr
        return
      }
      try {
        const d = JSON.parse(parsed.d)
        if (d.type === 'code_reset') {
          target.content = ''
          codeFiles.value.clear()
          activeCodeFile.value = ''
        } else if (d.type === 'code_update') {
          target.content += d.summary || ''
          const filePath = d.filePath as string
          if (d.toolName === 'writeFile') {
            codeFiles.value.set(filePath, d.content || '')
          } else if (d.toolName === 'modifyFile') {
            const existing = codeFiles.value.get(filePath) || ''
            codeFiles.value.set(filePath, existing.replace(d.oldContent || '', d.newContent || ''))
          }
          activeCodeFile.value = filePath
          options.onCodeUpdate?.(filePath)
        } else if (d.type === 'workflow_progress') {
          const icon =
            d.stepNumber === -1
              ? '❌'
              : d.stepName === '完成'
                ? '🎉'
                : d.stepNumber === 0
                  ? '🚀'
                  : '✅'
          target.content += `\n> ${icon} **[${d.stepName}]** ${d.message}\n\n`
        } else if (d.type === 'ai_response' || d.type === 'ai_thinking') {
          target.content += d.data || ''
        } else {
          target.content += parsed.d
        }
      } catch {
        target.content += parsed.d
      }
    } catch {
      target.content +=
        dataStr.startsWith('"') && dataStr.endsWith('"') ? JSON.parse(dataStr) : dataStr
    }
  }

  const generate = async (text: string) => {
    if (generating.value) return
    generating.value = true
    const requestController = new AbortController()
    controller = requestController
    const index = messages.value.length
    messages.value.push({ role: 'ai', content: '' })
    const target = () => messages.value[index]

    try {
      await postEventStream(
        `${API_BASE_URL}/app/chat/gen/code`,
        { appId, message: text, agent: useAgent.value } satisfies API.AppChatRequest,
        requestController.signal,
        (event) => {
          if (event.event === 'done') return false
          if (event.event === 'business-error') {
            let errorText = '操作受限'
            try {
              errorText = JSON.parse(event.data).message || errorText
            } catch {
              /* 无法解析时保留通用错误信息。 */
            }
            message.error(errorText)
            const msg = target()
            if (msg) msg.content += `\n[${errorText}]`
            options.onChunk?.()
            return false
          }
          const msg = target()
          if (event.event === 'message' && event.data && msg) {
            appendChunk(msg, event.data)
            options.onChunk?.()
          }
        },
      )
    } catch (error: unknown) {
      if (!requestController.signal.aborted) {
        const errorText = error instanceof Error ? error.message : '生成失败'
        message.error(errorText)
        const msg = target()
        if (msg) msg.content += `\n[${errorText}]`
        options.onChunk?.()
      }
    } finally {
      generating.value = false
      controller = null
      if (!requestController.signal.aborted) await options.onFinish?.()
    }
  }

  const stop = async () => {
    if (!generating.value) return
    try {
      const res = await stopAppGenCode({ appId })
      if (res.data?.code === 0) {
        message.success('已发送停止指令')
      } else {
        message.error(res.data?.message || '停止失败')
      }
    } catch (error: unknown) {
      message.error(`停止失败：${error instanceof Error ? error.message : '未知异常'}`)
    }
  }

  return { generating, codeFiles, activeCodeFile, generate, stop }
}
