<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  EditOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue'
import { getCodeGenTypeConfig } from '@/enums/codeGenType'
import AppInfoPopover from '@/components/AppInfoPopover.vue'
import BrandMark from '@/components/BrandMark.vue'
import RunStations, { type Station } from '@/components/chat/RunStations.vue'

const props = defineProps<{
  appInfo: API.AppVO | null
  isEditingTitle: boolean
  editTitleValue: string
  generatingTitle: boolean
  downloading: boolean
  deploying: boolean
  hasPreview: boolean
  canManage: boolean
  busy: boolean
  stations: Station[]
  mobilePane: 'chat' | 'preview'
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
  (e: 'update:mobilePane', val: 'chat' | 'preview'): void
}>()

const titleInput = ref<HTMLInputElement | null>(null)
const typeConfig = computed(() => getCodeGenTypeConfig(props.appInfo?.codeGenType))
const deployBlocked = computed(() => !props.hasPreview || props.busy)

watch(
  () => props.isEditingTitle,
  (editing) => {
    if (editing) nextTick(() => titleInput.value?.select())
  },
)
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <button type="button" class="btn btn--quiet btn--icon btn--sm" aria-label="返回首页" @click="emit('back')">
        <ArrowLeftOutlined />
      </button>
      <BrandMark :size="26" :drifting="busy" />

      <button
        v-if="!isEditingTitle"
        type="button"
        class="title-btn"
        :disabled="!canManage"
        :title="canManage ? '点击重命名' : undefined"
        @click="emit('startEditTitle')"
      >
        <span class="title-text">{{ appInfo?.appName || '未命名应用' }}</span>
        <EditOutlined v-if="canManage" class="title-edit-icon" aria-hidden="true" />
      </button>

      <div v-else class="title-edit">
        <input
          ref="titleInput"
          :value="editTitleValue"
          class="title-input"
          maxlength="50"
          aria-label="应用名称"
          @input="emit('update:editTitleValue', ($event.target as HTMLInputElement).value)"
          @keyup.enter="emit('saveTitle')"
          @keyup.esc="emit('saveTitle')"
          @blur="emit('saveTitle')"
        />
        <a-tooltip title="让 AI 根据需求起个名字">
          <button
            type="button"
            class="btn btn--quiet btn--icon btn--sm"
            aria-label="AI 起名"
            :disabled="generatingTitle"
            @mousedown.prevent="emit('aiGenTitle')"
          >
            <LoadingOutlined v-if="generatingTitle" />
            <ThunderboltOutlined v-else />
          </button>
        </a-tooltip>
        <button
          type="button"
          class="btn btn--ink btn--icon btn--sm"
          aria-label="保存名称"
          @mousedown.prevent="emit('saveTitle')"
        >
          <CheckOutlined />
        </button>
      </div>

      <span v-if="typeConfig" class="tag type-tag" :class="`tag--${typeConfig.ink}`">{{ typeConfig.label }}</span>
    </div>

    <RunStations class="topbar-stations" :stations="stations" />

    <div class="topbar-right">
      <div class="pane-switch" role="tablist" aria-label="切换视图">
        <button
          type="button"
          role="tab"
          :aria-selected="mobilePane === 'chat'"
          :class="{ 'is-on': mobilePane === 'chat' }"
          @click="emit('update:mobilePane', 'chat')"
        >
          对话
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="mobilePane === 'preview'"
          :class="{ 'is-on': mobilePane === 'preview' }"
          @click="emit('update:mobilePane', 'preview')"
        >
          预览
        </button>
      </div>

      <AppInfoPopover :app-info="appInfo ?? undefined" :can-manage="canManage" @edit="emit('edit')" @delete="emit('delete')" />

      <a-tooltip :title="hasPreview ? '下载全部源码（ZIP）' : '生成完成后可下载'">
        <button
          type="button"
          class="btn btn--line btn--sm action-download"
          aria-label="下载源码"
          :disabled="!hasPreview || downloading"
          @click="emit('download')"
        >
          <LoadingOutlined v-if="downloading" />
          <DownloadOutlined v-else />
          <span class="action-label">{{ downloading ? '打包中' : '下载' }}</span>
        </button>
      </a-tooltip>

      <a-tooltip :title="deployBlocked ? '生成完成、预览可用后才能部署' : ''">
        <button
          v-if="canManage"
          type="button"
          class="btn btn--pink btn--sm"
          :aria-label="appInfo?.deployKey ? '重新部署' : '部署上线'"
          :disabled="deploying || deployBlocked"
          @click="emit('deploy')"
        >
          <LoadingOutlined v-if="deploying" />
          <CloudUploadOutlined v-else />
          <span class="action-label">{{ deploying ? '部署中' : appInfo?.deployKey ? '重新部署' : '部署上线' }}</span>
        </button>
      </a-tooltip>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 60px;
  padding: 0 16px 0 12px;
  border-bottom: 1.5px solid var(--ink);
  background: var(--paper);
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.title-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.title-btn:hover:not(:disabled) {
  background: var(--paper-2);
}

.title-btn:disabled {
  cursor: default;
}

.title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 700;
}

.title-edit-icon {
  font-size: 13px;
  color: var(--ink-3);
  opacity: 0;
  transition: opacity var(--t-fast) var(--ease-out);
}

.title-btn:hover .title-edit-icon,
.title-btn:focus-visible .title-edit-icon {
  opacity: 1;
}

.title-edit {
  display: flex;
  align-items: center;
  gap: 4px;
}

.title-input {
  width: 240px;
  height: 36px;
  padding: 0 12px;
  border: 1.5px solid var(--ink);
  border-radius: 8px;
  outline: 4px solid transparent;
  font-size: 15px;
  font-weight: 700;
  background: var(--sheet);
}

.title-input:focus {
  outline-color: var(--yellow);
}

.type-tag {
  flex-shrink: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.pane-switch {
  display: none;
  padding: 3px;
  border-radius: var(--pill);
  background: var(--paper-2);
}

.pane-switch button {
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--pill);
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.pane-switch button.is-on {
  background: var(--ink);
  color: #fff;
}

@media (max-width: 1180px) {
  .topbar-stations {
    display: none;
  }
}

@media (max-width: 900px) {
  .pane-switch {
    display: flex;
  }

  .type-tag {
    display: none;
  }
}

@media (max-width: 640px) {
  .topbar {
    gap: 8px;
    padding-right: 10px;
  }

  .action-label,
  .action-download {
    display: none;
  }

  .topbar-left {
    gap: 4px;
  }

  .topbar-left > .brand-mark {
    width: 20px;
    height: 20px;
  }

  .title-btn {
    padding: 0 6px;
  }

  .title-input {
    width: 140px;
  }
}
</style>
