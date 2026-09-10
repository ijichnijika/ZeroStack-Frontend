<script setup lang="ts">
import { getDeployUrl } from '@/config/env'
import { useRouter } from 'vue-router'
import { MessageOutlined, GlobalOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

defineProps({
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

const goChat = (appId?: number) => {
  if (appId == null) return
  router.push(`/app/chat/${appId}?view=1`)
}

const openPreview = (deployKey: string) => {
  window.open(getDeployUrl(deployKey), '_blank')
}
</script>

<template>
  <a-card
    hoverable
    class="app-card"
    tabindex="0"
    role="region"
    :aria-label="app.appName || '应用卡片'"
    @click="goChat(app.id)"
    @keydown.enter.self="goChat(app.id)"
  >
    <template #cover>
      <div class="card-cover">
        <img v-if="app.cover" :src="app.cover" :alt="app.appName || '应用封面'" width="100%" height="150" loading="lazy" />
        <!-- 默认封面骨架 -->
        <div v-else class="default-cover">
          <div class="code-skeleton">
            <div class="code-skeleton-header">
              <span class="code-dot dot-red" aria-hidden="true"></span>
              <span class="code-dot dot-yellow" aria-hidden="true"></span>
              <span class="code-dot dot-green" aria-hidden="true"></span>
              <span class="code-file-title">{{ app.appName || 'App' }}</span>
            </div>
            <div class="code-skeleton-body">
              <div class="code-line w-80"></div>
              <div class="code-line w-55"></div>
              <div class="code-line w-90"></div>
              <div class="code-line w-65"></div>
            </div>
          </div>
          <div class="app-badge-node" aria-hidden="true">{{ app.appName?.charAt(0) || 'Z' }}</div>
        </div>

        <div class="cover-overlay">
          <a-button type="primary" class="card-action-btn" @click.stop="goChat(app.id)">
            <template #icon><MessageOutlined aria-hidden="true" /></template>
            查看对话
          </a-button>
          <a-button v-if="app.deployKey" class="card-action-btn secondary" @click.stop="openPreview(app.deployKey)">
            <template #icon><GlobalOutlined aria-hidden="true" /></template>
            访问站点
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
                <template #icon><UserOutlined aria-hidden="true" /></template>
              </a-avatar>
              <span class="author-name">{{ app.user?.userName || app.user?.userAccount }}</span>
            </div>
            <a-tag :bordered="false" class="app-tag">精选应用</a-tag>
          </template>
          <!-- 仅显示我的应用创建时间 -->
          <template v-else>
            <span><ClockCircleOutlined aria-hidden="true" /> 创建于 {{ dayjs(app.createTime).fromNow() }}</span>
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
  background: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 4px 20px -2px rgba(31, 38, 135, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
  outline: none;
}

.app-card:hover,
.app-card:focus-visible {
  transform: translateY(-3px);
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 16px 36px -4px rgba(99, 102, 241, 0.16), 0 2px 8px rgba(0, 0, 0, 0.04);
}

.app-card:focus-visible {
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #6366f1, 0 16px 36px -4px rgba(99, 102, 241, 0.16);
}

.card-cover {
  height: 150px;
  background: #0f172a;
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
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.app-card:hover .cover-overlay,
.app-card:focus-within .cover-overlay {
  opacity: 1;
}

.card-action-btn {
  border-radius: 9999px !important;
  font-size: 13px;
  height: 34px;
  padding: 0 18px;
  min-width: 110px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.card-action-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.card-action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.6);
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 默认封面骨架 */
.default-cover {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 14px;
  display: flex;
  position: relative;
  overflow: hidden;
}

.code-skeleton {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  opacity: 0.85;
}

.code-skeleton-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.code-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot-red { background: #ef4444; }
.dot-yellow { background: #f59e0b; }
.dot-green { background: #10b981; }

.code-file-title {
  margin-left: 6px;
  font-size: 11px;
  font-family: monospace;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.code-skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.code-line {
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
}

.w-80 { width: 80%; }
.w-55 { width: 55%; }
.w-90 { width: 90%; }
.w-65 { width: 65%; }

.app-badge-node {
  position: absolute;
  right: 14px;
  bottom: 12px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(79, 70, 229, 0.3);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-desc {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-size: 12px;
  color: #64748b;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.author-name {
  color: #334155;
  font-weight: 500;
}

.app-tag {
  border-radius: 4px;
  margin: 0;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
  line-height: 18px;
  background: #eef2ff !important;
  color: #4f46e5 !important;
  border: 1px solid #c7d2fe !important;
}
</style>
