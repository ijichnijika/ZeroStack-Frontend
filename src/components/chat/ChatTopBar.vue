<script setup lang="ts">
/**
 * ChatTopBar — AppChatPage 顶部操作栏
 *
 * 负责：返回按钮、应用标题（含内联编辑）、右侧功能按钮组（下载/部署）。
 * 从 AppChatPage.vue 拆出，以避免 1000+ 行的超大单文件。
 * 所有业务事件通过 emit 向上传递，组件本身不持有任何异步状态。
 */
import { ArrowLeftOutlined, CloudUploadOutlined, DownloadOutlined, EditOutlined, RobotOutlined, CheckOutlined } from '@ant-design/icons-vue'
import { CODE_GEN_TYPE_CONFIG } from '@/enums/codeGenType'
import AppInfoPopover from '@/components/AppInfoPopover.vue'

const props = defineProps<{
  /** 应用基本信息，null 或 undefined 表示加载中 */
  appInfo: API.AppVO | null | undefined

  /** 是否正在编辑标题 */
  isEditingTitle: boolean
  /** 标题输入框的双向绑定值 */
  editTitleValue: string
  /** AI 生成标题中 */
  generatingTitle: boolean
  /** 代码下载中 */
  downloading: boolean
  /** 部署中 */
  deploying: boolean
  /** 是否有预览（控制下载按钮 disabled） */
  hasPreview: boolean
  /** 当前用户是否有管理权限 */
  canManage: boolean
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'startEditTitle'): void
  (e: 'saveTitle'): void
  (e: 'aiGenTitle'): void
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'download'): void
  (e: 'deploy'): void
  (e: 'update:editTitleValue', val: string): void
}>()
</script>

<template>
  <div class="top-bar">
    <!-- 左侧：返回 + 标题 -->
    <div class="left-section">
      <a-button type="text" class="back-btn" @click="emit('back')">
        <template #icon><ArrowLeftOutlined /></template>
      </a-button>

      <!-- 标题展示态：点击进入编辑 -->
      <div v-if="!isEditingTitle" class="title-display" @click="emit('startEditTitle')">
        <span class="app-name">{{ appInfo?.appName || '加载中...' }}</span>
        <a-tag
          v-if="appInfo?.codeGenType"
          :color="CODE_GEN_TYPE_CONFIG[appInfo.codeGenType as keyof typeof CODE_GEN_TYPE_CONFIG]?.color || 'blue'"
          class="gen-type-tag"
        >
          {{ CODE_GEN_TYPE_CONFIG[appInfo.codeGenType as keyof typeof CODE_GEN_TYPE_CONFIG]?.label || appInfo.codeGenType }}
        </a-tag>
        <EditOutlined class="edit-icon" />
      </div>

      <!-- 标题编辑态：输入框 + AI 生成 + 确认 -->
      <div v-else class="title-edit">
        <input
          :value="editTitleValue"
          class="title-input"
          autofocus
          @input="emit('update:editTitleValue', ($event.target as HTMLInputElement).value)"
          @keyup.enter="emit('saveTitle')"
          @blur="emit('saveTitle')"
        />
        <a-tooltip title="使用AI自动生成">
          <a-button
            type="primary"
            shape="circle"
            size="small"
            class="ai-gen-btn"
            :loading="generatingTitle"
            @mousedown.prevent="emit('aiGenTitle')"
          >
            <template #icon><RobotOutlined /></template>
          </a-button>
        </a-tooltip>
        <a-button type="text" shape="circle" size="small" class="save-title-btn" @mousedown.prevent="emit('saveTitle')">
          <template #icon><CheckOutlined /></template>
        </a-button>
      </div>
    </div>

    <!-- 右侧：应用信息 + 下载 + 部署 -->
    <div class="right-section">
      <AppInfoPopover
        :appInfo="appInfo ?? undefined"

        :canManage="canManage"

        @edit="emit('edit')"
        @delete="emit('delete')"
      />

      <a-button class="download-btn" :loading="downloading" :disabled="!hasPreview" @click="emit('download')">
        <template #icon><DownloadOutlined /></template>
        下载代码
      </a-button>

      <a-button type="primary" class="deploy-btn" :loading="deploying" @click="emit('deploy')">
        <template #icon><CloudUploadOutlined /></template>
        部署
      </a-button>
    </div>
  </div>
</template>

<style scoped>
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
  gap: 8px;
}

.back-btn {
  margin-right: 0;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.gen-type-tag {
  margin-left: 8px;
  border-radius: 4px;
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
</style>
