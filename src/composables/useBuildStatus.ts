import { onUnmounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { API_BASE_URL } from '@/config/env'

/**
 * Vue 工程需要后台 npm install + npm run build，
 * 通过 SSE 感知构建进度，构建完成后回调刷新预览。
 */
export function useBuildStatus() {
  const buildStatusText = ref('')
  const buildFailed = ref(false)
  let source: EventSource | null = null

  const close = () => {
    source?.close()
    source = null
  }

  const fail = (text: string) => {
    buildFailed.value = true
    buildStatusText.value = text
    close()
  }

  const listen = (appId: string | number, onSuccess: () => void) => {
    close()
    buildFailed.value = false
    buildStatusText.value = '准备构建'
    source = new EventSource(`${API_BASE_URL}/app/build/status/stream?appId=${appId}`, {
      withCredentials: true,
    })

    source.addEventListener('status', (event) => {
      buildStatusText.value = (event as MessageEvent).data
    })

    source.addEventListener('done', (event) => {
      const data = (event as MessageEvent).data
      close()
      if (data === 'Success') {
        buildStatusText.value = ''
        message.success('Vue 工程构建完成，预览已更新')
        onSuccess()
      } else {
        message.error(data || '构建失败')
        fail(data || '构建失败')
      }
    })

    source.addEventListener('business-error', (event) => {
      let text = '获取构建状态被拒绝'
      try {
        text = JSON.parse((event as MessageEvent).data).message || text
      } catch {
        /* 保持默认文案 */
      }
      message.error(text)
      fail(text)
    })

    source.onerror = () => {
      message.error('构建状态连接中断')
      fail('构建状态连接中断')
    }
  }

  onUnmounted(close)

  return { buildStatusText, buildFailed, listen }
}
