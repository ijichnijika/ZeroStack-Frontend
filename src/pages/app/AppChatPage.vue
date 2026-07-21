<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import { ArrowLeftOutlined, CloudUploadOutlined, LoadingOutlined, SendOutlined, PictureOutlined, CheckCircleFilled, CopyOutlined, RobotOutlined, CheckOutlined, EditOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { getAppVoById, deleteApp, deployApp, updateApp, genAppTitle, downloadAppCode } from '@/api/appController'
import { listAppChatHistory } from '@/api/chatHistoryController'
import AppInfoPopover from '@/components/AppInfoPopover.vue'
import MarkdownViewer from '@/components/MarkdownViewer.vue'
import { getStaticPreviewUrl, API_BASE_URL, getDeployUrl } from '@/config/env'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const appId = route.params.id as any

const handleEdit = () => {
  router.push(`/app/edit/${appId}`)
}

const handleDelete = async () => {
  try {
    const res = await deleteApp({ id: appId })
    if (res.data?.code === 0) {
      message.success('删除成功')
      router.back()
    } else {
      message.error(res.data?.message || '删除失败')
    }
  } catch (e: any) {
    message.error('请求异常')
  }
}
const appInfo = ref<API.AppVO | null>(null)
const iframeUrl = ref('')
const generating = ref(false)
const deploying = ref(false)
const downloading = ref(false)
const deploySuccessModalVisible = ref(false)
const deployKeyForModal = ref('')
const chatInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const messages = ref<{ id?: number, role: 'user' | 'ai', content: string, createTime?: string }[]>([])
const historyLoading = ref(false)
const hasMoreHistory = ref(false)

const isEditingTitle = ref(false)
const editTitleValue = ref('')
const generatingTitle = ref(false)

const startEditTitle = () => {
  editTitleValue.value = appInfo.value?.appName || ''
  isEditingTitle.value = true
}

const saveTitle = async () => {
  if (!editTitleValue.value.trim() || editTitleValue.value === appInfo.value?.appName) {
    isEditingTitle.value = false
    return
  }
  try {
    const res = await updateApp({ id: appId, appName: editTitleValue.value })
    if (res.data?.code === 0) {
      if (appInfo.value) {
        appInfo.value.appName = editTitleValue.value
      }
      isEditingTitle.value = false
    } else {
      message.error(res.data?.message || '保存失败')
    }
  } catch (e: any) {
    message.error('保存失败')
  }
}

const handleAiGenTitle = async () => {
  if (generatingTitle.value) return
  generatingTitle.value = true
  try {
    const res = await genAppTitle({ appId, prompt: appInfo.value?.initPrompt || '' })
    if (res.data?.code === 0 && res.data?.data) {
      editTitleValue.value = res.data.data
      if (appInfo.value) {
        appInfo.value.appName = res.data.data
      }
      message.success('AI 生成标题成功')
      isEditingTitle.value = false
    } else {
      message.error(res.data?.message || '生成失败')
    }
  } catch (e: any) {
    message.error('生成失败')
  } finally {
    generatingTitle.value = false
  }
}

const isCreator = computed(() => {
  if (!appInfo.value || !userStore.loginUser?.id) return true // 默认放行，等加载完再判断
  return appInfo.value.userId === userStore.loginUser.id
})

const loadAppInfo = async () => {
  try {
    const res = await getAppVoById({ id: appId })
    if (res.data.code === 0 && res.data.data) {
      appInfo.value = res.data.data
    } else {
      message.error(res.data.message || '获取应用信息失败')
    }
  } catch (error: any) {
    message.error('请求应用信息异常')
  }
}

const loadHistory = async (lastCreateTime?: string) => {
  historyLoading.value = true
  try {
    const res = await listAppChatHistory({ appId, pageSize: 10, lastCreateTime })
    if (res.data.code === 0 && res.data.data?.records) {
      const records = res.data.data.records
      
      const formatted: any[] = records.map(r => ({
        id: r.id,
        role: (r.messageType && r.messageType.toLowerCase() === 'user') ? 'user' : 'ai',
        content: r.message || '',
        createTime: r.createTime
      }))
      
      formatted.sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime())
      
      if (lastCreateTime) {
        messages.value = [...formatted, ...messages.value]
      } else {
        messages.value = formatted
        scrollToBottom()
      }
      
      hasMoreHistory.value = records.length >= 10
    }
  } catch (e) {
    message.error('加载历史记录失败')
  } finally {
    historyLoading.value = false
  }
}

const handleLoadMore = () => {
  if (messages.value.length > 0) {
    loadHistory(messages.value[0].createTime)
  }
}

const initPage = async () => {
  await Promise.all([loadAppInfo(), loadHistory()])
  
  if (appInfo.value) {
    // 进入页面时，如果 app 有至少 2 条对话记录，也展示对应的网站
    if (appInfo.value.codeGenType && messages.value.length >= 2) {
      iframeUrl.value = `${getStaticPreviewUrl(appInfo.value.codeGenType, appInfo.value.id!)}?t=${Date.now()}`
    }
    
    // 移除之前页面 url 的 view 参数相关的逻辑，如果是自己的 app，并且没有对话历史，才自动将 initPrompt 作为第一条消息触发对话
    if (isCreator.value && messages.value.length === 0 && appInfo.value.initPrompt) {
      messages.value.push({ role: 'user', content: appInfo.value.initPrompt })
      await doGenerate(appInfo.value.initPrompt)
    }
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const handleSend = async () => {
  if (!chatInput.value.trim() || generating.value || !isCreator.value) return
  
  const text = chatInput.value.trim()
  chatInput.value = ''
  
  messages.value.push({ role: 'user', content: text })
  scrollToBottom()
  
  // 延迟触发生成，确保 Vue 完成对输入框清空的渲染，避免与接下来 disabled 状态同步冲突
  setTimeout(async () => {
    await doGenerate(text)
  }, 10)
}

/**
 * 轮询等待预览 URL 可访问（用于 Vue 项目异步构建场景）
 * 每 5 秒探测一次，最多等待 10 分钟
 */
const pollUntilPreviewReady = (previewUrl: string, maxRetries = 120, intervalMs = 5000) => {
  let retries = 0
  const timer = setInterval(async () => {
    retries++
    try {
      const res = await fetch(previewUrl, { method: 'HEAD', cache: 'no-cache' })
      if (res.ok) {
        clearInterval(timer)
        iframeUrl.value = `${previewUrl}?t=${Date.now()}`
        message.success('Vue 项目构建完成，预览已加载！')
      }
    } catch (_) {
      // 还未就绪，继续等待
    }
    if (retries >= maxRetries) {
      clearInterval(timer)
      message.warning('构建超时，请稍后手动刷新页面查看预览')
    }
  }, intervalMs)
}

const doGenerate = async (text: string) => {
  generating.value = true
  const aiMessageIndex = messages.value.length
  messages.value.push({ role: 'ai', content: '' })

  try {
    const url = `${API_BASE_URL}/app/chat/gen/code?appId=${appId}&message=${encodeURIComponent(text)}`
    const eventSource = new EventSource(url, { withCredentials: true })

    eventSource.onmessage = (event) => {
      const dataStr = event.data
      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr)
          if (parsed.d !== undefined) {
            messages.value[aiMessageIndex].content += parsed.d
          } else {
            messages.value[aiMessageIndex].content += dataStr
          }
        } catch (e) {
          if (dataStr.startsWith('"') && dataStr.endsWith('"')) {
            messages.value[aiMessageIndex].content += JSON.parse(dataStr)
          } else {
            messages.value[aiMessageIndex].content += dataStr
          }
        }
        scrollToBottom()
      }
    }

    const finishGeneration = async () => {
      generating.value = false
      eventSource.close()
      scrollToBottom()
      
      // 生成完成后，刷新下状态
      try {
        const res = await getAppVoById({ id: appId })
        if (res.data.code === 0 && res.data.data) {
          appInfo.value = res.data.data
          const codeGenType = appInfo.value.codeGenType
          if (codeGenType) {
            const previewUrl = getStaticPreviewUrl(codeGenType, appInfo.value.id!)
            if (codeGenType === 'vue_project') {
              // Vue 项目需要后台异步构建（npm install + npm run build），
              // done 事件触发时 dist 可能还未生成，轮询等待
              message.info('Vue 项目构建中，预览将在构建完成后自动加载...')
              pollUntilPreviewReady(previewUrl)
            } else {
              iframeUrl.value = `${previewUrl}?t=${Date.now()}`
            }
          }
        }
      } catch (e) {
        console.error(e)
      }
    }

    eventSource.addEventListener('done', () => {
      finishGeneration()
    })

    eventSource.onerror = (error) => {
      message.error('生成异常，流被中断')
      messages.value[aiMessageIndex].content += '\n[生成中断]'
      finishGeneration()
    }

  } catch (error: any) {
    message.error('生成异常: ' + error.message)
    messages.value[aiMessageIndex].content += '\n[生成失败]'
    generating.value = false
    scrollToBottom()
  }
}

const handleDeploy = async () => {
  if (!appInfo.value || deploying.value) return
  deploying.value = true
  try {
    const res = await deployApp({ appId })
    if (res.data.code === 0) {
      // 重新加载应用信息以获取最新状态
      await loadAppInfo()
      deployKeyForModal.value = appInfo.value?.deployKey || ''
      deploySuccessModalVisible.value = true
      // 部署成功后更新预览区域
      if (appInfo.value?.codeGenType) {
        iframeUrl.value = getStaticPreviewUrl(appInfo.value.codeGenType, appInfo.value.id!)
      }
    } else {
      message.error(res.data.message || '部署失败')
    }
  } catch (e: any) {
    message.error('部署请求异常')
  } finally {
    deploying.value = false
  }
}

const handleDownloadCode = async () => {
  if (!appId || downloading.value) return
  downloading.value = true
  try {
    const res = await downloadAppCode({ appId }, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/zip' })
    
    let filename = 'app-code.zip'
    const contentDisposition = res.headers['content-disposition']
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/)
      if (match && match[1]) {
        filename = decodeURIComponent(match[1])
      }
    }
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    message.success('代码下载成功')
  } catch (error: any) {
    message.error('下载代码失败')
  } finally {
    downloading.value = false
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(getDeployUrl(deployKeyForModal.value))
    message.success('链接已复制到剪贴板')
  } catch (err) {
    message.error('复制失败')
  }
}

const visitWebsite = () => {
  window.open(getDeployUrl(deployKeyForModal.value), '_blank')
}

onMounted(() => {
  initPage()
})
</script>

<template>
  <div class="chat-page-container">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <div class="left-section">
        <a-button type="text" @click="router.push('/')" style="margin-right: 8px;">
          <template #icon><ArrowLeftOutlined /></template>
        </a-button>
        <div v-if="!isEditingTitle" class="title-display" @click="startEditTitle">
          <span class="app-name">{{ appInfo?.appName || '加载中...' }}</span>
          <EditOutlined class="edit-icon" />
        </div>
        <div v-else class="title-edit">
          <input 
            v-model="editTitleValue" 
            class="title-input" 
            @keyup.enter="saveTitle"
            @blur="saveTitle" 
            autoFocus
          />
          <a-tooltip title="使用AI自动生成">
            <a-button type="primary" shape="circle" size="small" class="ai-gen-btn" :loading="generatingTitle" @mousedown.prevent="handleAiGenTitle">
              <template #icon><RobotOutlined /></template>
            </a-button>
          </a-tooltip>
          <a-button type="text" shape="circle" size="small" class="save-title-btn" @mousedown.prevent="saveTitle">
            <template #icon><CheckOutlined /></template>
          </a-button>
        </div>
      </div>
      <div class="right-section">
        <AppInfoPopover
          :appInfo="appInfo"
          :canManage="isCreator || userStore.loginUser?.userRole === 'admin'"
          @edit="handleEdit"
          @delete="handleDelete"
        />

        <a-button class="download-btn" :loading="downloading" @click="handleDownloadCode" style="margin-right: 8px;" :disabled="!iframeUrl">
          <template #icon><DownloadOutlined /></template>
          下载代码
        </a-button>

        <a-button type="primary" class="deploy-btn" :loading="deploying" @click="handleDeploy">
          <template #icon><CloudUploadOutlined /></template>
          部署
        </a-button>
      </div>
    </div>

    <!-- 主体区域 -->
    <div class="main-content">
      <!-- 左侧对话区 -->
      <div class="chat-panel">
        <div class="messages-area" ref="messagesContainer">
          <div v-if="hasMoreHistory" class="load-more-wrapper">
            <a-button type="link" @click="handleLoadMore" :loading="historyLoading">加载更多</a-button>
          </div>
          <div v-for="(msg, index) in messages" :key="index" :class="['message-row', msg.role]">
            <div v-if="msg.role === 'ai'" class="avatar ai-avatar">
              <img src="@/assets/logo.png" alt="ai" />
            </div>
            <div class="message-bubble">
              <div v-if="msg.role === 'ai' && generating && index === messages.length - 1 && !msg.content" class="typing-indicator">
                <LoadingOutlined /> 正在生成您的应用，这可能需要一点时间...
              </div>
              <MarkdownViewer v-else-if="msg.role === 'ai'" :content="msg.content || ' '" />
              <div v-else class="user-text">
                {{ msg.content }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="input-area">
          <a-tooltip :title="!isCreator ? '无法在别人的作品下对话哦~' : ''" placement="top">
            <a-input
              v-model:value="chatInput"
              placeholder="请描述你想生成的网站，越详细效果越好哦"
              class="chat-input"
              @pressEnter="handleSend"
              :disabled="generating || !isCreator"
            >
              <template #suffix>
                <a-button type="primary" shape="circle" @click="handleSend" :loading="generating" :disabled="!isCreator">
                  <template #icon><SendOutlined /></template>
                </a-button>
              </template>
            </a-input>
          </a-tooltip>
        </div>
      </div>

      <!-- 右侧预览区 -->
      <div class="preview-panel">
        <div v-if="generating" class="preview-placeholder">
          <LoadingOutlined class="loading-icon" />
          <p>正在努力编写代码中，请稍候...</p>
        </div>
        <iframe v-else-if="iframeUrl" :src="iframeUrl" class="preview-iframe" title="preview"></iframe>
        <div v-else class="preview-placeholder">
          <img src="@/assets/logo.png" alt="logo" class="placeholder-logo" />
          <p>生成完毕后，请点击右上角【部署】按钮进行部署与预览</p>
        </div>
      </div>
    </div>
    
    <!-- 部署成功弹窗 -->
    <a-modal v-model:open="deploySuccessModalVisible" :footer="null" :width="460">
      <div style="text-align: center; padding: 24px 0 12px 0;">
        <CheckCircleFilled style="font-size: 56px; color: #52c41a; margin-bottom: 20px;" />
        <h2 style="margin-bottom: 16px; font-weight: 600; font-size: 20px;">网站部署成功！</h2>
        <p style="color: #666; margin-bottom: 28px;">你的网站已经成功部署，可以通过以下链接访问：</p>
        
        <div style="display: flex; align-items: center; border: 1px solid #d9d9d9; border-radius: 6px; padding: 0 4px 0 12px; margin-bottom: 32px; height: 44px; background: #fafafa;">
          <span style="flex: 1; text-align: left; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ deployBaseUrl }}/{{ deployKeyForModal }}
          </span>
          <a-button type="text" @click="copyLink" style="color: #666;">
            <template #icon><CopyOutlined /></template>
          </a-button>
        </div>
        
        <a-space size="middle">
          <a-button type="primary" size="large" @click="visitWebsite" style="width: 120px;">访问网站</a-button>
          <a-button size="large" @click="deploySuccessModalVisible = false" style="width: 120px;">关闭</a-button>
        </a-space>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.chat-page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
}

.top-bar {
  height: 56px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.right-section {
  display: flex;
  align-items: center;
}

.right-section {
  display: flex;
  align-items: center;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.title-display {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.title-display:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.edit-icon {
  font-size: 14px;
  color: #999;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.title-display:hover .edit-icon {
  opacity: 1;
}

.title-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 8px;
}

.title-input {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  border: none;
  border-bottom: 2px solid #1890ff;
  background: transparent;
  outline: none;
  padding: 2px 4px;
  width: 200px;
}

.ai-gen-btn {
  background: linear-gradient(135deg, #1890ff, #52c41a);
  border: none;
}

.save-title-btn {
  color: #52c41a;
}

.deploy-btn {
  border-radius: 8px;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.chat-panel {
  flex: 2;
  background: #ffffff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.input-area {
  padding: 16px;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
}

.chat-input {
  border-radius: 20px;
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
}

.chat-input:focus-within {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.preview-panel {
  flex: 3;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #888;
}

.placeholder-logo {
  width: 64px;
  opacity: 0.2;
  filter: grayscale(100%);
}

.loading-icon {
  font-size: 48px;
  color: #1890ff;
}

.typing-indicator {
  color: #1890ff;
}

.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}
.markdown-body :deep(p) {
  margin-bottom: 0.8em;
}

</style>
