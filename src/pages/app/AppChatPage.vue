<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { LoadingOutlined, HighlightOutlined, CodeOutlined, EyeOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { getAppVoById, deleteApp, deployApp, updateApp, genAppTitle, downloadAppCode, stopAppGenCode, getAppCodeFiles } from '@/api/appController'
import { listAppChatHistory } from '@/api/chatHistoryController'
import { getStaticPreviewUrl, API_BASE_URL, getDeployUrl } from '@/config/env'
import { useVisualEditor } from '@/utils/useVisualEditor'
import { CodeGenTypeEnum } from '@/enums/codeGenType'

// 子组件
import ChatTopBar from '@/components/chat/ChatTopBar.vue'
import ChatMessageList from '@/components/chat/ChatMessageList.vue'
import type { ChatMessage } from '@/components/chat/ChatMessageList.vue'
import ChatInputArea from '@/components/chat/ChatInputArea.vue'
import DeploySuccessModal from '@/components/chat/DeploySuccessModal.vue'
import CodeViewer from '@/components/chat/CodeViewer.vue'

// ------------------------------------------------------------------ //
//  路由 & Store
// ------------------------------------------------------------------ //
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 雪花算法生成的 64 位 Long 超过 Number.MAX_SAFE_INTEGER，必须保留原始字符串传输以防精度丢失
const appId = route.params.id as any

// Agent 模式开关，从路由查询参数初始化，默认不开启
const useAgent = ref(route.query.agent === 'true')

// ------------------------------------------------------------------ //
//  页面级状态
// ------------------------------------------------------------------ //
const appInfo = ref<API.AppVO | null>(null)
const iframeUrl = ref('')
const buildStatusText = ref('')
const generating = ref(false)
const deploying = ref(false)
const downloading = ref(false)
const deploySuccessModalVisible = ref(false)
const deployKeyForModal = ref('')
const chatInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const previewIframeRef = ref<HTMLIFrameElement | null>(null)

// ------------------------------------------------------------------ //
//  右侧面板：Tab 切换 & 代码视图
// ------------------------------------------------------------------ //
const activePreviewTab = ref<'preview' | 'code'>('preview')
const codeFiles = ref<Map<string, string>>(new Map())
const activeCodeFile = ref('')
const isVueProject = computed(() => appInfo.value?.codeGenType === CodeGenTypeEnum.VUE_PROJECT)

// ------------------------------------------------------------------ //
//  消息列表
// ------------------------------------------------------------------ //
const messages = ref<ChatMessage[]>([])
const historyLoading = ref(false)
const hasMoreHistory = ref(false)

// ------------------------------------------------------------------ //
//  标题编辑
// ------------------------------------------------------------------ //
const isEditingTitle = ref(false)
const editTitleValue = ref('')
const generatingTitle = ref(false)

// ------------------------------------------------------------------ //
//  可视化编辑器
// ------------------------------------------------------------------ //
const {
  isEditMode,
  selectedElement,
  toggleEditMode,
  exitEditMode,
  clearSelectedElement,
  buildElementPromptSuffix,
  onIframeLoad,
} = useVisualEditor()

// 开启可视化编辑时自动关闭 Agent 模式（两者互斥）
watch(isEditMode, (newVal) => {
  if (newVal) useAgent.value = false
})

// ------------------------------------------------------------------ //
//  权限判断
// ------------------------------------------------------------------ //
/**
 * 是否为应用创建者
 * 加载期间默认放行（true），待 appInfo 加载完再精确判断，
 * 避免加载过程中无必要地 disabled 输入框造成闪烁。
 */
const isCreator = computed(() => {
  if (!appInfo.value || !userStore.loginUser?.id) return true
  return appInfo.value.userId === userStore.loginUser.id
})

// ------------------------------------------------------------------ //
//  标题编辑操作
// ------------------------------------------------------------------ //
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
      if (appInfo.value) appInfo.value.appName = editTitleValue.value
      isEditingTitle.value = false
    } else {
      message.error(res.data?.message || '保存失败')
    }
  } catch {
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
      if (appInfo.value) appInfo.value.appName = res.data.data
      message.success('AI 生成标题成功')
      isEditingTitle.value = false
    } else {
      message.error(res.data?.message || '生成失败')
    }
  } catch {
    message.error('生成失败')
  } finally {
    generatingTitle.value = false
  }
}

// ------------------------------------------------------------------ //
//  数据加载
// ------------------------------------------------------------------ //
const loadAppInfo = async () => {
  try {
    const res = await getAppVoById({ id: appId })
    if (res.data.code === 0 && res.data.data) {
      appInfo.value = res.data.data
    } else {
      message.error(res.data.message || '获取应用信息失败')
    }
  } catch {
    message.error('请求应用信息异常')
  }
}

const loadHistory = async (lastCreateTime?: string) => {
  historyLoading.value = true
  try {
    const res = await listAppChatHistory({ appId, pageSize: 10, lastCreateTime })
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

      if (lastCreateTime) {
        messages.value = [...formatted, ...messages.value]
      } else {
        messages.value = formatted
        scrollToBottom()
      }

      hasMoreHistory.value = records.length >= 10
    }
  } catch {
    message.error('加载历史记录失败')
  } finally {
    historyLoading.value = false
  }
}

const handleLoadMore = () => {
  if (messages.value.length > 0 && messages.value[0]) {
    loadHistory(messages.value[0].createTime)
  }
}

const autoScroll = ref(true)

const handleScroll = () => {
  if (!messagesContainer.value) return
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  // 距离底部 50px 内视为在底部，继续保持自动跟随
  autoScroll.value = scrollHeight - scrollTop - clientHeight <= 50
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// ------------------------------------------------------------------ //
//  SSE：监听 Vue 项目后台构建状态
// ------------------------------------------------------------------ //
/**
 * Vue 项目需要后台异步 npm install + npm run build，
 * 通过 SSE 流感知构建进度，构建完成后刷新预览 iframe。
 */
const listenToBuildStatus = (appIdArg: string | number, previewUrl: string) => {
  const url = `${API_BASE_URL}/app/build/status/stream?appId=${appIdArg}`
  const eventSource = new EventSource(url, { withCredentials: true })

  eventSource.addEventListener('status', (event) => {
    buildStatusText.value = event.data
  })

  eventSource.addEventListener('done', (event) => {
    eventSource.close()
    if (event.data === 'Success') {
      message.success('Vue 项目构建完成，预览已加载！')
      iframeUrl.value = `${previewUrl}?t=${Date.now()}`
      buildStatusText.value = ''
    } else {
      message.error(event.data || '构建失败')
      buildStatusText.value = '构建失败，请重试'
    }
  })

  eventSource.addEventListener('business-error', (event: MessageEvent) => {
    try {
      const errorData = JSON.parse(event.data)
      message.error(errorData.message || '获取状态被拒绝')
      buildStatusText.value = errorData.message || '操作受限'
    } catch {
      message.error('获取状态受限')
      buildStatusText.value = '操作受限'
    }
    eventSource.close()
  })

  eventSource.onerror = () => {
    eventSource.close()
    message.error('获取构建状态异常')
    buildStatusText.value = '构建异常'
  }
}

// ------------------------------------------------------------------ //
//  SSE：代码生成
// ------------------------------------------------------------------ //
/**
 * 处理 SSE 消息中的 data 字段
 *
 * Agent 模式下 d 字段是 JSON 字符串（WorkflowProgressMessage），
 * 普通模式下是纯文本流，需要分别解析再追加到消息内容。
 */
const parseAndAppendChunk = (aiMessageIndex: number, dataStr: string) => {
  const targetMsg = messages.value[aiMessageIndex]
  if (!targetMsg) return

  try {
    const parsed = JSON.parse(dataStr)
    if (parsed.d !== undefined) {
      try {
        const dParsed = JSON.parse(parsed.d)
        if (dParsed.type === 'code_update') {
          targetMsg.content += (dParsed.summary || '')
          const filePath = dParsed.filePath as string
          if (dParsed.toolName === 'writeFile') {
            codeFiles.value.set(filePath, dParsed.content || '')
          } else if (dParsed.toolName === 'modifyFile') {
            const existing = codeFiles.value.get(filePath) || ''
            const updated = existing.replace(dParsed.oldContent || '', dParsed.newContent || '')
            codeFiles.value.set(filePath, updated)
          }
          activeCodeFile.value = filePath
          if (isVueProject.value) {
            activePreviewTab.value = 'code'
          }
        } else if (dParsed.type === 'workflow_progress') {
          const icon = dParsed.stepNumber === -1 ? '❌' : (dParsed.stepName === '完成' ? '🎉' : (dParsed.stepNumber === 0 ? '🚀' : '✅'))
          targetMsg.content += `\n> ${icon} **[${dParsed.stepName}]** ${dParsed.message}\n\n`
        } else if (dParsed.type === 'ai_response' || dParsed.type === 'ai_thinking') {
          targetMsg.content += (dParsed.data || '')
        } else {
          targetMsg.content += parsed.d
        }
      } catch {
        targetMsg.content += parsed.d
      }
    } else {
      targetMsg.content += dataStr
    }
  } catch {
    if (dataStr.startsWith('"') && dataStr.endsWith('"')) {
      targetMsg.content += JSON.parse(dataStr)
    } else {
      targetMsg.content += dataStr
    }
  }
}

const doGenerate = async (text: string) => {
  generating.value = true
  const aiMessageIndex = messages.value.length
  messages.value.push({ role: 'ai', content: '' })
  autoScroll.value = true
  scrollToBottom()

  try {
    const url = `${API_BASE_URL}/app/chat/gen/code?appId=${appId}&message=${encodeURIComponent(text)}&agent=${useAgent.value}`
    const eventSource = new EventSource(url, { withCredentials: true })

    eventSource.onmessage = (event) => {
      if (event.data) {
        parseAndAppendChunk(aiMessageIndex, event.data)
        if (autoScroll.value) {
          scrollToBottom()
        }
      }
    }

    /** 生成完成后的统一收尾逻辑（done 事件 & 错误均复用此函数） */
    const finishGeneration = async () => {
      generating.value = false
      eventSource.close()
      scrollToBottom()

      // 生成完成后刷新 appInfo，以获取最新 codeGenType 和预览 URL
      try {
        const res = await getAppVoById({ id: appId })
        if (res.data.code === 0 && res.data.data) {
          appInfo.value = res.data.data
          const codeGenType = appInfo.value.codeGenType
          if (codeGenType) {
            const previewUrl = getStaticPreviewUrl(codeGenType, appInfo.value.id!)
            if (codeGenType === 'vue_project') {
              buildStatusText.value = '准备构建...'
              listenToBuildStatus(appInfo.value.id!, previewUrl)
              await loadCodeFiles()
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

    eventSource.addEventListener('business-error', (event: MessageEvent) => {
      try {
        const errorData = JSON.parse(event.data)
        message.error(errorData.message || '生成被拒绝')
        if (messages.value[aiMessageIndex]) {
          messages.value[aiMessageIndex].content += `\n[${errorData.message || '操作受限'}]`
        }
      } catch {
        message.error('生成受限')
        if (messages.value[aiMessageIndex]) {
          messages.value[aiMessageIndex].content += '\n[操作受限]'
        }
      }
      generating.value = false
      eventSource.close()
      scrollToBottom()
    })

    eventSource.onerror = () => {
      message.error('生成异常，流被中断')
      if (messages.value[aiMessageIndex]) {
        messages.value[aiMessageIndex].content += '\n[生成中断]'
      }
      finishGeneration()
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '未知异常'
    message.error('生成异常: ' + errorMsg)
    if (messages.value[aiMessageIndex]) {
      messages.value[aiMessageIndex].content += '\n[生成失败]'
    }
    generating.value = false
    scrollToBottom()
  }
}

// ------------------------------------------------------------------ //
//  用户操作处理器
// ------------------------------------------------------------------ //
const handleEdit = () => router.push(`/app/edit/${appId}`)

const handleDelete = async () => {
  try {
    const res = await deleteApp({ id: appId })
    if (res.data?.code === 0) {
      message.success('删除成功')
      router.back()
    } else {
      message.error(res.data?.message || '删除失败')
    }
  } catch {
    message.error('请求异常')
  }
}

const handleSend = async () => {
  if (!chatInput.value.trim() || generating.value || !isCreator.value) return

  const rawText = chatInput.value.trim()
  // 若处于可视化编辑模式且有选中元素，将元素信息追加到提示词
  const text = rawText + buildElementPromptSuffix()

  chatInput.value = ''
  // 发送后退出可视化编辑模式并清除选中
  exitEditMode()

  // 消息列表展示原始文本（不含内部追加的元素信息）
  messages.value.push({ role: 'user', content: rawText })
  autoScroll.value = true
  scrollToBottom()

  // 延迟触发生成，确保 Vue 完成输入框清空的渲染，
  // 避免与接下来 disabled 状态同步产生竞态冲突
  setTimeout(async () => {
    await doGenerate(text)
  }, 10)
}

const handleStopGen = async () => {
  if (!appId || !generating.value) return
  try {
    const res = await stopAppGenCode({ appId })
    if (res.data?.code === 0) {
      message.success('已发送停止指令')
    } else {
      message.error(res.data?.message || '停止失败')
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '未知异常'
    message.error('停止异常: ' + errorMsg)
  }
}

const handleDeploy = async () => {
  if (!appInfo.value || deploying.value) return
  deploying.value = true
  try {
    const res = await deployApp({ appId })
    if (res.data.code === 0) {
      await loadAppInfo()
      deployKeyForModal.value = appInfo.value?.deployKey || ''
      deploySuccessModalVisible.value = true
      if (appInfo.value?.codeGenType) {
        iframeUrl.value = getStaticPreviewUrl(appInfo.value.codeGenType, appInfo.value.id!)
      }
    } else {
      message.error(res.data.message || '部署失败')
    }
  } catch {
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

    // 尝试从 Content-Disposition 响应头解析文件名，降级使用默认名
    let filename = 'app-code.zip'
    const contentDisposition = res.headers['content-disposition']
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/)
      if (match && match[1]) filename = decodeURIComponent(match[1])
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
  } catch {
    message.error('下载代码失败')
  } finally {
    downloading.value = false
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(getDeployUrl(deployKeyForModal.value))
    message.success('链接已复制到剪贴板')
  } catch {
    message.error('复制失败')
  }
}

const visitWebsite = () => {
  window.open(getDeployUrl(deployKeyForModal.value), '_blank')
}

const loadCodeFiles = async () => {
  if (!isVueProject.value || !appInfo.value?.id) return
  try {
    const res = await getAppCodeFiles(appInfo.value.id)
    if (res.data?.code === 0 && res.data.data) {
      const map = new Map<string, string>()
      for (const [filePath, content] of Object.entries(res.data.data as Record<string, string>)) {
        map.set(filePath, content)
      }
      codeFiles.value = map
      if (!activeCodeFile.value || !map.has(activeCodeFile.value)) {
        activeCodeFile.value = map.keys().next().value || ''
      }
    }
  } catch (e) {
    console.error('加载应用源码失败', e)
  }
}

// ------------------------------------------------------------------ //
//  初始化
// ------------------------------------------------------------------ //
const initPage = async () => {
  await Promise.all([loadAppInfo(), loadHistory()])

  if (appInfo.value) {
    if (isVueProject.value) {
      await loadCodeFiles()
    }

    // 进入页面时，如果 app 已有对话记录（>=2），直接展示对应预览
    if (appInfo.value.codeGenType && messages.value.length >= 2) {
      iframeUrl.value = `${getStaticPreviewUrl(appInfo.value.codeGenType, appInfo.value.id!)}?t=${Date.now()}`
    }

    // 如果是创建者且没有历史记录，则自动将 initPrompt 触发为第一条对话
    if (isCreator.value && messages.value.length === 0 && appInfo.value.initPrompt) {
      messages.value.push({ role: 'user', content: appInfo.value.initPrompt })
      await doGenerate(appInfo.value.initPrompt)
    }
  }
}

onMounted(() => {
  initPage()
})
</script>

<template>
  <div class="chat-page-container">
    <!-- 顶部栏 -->
    <ChatTopBar
      :appInfo="appInfo"
      :isEditingTitle="isEditingTitle"
      :editTitleValue="editTitleValue"
      :generatingTitle="generatingTitle"
      :downloading="downloading"
      :deploying="deploying"
      :hasPreview="!!iframeUrl"
      :canManage="isCreator || userStore.loginUser?.userRole === 'admin'"
      @back="router.push('/')"
      @startEditTitle="startEditTitle"
      @saveTitle="saveTitle"
      @aiGenTitle="handleAiGenTitle"
      @edit="handleEdit"
      @delete="handleDelete"
      @download="handleDownloadCode"
      @deploy="handleDeploy"
      @update:editTitleValue="editTitleValue = $event"
    />

    <!-- 主体区域 -->
    <div class="main-content">
      <!-- 左侧对话区 -->
      <div class="chat-panel">
        <!-- 消息列表（内部含滚动容器，通过 ref 控制滚动） -->
        <div ref="messagesContainer" class="messages-wrapper" @scroll="handleScroll">
          <ChatMessageList
            :messages="messages"
            :generating="generating"
            :historyLoading="historyLoading"
            :hasMoreHistory="hasMoreHistory"
            @loadMore="handleLoadMore"
          />
        </div>

        <!-- 输入区域 -->
        <ChatInputArea
          :chatInput="chatInput"
          :generating="generating"
          :isCreator="isCreator"
          :useAgent="useAgent"
          :isEditMode="isEditMode"
          :selectedElement="selectedElement"
          :hasPreview="!!iframeUrl"
          @update:chatInput="chatInput = $event"
          @update:useAgent="useAgent = $event"
          @send="handleSend"
          @stop="handleStopGen"
          @toggleEditMode="toggleEditMode(previewIframeRef)"
          @clearSelectedElement="clearSelectedElement"
        />
      </div>

      <!-- 右侧预览区 -->
      <div class="preview-panel" :class="{ 'edit-mode-active': isEditMode }">
        <!-- Tab 切换栏：仅在 Vue 项目模式下且（有预览 URL 或有代码文件）时显示 -->
        <div v-if="isVueProject && (iframeUrl || codeFiles.size > 0)" class="preview-tabs">
          <button
            class="preview-tab"
            :class="{ active: activePreviewTab === 'preview' }"
            @click="activePreviewTab = 'preview'"
          >
            <EyeOutlined /> 网页预览
          </button>
          <button
            class="preview-tab"
            :class="{ active: activePreviewTab === 'code' }"
            @click="activePreviewTab = 'code'"
          >
            <CodeOutlined /> 源码视图
            <span v-if="codeFiles.size > 0" class="file-count">{{ codeFiles.size }}</span>
          </button>
        </div>

        <!-- 源码视图 Tab（仅限 Vue 项目） -->
        <CodeViewer
          v-if="isVueProject && activePreviewTab === 'code'"
          :files="codeFiles"
          :activeFile="activeCodeFile"
          :streaming="generating"
          @update:activeFile="activeCodeFile = $event"
          class="code-viewer-fill"
        />

        <!-- 生成中 loading -->
        <div v-else-if="generating && (!isVueProject || activePreviewTab === 'preview')" class="preview-placeholder">
          <LoadingOutlined class="loading-icon" />
          <p>正在努力编写代码中，请稍候...</p>
        </div>

        <!-- Vue 项目构建中 loading -->
        <div v-else-if="buildStatusText && activePreviewTab === 'preview'" class="preview-placeholder">
          <LoadingOutlined class="loading-icon" />
          <p>{{ buildStatusText }}</p>
        </div>

        <!-- 有预览 URL：展示 iframe -->
        <template v-else-if="iframeUrl && (!isVueProject || activePreviewTab === 'preview')">
          <div v-if="isEditMode" class="edit-mode-banner">
            <HighlightOutlined />
            可视化编辑模式已开启 · 悬浮高亮，点击选中元素
          </div>
          <iframe
            ref="previewIframeRef"
            :src="iframeUrl"
            class="preview-iframe"
            title="preview"
            @load="onIframeLoad(previewIframeRef!)"
          />
        </template>

        <!-- 无预览：空状态 -->
        <div v-else class="preview-placeholder">
          <img src="@/assets/logo.png" alt="logo" class="placeholder-logo" />
          <p>生成完毕后，请点击右上角【部署】按钮进行部署与预览</p>
        </div>
      </div>
    </div>

    <!-- 部署成功弹窗 -->
    <DeploySuccessModal
      v-model:open="deploySuccessModalVisible"
      :deployKey="deployKeyForModal"
      @copyLink="copyLink"
      @visitWebsite="visitWebsite"
    />
  </div>
</template>

<style scoped>
.chat-page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧对话面板 */
.chat-panel {
  flex: 2;
  background: #ffffff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 消息列表容器（承接外部滚动控制 ref） */
.messages-wrapper {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 右侧预览面板 */
.preview-panel {
  flex: 3;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 进入可视化编辑模式时以蓝色边框提示 */
.preview-panel.edit-mode-active {
  outline: 2px solid #1890ff;
  outline-offset: -2px;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
}

.preview-placeholder {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #888;
}

/* Tab 切换栏 */
.preview-tabs {
  display: flex;
  gap: 0;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 12px;
  flex-shrink: 0;
}

.preview-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  background: none;
  color: #666;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.preview-tab:hover {
  color: #333;
  background: #fafafa;
}

.preview-tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.file-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #e6f7ff;
  color: #1890ff;
  font-size: 11px;
  font-weight: 600;
}

.code-viewer-fill {
  flex: 1;
  min-height: 0;
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

/* 可视化编辑模式顶部提示条 */
.edit-mode-banner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(24, 144, 255, 0.88);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  pointer-events: none;
  backdrop-filter: blur(4px);
}
</style>
