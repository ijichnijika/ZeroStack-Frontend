<script setup lang="ts">
/**
 * DeploySuccessModal — 部署成功弹窗
 *
 * 独立出来的原因：弹窗内容（复制链接、访问网站）与 AppChatPage 的生成逻辑无关，
 * 拆分后可单独维护样式，也方便未来在其他页面复用（如首页应用卡片的部署入口）。
 */
import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons-vue'
import { DEPLOY_BASE_URL } from '@/config/env'

const props = defineProps<{
  /** 控制弹窗显示（v-model） */
  open: boolean
  /** 已部署的 deploy key */
  deployKey: string
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'copyLink'): void
  (e: 'visitWebsite'): void
}>()
</script>

<template>
  <a-modal
    :open="open"
    :footer="null"
    :width="460"
    @update:open="emit('update:open', $event)"
  >
    <div class="modal-body">
      <CheckCircleFilled class="success-icon" />
      <h2 class="modal-title">网站部署成功！</h2>
      <p class="modal-desc">你的网站已经成功部署，可以通过以下链接访问：</p>

      <!-- 链接展示 + 复制 -->
      <div class="link-box">
        <span class="link-text">{{ DEPLOY_BASE_URL }}/{{ deployKey }}</span>
        <a-button type="text" class="copy-btn" @click="emit('copyLink')">
          <template #icon><CopyOutlined /></template>
        </a-button>
      </div>

      <!-- 操作按钮 -->
      <a-space size="middle">
        <a-button type="primary" size="large" class="action-btn" @click="emit('visitWebsite')">
          访问网站
        </a-button>
        <a-button size="large" class="action-btn" @click="emit('update:open', false)">
          关闭
        </a-button>
      </a-space>
    </div>
  </a-modal>
</template>

<style scoped>
.modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 0 12px 0;
}

.success-icon {
  font-size: 56px;
  color: #52c41a;
  margin-bottom: 20px;
}

.modal-title {
  margin-bottom: 16px;
  font-weight: 600;
  font-size: 20px;
}

.modal-desc {
  color: #666;
  margin-bottom: 28px;
}

.link-box {
  display: flex;
  align-items: center;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 0 4px 0 12px;
  margin-bottom: 32px;
  height: 44px;
  background: #fafafa;
  width: 100%;
}

.link-text {
  flex: 1;
  text-align: left;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn {
  color: #666;
  flex-shrink: 0;
}

.action-btn {
  width: 120px;
}
</style>
