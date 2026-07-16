<script setup lang="ts">
import { useRouter } from 'vue-router'
import { MessageOutlined, GlobalOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const props = defineProps({
  app: {
    type: Object as () => API.AppVO,
    required: true
  },
  showCreator: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()

const goChat = (appId: number) => {
  router.push(`/app/chat/${appId}?view=1`)
}

const openPreview = (deployKey: string) => {
  const deployBaseUrl = import.meta.env.VITE_DEPLOY_BASE_URL || 'http://localhost'
  window.open(`${deployBaseUrl}/${deployKey}`, '_blank')
}
</script>

<template>
  <a-card hoverable class="app-card" @click="goChat(app.id)">
    <template #cover>
      <div class="card-cover">
        <img v-if="app.cover" :src="app.cover" alt="cover" />
        <div v-else class="default-cover">{{ app.appName?.charAt(0) || 'App' }}</div>
        <div class="cover-overlay">
          <a-button type="primary" shape="round" @click.stop="goChat(app.id)">
            <template #icon><MessageOutlined /></template>
            查看对话
          </a-button>
          <a-button v-if="app.deployKey" shape="round" @click.stop="openPreview(app.deployKey)">
            <template #icon><GlobalOutlined /></template>
            查看作品
          </a-button>
        </div>
      </div>
    </template>
    <a-card-meta :title="app.appName || '未命名应用'">
      <template #description>
        <div class="card-desc">
          <!-- 显示精选应用和作者信息 -->
          <template v-if="showCreator">
            <div class="author-info">
              <a-avatar size="small" :src="app.user?.userAvatar">
                <template #icon><UserOutlined /></template>
              </a-avatar>
              <span class="author-name">{{ app.user?.userName || app.user?.userAccount }}</span>
            </div>
            <a-tag color="blue" class="app-tag">精选应用</a-tag>
          </template>
          <!-- 仅显示我的应用创建时间 -->
          <template v-else>
            <span><ClockCircleOutlined /> 创建于 {{ dayjs(app.createTime).fromNow() }}</span>
          </template>
        </div>
      </template>
    </a-card-meta>
  </a-card>
</template>

<style scoped>
.app-card {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.app-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.card-cover {
  height: 160px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.app-card:hover .cover-overlay {
  opacity: 1;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-cover {
  font-size: 48px;
  font-weight: bold;
  color: #ccc;
}

.card-desc {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  font-size: 13px;
  color: #888;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  color: #333;
  font-weight: 500;
}

.app-tag {
  border-radius: 4px;
  margin: 0;
}
</style>
