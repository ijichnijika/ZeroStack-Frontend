<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import {
  getAppVoById,
  deleteApp,
  deployApp,
  updateApp,
  genAppTitle,
  downloadAppCode,
  getAppCodeFiles,
} from '@/api/appController'
import { getStaticPreviewUrl, getDeployUrl } from '@/config/env'
import { CodeGenTypeEnum } from '@/enums/codeGenType'
import { useVisualEditor } from '@/utils/useVisualEditor'
import { useChatHistory } from '@/composables/useChatHistory'
import { useBuildStatus } from '@/composables/useBuildStatus'
import { useCodeGeneration } from '@/composables/useCodeGeneration'
import ChatTopBar from '@/components/chat/ChatTopBar.vue'
import ChatMessageList from '@/components/chat/ChatMessageList.vue'
import ChatInputArea from '@/components/chat/ChatInputArea.vue'
import PreviewPane from '@/components/chat/PreviewPane.vue'
import DeploySuccessModal from '@/components/chat/DeploySuccessModal.vue'
import type { Station } from '@/components/chat/RunStations.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 雪花算法生成的 64 位 Long 超过 Number.MAX_SAFE_INTEGER，必须保留原始字符串传输以防精度丢失
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const appId = route.params.id as any

const useAgent = ref(route.query.agent === 'true')
const appInfo = ref<API.AppVO | null>(null)
const iframeUrl = ref('')
const chatInput = ref('')
const deploying = ref(false)
const downloading = ref(false)
const deployModalOpen = ref(false)
const viewportMode = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const activePreviewTab = ref<'preview' | 'code'>('preview')
const mobilePane = ref<'chat' | 'preview'>('chat')
const previewRef = ref<InstanceType<typeof PreviewPane> | null>(null)

const isVueProject = computed(() => appInfo.value?.codeGenType === CodeGenTypeEnum.VUE_PROJECT)

/**
 * 是否为应用创建者。加载期间默认放行，避免输入框闪烁为禁用态。
 */
const isCreator = computed(() => {
  if (!appInfo.value || !userStore.loginUser?.id) return true
  return appInfo.value.userId === userStore.loginUser.id
})
const canManage = computed(() => isCreator.value || userStore.loginUser?.userRole === 'admin')

// ------------------------------------------------------------------ //
//  消息滚动
// ------------------------------------------------------------------ //
const messagesContainer = ref<HTMLElement | null>(null)
const autoScroll = ref(true)

const handleScroll = () => {
  const el = messagesContainer.value
  if (!el) return
  autoScroll.value = el.scrollHeight - el.scrollTop - el.clientHeight <= 50
}

const scrollToBottom = (force = false) => {
  if (!force && !autoScroll.value) return
  nextTick(() => {
    const el = messagesContainer.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

// ------------------------------------------------------------------ //
//  数据
// ------------------------------------------------------------------ //
const { messages, historyLoading, hasMoreHistory, loadHistory, loadMore } = useChatHistory(appId)
const { buildStatusText, buildFailed, listen: listenBuild } = useBuildStatus()

const refreshPreview = () => {
  if (!appInfo.value?.codeGenType) return
  iframeUrl.value = `${getStaticPreviewUrl(appInfo.value.codeGenType, appInfo.value.id!)}?t=${Date.now()}`
}

const loadAppInfo = async () => {
  try {
    const res = await getAppVoById({ id: appId })
    if (res.data.code === 0 && res.data.data) {
      appInfo.value = res.data.data
    } else {
      message.error(res.data.message || '获取应用信息失败')
    }
  } catch {
    message.error('获取应用信息失败，请检查网络')
  }
}

const {
  generating,
  codeFiles,
  activeCodeFile,
  generate,
  stop: handleStopGen,
} = useCodeGeneration({
  appId,
  messages,
  useAgent,
  onChunk: () => scrollToBottom(),
  onCodeUpdate: () => {
    if (isVueProject.value) activePreviewTab.value = 'code'
  },
  onFinish: async () => {
    scrollToBottom()
    await loadAppInfo()
    if (!appInfo.value?.codeGenType) return
    if (isVueProject.value) {
      listenBuild(appInfo.value.id!, () => {
        refreshPreview()
        activePreviewTab.value = 'preview'
      })
      await loadCodeFiles()
    } else {
      refreshPreview()
    }
  },
})

const loadCodeFiles = async () => {
  if (!isVueProject.value || !appInfo.value?.id) return
  try {
    const res = await getAppCodeFiles(appInfo.value.id)
    if (res.data?.code === 0 && res.data.data) {
      codeFiles.value = new Map(Object.entries(res.data.data as Record<string, string>))
      if (!activeCodeFile.value || !codeFiles.value.has(activeCodeFile.value)) {
        const prefer = ['src/App.vue', 'App.vue', 'index.html', 'src/main.js', 'src/main.ts']
        activeCodeFile.value = prefer.find((p) => codeFiles.value.has(p)) || codeFiles.value.keys().next().value || ''
      }
    }
  } catch (e) {
    console.error('加载应用源码失败', e)
  }
}

// ------------------------------------------------------------------ //
//  可视化点选
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

watch(isEditMode, (on) => {
  if (on) useAgent.value = false
})

const handleToggleEditMode = () => {
  toggleEditMode(previewRef.value?.getIframe() ?? null)
  if (isEditMode.value) mobilePane.value = 'preview'
}

watch(selectedElement, (el) => {
  if (el) mobilePane.value = 'chat'
})

// ------------------------------------------------------------------ //
//  发送 / 生成
// ------------------------------------------------------------------ //
const handleSend = () => {
  const rawText = chatInput.value.trim()
  if (!rawText || generating.value || !isCreator.value) return

  const text = rawText + buildElementPromptSuffix()
  chatInput.value = ''
  exitEditMode()

  messages.value.push({ role: 'user', content: rawText })
  autoScroll.value = true
  scrollToBottom(true)
  // 等输入框清空渲染完成后再进入生成态，避免与 disabled 切换产生竞态
  setTimeout(() => generate(text), 10)
}

// ------------------------------------------------------------------ //
//  标题
// ------------------------------------------------------------------ //
const isEditingTitle = ref(false)
const editTitleValue = ref('')
const generatingTitle = ref(false)

const startEditTitle = () => {
  editTitleValue.value = appInfo.value?.appName || ''
  isEditingTitle.value = true
}

const saveTitle = async () => {
  const name = editTitleValue.value.trim()
  if (!name || name === appInfo.value?.appName) {
    isEditingTitle.value = false
    return
  }
  try {
    const res = await updateApp({ id: appId, appName: name })
    if (res.data?.code === 0) {
      if (appInfo.value) appInfo.value.appName = name
      isEditingTitle.value = false
    } else {
      message.error(res.data?.message || '重命名失败')
    }
  } catch {
    message.error('重命名失败')
  }
}

const handleAiGenTitle = async () => {
  if (generatingTitle.value) return
  generatingTitle.value = true
  try {
    const res = await genAppTitle({ appId, prompt: appInfo.value?.initPrompt || '' })
    if (res.data?.code === 0 && res.data.data) {
      editTitleValue.value = res.data.data
      if (appInfo.value) appInfo.value.appName = res.data.data
      isEditingTitle.value = false
      message.success('已用 AI 起好名字')
    } else {
      message.error(res.data?.message || 'AI 起名失败')
    }
  } catch {
    message.error('AI 起名失败')
  } finally {
    generatingTitle.value = false
  }
}

// ------------------------------------------------------------------ //
//  应用操作
// ------------------------------------------------------------------ //
const handleDelete = async () => {
  try {
    const res = await deleteApp({ id: appId })
    if (res.data?.code === 0) {
      message.success('已删除')
      router.push('/')
    } else {
      message.error(res.data?.message || '删除失败')
    }
  } catch {
    message.error('删除失败')
  }
}

const handleDeploy = async () => {
  if (!appInfo.value || deploying.value) return
  deploying.value = true
  try {
    const res = await deployApp({ appId })
    if (res.data.code === 0) {
      await loadAppInfo()
      deployModalOpen.value = true
      refreshPreview()
    } else {
      message.error(res.data.message || '部署失败')
    }
  } catch {
    message.error('部署失败，请检查网络')
  } finally {
    deploying.value = false
  }
}

const handleDownloadCode = async () => {
  if (downloading.value) return
  downloading.value = true
  try {
    const res = await downloadAppCode({ appId }, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/zip' })
    let filename = 'app-code.zip'
    const match = res.headers['content-disposition']?.match(/filename="?([^"]+)"?/)
    if (match?.[1]) filename = decodeURIComponent(match[1])

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    message.success('源码已开始下载')
  } catch {
    message.error('下载源码失败')
  } finally {
    downloading.value = false
  }
}

const deployUrl = computed(() => (appInfo.value?.deployKey ? getDeployUrl(appInfo.value.deployKey) : ''))

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(deployUrl.value)
    message.success('链接已复制')
  } catch {
    message.error('复制失败，请手动选择地址复制')
  }
}

const visitWebsite = () => window.open(deployUrl.value, '_blank')

// ------------------------------------------------------------------ //
//  进度站点
// ------------------------------------------------------------------ //
const stations = computed<Station[]>(() => {
  const hasOutput = !!iframeUrl.value || messages.value.some((m) => m.role === 'ai' && m.content)
  const previewReady = !!iframeUrl.value && !generating.value && !buildStatusText.value
  const list: Station[] = [
    { key: 'gen', label: '生成', state: generating.value ? 'active' : hasOutput ? 'done' : 'pending' },
  ]
  if (isVueProject.value) {
    list.push({
      key: 'build',
      label: '构建',
      state: buildFailed.value
        ? 'failed'
        : buildStatusText.value
          ? 'active'
          : previewReady
            ? 'done'
            : 'pending',
    })
  }
  list.push(
    { key: 'preview', label: '预览', state: previewReady ? 'done' : 'pending' },
    {
      key: 'deploy',
      label: '部署',
      state: deploying.value ? 'active' : appInfo.value?.deployKey ? 'done' : 'pending',
    },
  )
  return list
})

const busy = computed(() => generating.value || (!!buildStatusText.value && !buildFailed.value))

// ------------------------------------------------------------------ //
//  初始化
// ------------------------------------------------------------------ //
onMounted(async () => {
  await Promise.all([loadAppInfo(), loadHistory()])
  scrollToBottom(true)
  if (!appInfo.value) return

  if (isVueProject.value) await loadCodeFiles()

  // 已有对话记录时直接展示预览
  if (appInfo.value.codeGenType && messages.value.length >= 2) refreshPreview()

  // 创建者首次进入且无历史：把 initPrompt 作为第一条消息自动生成
  if (isCreator.value && messages.value.length === 0 && appInfo.value.initPrompt) {
    messages.value.push({ role: 'user', content: appInfo.value.initPrompt })
    generate(appInfo.value.initPrompt)
  }
})
</script>

<template>
  <div class="workbench" :class="`pane-${mobilePane}`">
    <ChatTopBar
      :app-info="appInfo"
      :is-editing-title="isEditingTitle"
      :edit-title-value="editTitleValue"
      :generating-title="generatingTitle"
      :downloading="downloading"
      :deploying="deploying"
      :has-preview="!!iframeUrl"
      :can-manage="canManage"
      :busy="busy"
      :stations="stations"
      :mobile-pane="mobilePane"
      @back="router.push('/')"
      @start-edit-title="startEditTitle"
      @save-title="saveTitle"
      @ai-gen-title="handleAiGenTitle"
      @edit="router.push(`/app/edit/${appId}`)"
      @delete="handleDelete"
      @download="handleDownloadCode"
      @deploy="handleDeploy"
      @update:edit-title-value="editTitleValue = $event"
      @update:mobile-pane="mobilePane = $event"
    />

    <div class="workbench-body">
      <section class="chat-col" aria-label="对话">
        <div ref="messagesContainer" class="chat-scroll" @scroll="handleScroll">
          <ChatMessageList
            :messages="messages"
            :generating="generating"
            :history-loading="historyLoading"
            :has-more-history="hasMoreHistory"
            @load-more="loadMore"
          />
        </div>
        <ChatInputArea
          :chat-input="chatInput"
          :generating="generating"
          :is-creator="isCreator"
          :use-agent="useAgent"
          :is-edit-mode="isEditMode"
          :selected-element="selectedElement"
          :has-preview="!!iframeUrl"
          @update:chat-input="chatInput = $event"
          @update:use-agent="useAgent = $event"
          @send="handleSend"
          @stop="handleStopGen"
          @toggle-edit-mode="handleToggleEditMode"
          @clear-selected-element="clearSelectedElement"
        />
      </section>

      <PreviewPane
        ref="previewRef"
        class="preview-col"
        :iframe-url="iframeUrl"
        :generating="generating"
        :build-status-text="buildStatusText"
        :build-failed="buildFailed"
        :is-vue-project="isVueProject"
        :code-files="codeFiles"
        :active-code-file="activeCodeFile"
        :active-tab="activePreviewTab"
        :viewport-mode="viewportMode"
        :is-edit-mode="isEditMode"
        @update:active-tab="activePreviewTab = $event"
        @update:viewport-mode="viewportMode = $event"
        @update:active-code-file="activeCodeFile = $event"
        @iframe-load="onIframeLoad"
        @refresh="refreshPreview"
      />
    </div>

    <DeploySuccessModal
      v-model:open="deployModalOpen"
      :deploy-key="appInfo?.deployKey || ''"
      @copy-link="copyLink"
      @visit-website="visitWebsite"
    />
  </div>
</template>

<style scoped>
.workbench {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--paper);
}

.workbench-body {
  display: grid;
  grid-template-columns: minmax(360px, 460px) minmax(0, 1fr);
  flex: 1;
  min-height: 0;
}

.chat-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1.5px solid var(--ink);
}

.chat-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.preview-col {
  min-height: 0;
}

@media (max-width: 900px) {
  .workbench-body {
    grid-template-columns: 1fr;
  }

  .chat-col {
    border-right: 0;
  }

  .pane-chat .preview-col,
  .pane-preview .chat-col {
    display: none;
  }
}
</style>
