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
        placeholder="请描述你想生成的网站，越详细效果越好哦"
        class="chat-input"
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
                :disabled="!hasPreview || !isCreator"
                @click="emit('toggleEditMode')"
              >
                <template #icon><HighlightOutlined /></template>
              </a-button>
            </a-tooltip>
            <!-- 发送按钮（未生成时显示） -->
            <a-button
              v-if="!generating"
              type="primary"
              shape="circle"
              :disabled="!isCreator"
              @click="emit('send')"
            >
              <template #icon><SendOutlined /></template>
            </a-button>
            <!-- 停止按钮（生成中显示） -->
            <a-button
              v-else
              type="primary"
              danger
              shape="circle"
              :disabled="!isCreator"
              @click="emit('stop')"
            >
              <template #icon><PauseCircleOutlined /></template>
            </a-button>
          </div>
        </template>
      </a-input>
    </a-tooltip>
  </div>
</template>

<style scoped>
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

.input-suffix {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 12px;
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
  padding: 0 5px;
  border-radius: 3px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
}

.alert-tag {
  background: #e6f7ff;
  color: #0958d9;
}

.alert-id {
  background: #fff7e6;
  color: #d46b08;
}

.alert-class {
  background: #f6ffed;
  color: #389e0d;
}

.alert-sep {
  color: #bbb;
}

.alert-text {
  color: #595959;
  font-style: italic;
  font-size: 12px;
}
</style>
