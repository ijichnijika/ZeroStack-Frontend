<script setup lang="ts">
import { UserOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'

const props = defineProps({
  appInfo: {
    type: Object as () => API.AppVO,
    required: false
  },
  canManage: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete'])
</script>

<template>
  <a-popover placement="bottomRight" trigger="click">
    <template #content>
      <div class="app-info-popover">
        <div class="info-section">
          <div class="info-label">创建者</div>
          <div class="info-value creator-info">
            <a-avatar size="small" :src="appInfo?.user?.userAvatar">
              <template #icon><UserOutlined /></template>
            </a-avatar>
            <span class="username">{{ appInfo?.user?.userName || appInfo?.user?.userAccount || '未知' }}</span>
          </div>
        </div>
        <div class="info-section">
          <div class="info-label">创建时间</div>
          <div class="info-value">{{ appInfo?.createTime ? dayjs(appInfo.createTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}</div>
        </div>
        
        <!-- 操作栏仅本人或管理员可见 -->
        <div v-if="canManage" class="action-section">
          <a-divider style="margin: 8px 0" />
          <a-space>
            <a-button type="link" size="small" @click="emit('edit')">
              <template #icon><EditOutlined /></template>
              修改
            </a-button>
            <a-popconfirm
              title="确定要删除该应用吗？此操作无法撤销"
              ok-text="确定"
              cancel-text="取消"
              @confirm="emit('delete')"
            >
              <a-button type="link" danger size="small">
                <template #icon><DeleteOutlined /></template>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </div>
      </div>
    </template>
    <a-button type="default" style="margin-right: 12px;">
      <template #icon><InfoCircleOutlined /></template>
      应用详情
    </a-button>
  </a-popover>
</template>

<style scoped>
.app-info-popover {
  width: 240px;
}

.info-section {
  margin-bottom: 12px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  color: #333;
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 500;
}

.action-section {
  margin-top: 8px;
}
</style>
