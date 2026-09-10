<script setup lang="ts">
/**
 * ChatInputArea — 聊天输入区域
 *
 * 职责：渲染输入框及其附属控件，包含：
 * - 选中元素 Alert（可视化编辑模式下显示）
 * - 聊天输入框
 * - Agent 模式开关
 * - 可视化编辑模式按钮
 * - 发送 / 停止生成按钮
 *
 * 从 AppChatPage.vue 拆出，组件本身不持有任何异步状态，
 * 完全由父组件通过 props 驱动 UI，通过 emit 传递用户操作。
 */
import { SendOutlined, PauseCircleOutlined, HighlightOutlined } from '@ant-design/icons-vue'
import AgentSwitch from '@/components/AgentSwitch.vue'
import type { SelectedElementInfo } from '@/utils/useVisualEditor'

const props = defineProps<{
  /** 输入框的值（v-model） */
  chatInput: string
  /** 是否正在生成（禁用输入/发送，启用停止） */
  generating: boolean
  /** 当前用户是否为创建者（非创作者禁止对话） */
  isCreator: boolean
  /** 是否已开启 Agent 模式（v-model） */
  useAgent: boolean
  /** 是否处于可视化编辑模式 */
  isEditMode: boolean
  /** 已选中的 iframe 内元素信息（null 表示未选中） */
  selectedElement: SelectedElementInfo | null
  /** 是否已有预览 iframe（控制可视化编辑按钮 disabled） */
  hasPreview: boolean
}>()

const emit = defineEmits<{
  (e: 'update:chatInput', val: string): void
  (e: 'update:useAgent', val: boolean): void
  (e: 'send'): void
  (e: 'stop'): void
  (e: 'toggleEditMode'): void
  (e: 'clearSelectedElement'): void
}>()
</script>

<template>
  <div class="input-area">
    <!-- 选中元素信息提示（仅在可视化编辑且有选中元素时显示） -->
    <a-alert
      v-if="selectedElement"
      type="info"
      show-icon
      closable
      class="selected-element-alert"
      @close="emit('clearSelectedElement')"
    >
      <template #message>
        <span class="alert-label">已选中元素：</span>
        <code class="alert-tag">&lt;{{ selectedElement.tagName }}&gt;</code>
        <template v-if="selectedElement.id">
          <span class="alert-sep"> · </span>
          <code class="alert-id">#{{ selectedElement.id }}</code>
        </template>
        <template v-if="selectedElement.className">
          <span class="alert-sep"> · </span>
          <code class="alert-class">.{{ selectedElement.className.split(' ').join('.') }}</code>
        </template>
        <template v-if="selectedElement.textContent">
          <span class="alert-sep"> · </span>
          <span class="alert-text">"{{ selectedElement.textContent.slice(0, 30) }}{{ selectedElement.textContent.length > 30 ? '…' : '' }}"</span>
        </template>
      </template>
    </a-alert>

    <!-- 聊天输入框 -->
    <a-tooltip :title="!isCreator ? '无法在别人的作品下对话哦~' : ''" placement="top">
      <a-input
        :value="chatInput"
        placeholder="请描述你想生成的应用或页面功能，如：包含数据看板与图表的SaaS系统…"
        class="chat-input"
        aria-label="输入需求"
        :disabled="generating || !isCreator"
        @update:value="emit('update:chatInput', $event)"
        @pressEnter="emit('send')"
      >
        <template #suffix>
          <div class="input-suffix">
            <AgentSwitch
              :checked="useAgent"
              :disabled="isEditMode"
              @update:checked="emit('update:useAgent', $event)"
            />
            <a-tooltip :title="!hasPreview ? '请先生成预览后再使用可视化编辑' : (isEditMode ? '退出编辑模式' : '进入可视化编辑模式')">
              <a-button
                :type="isEditMode ? 'primary' : 'default'"
                shape="circle"
                class="visual-edit-btn"
                aria-label="切换可视化编辑模式"
                :disabled="!hasPreview || !isCreator"
                @click="emit('toggleEditMode')"
              >
                <template #icon><HighlightOutlined aria-hidden="true" /></template>
              </a-button>
            </a-tooltip>
            <!-- 发送按钮（未生成时显示） -->
            <a-button
              v-if="!generating"
              type="primary"
              shape="circle"
              aria-label="发送生成需求"
              :disabled="!isCreator"
              @click="emit('send')"
            >
              <template #icon><SendOutlined aria-hidden="true" /></template>
            </a-button>
            <!-- 停止按钮（生成中显示） -->
            <a-button
              v-else
              type="primary"
              danger
              shape="circle"
              aria-label="停止生成"
              :disabled="!isCreator"
              @click="emit('stop')"
            >
              <template #icon><PauseCircleOutlined aria-hidden="true" /></template>
            </a-button>
          </div>
        </template>
      </a-input>
    </a-tooltip>
  </div>
</template>

<style scoped>
.input-area {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 255, 255, 0.85);
}

.chat-input {
  border-radius: 9999px;
  padding: 6px 14px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.9);
  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.chat-input:focus-within {
  background: #ffffff;
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2), 0 8px 24px rgba(99, 102, 241, 0.12);
}

.input-suffix {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

/* 可视化编辑按钮 */
.visual-edit-btn {
  margin-right: 2px;
}

/* 选中元素提示条 */
.selected-element-alert {
  margin-bottom: 8px;
  border-radius: 8px;
}

.alert-label {
  font-weight: 500;
  color: #333;
  margin-right: 4px;
}

.alert-tag,
.alert-id,
.alert-class {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11px;
  font-weight: 500;
}

.alert-tag {
  background: #f1f5f9;
  color: #4338ca;
  border: 1px solid #e0e7ff;
}

.alert-id {
  background: #f8fafc;
  color: #0284c7;
  border: 1px solid #e0f2fe;
}

.alert-class {
  background: #f8fafc;
  color: #0f766e;
  border: 1px solid #ccfbf1;
}

.alert-sep {
  color: #94a3b8;
}

.alert-text {
  color: #64748b;
  font-style: normal;
  font-size: 12px;
}
</style>
