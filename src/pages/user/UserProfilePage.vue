<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { UserOutlined, EditOutlined, CalendarOutlined, SolutionOutlined, IdcardOutlined } from '@ant-design/icons-vue'

const userStore = useUserStore()
const router = useRouter()

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString()
}
</script>

<template>
  <div class="user-profile-page">
    <div class="profile-header">
      <h2>个人中心</h2>
      <p class="subtitle">查看并管理您的个人账户信息</p>
    </div>

    <div class="profile-card">
      <div class="profile-left">
        <!-- 呼吸渐变彩环头像 -->
        <div class="glow-avatar-wrapper profile-avatar">
          <a-avatar
            :size="120"
            :src="userStore.loginUser?.userAvatar"
            style="border: 4px solid #fff;"
          >
            <template #icon><UserOutlined /></template>
          </a-avatar>
        </div>
        <h3 class="user-name">{{ userStore.loginUser?.userName || '未设置昵称' }}</h3>
        <a-tag :color="userStore.loginUser?.userRole === 'admin' ? 'blue' : 'gray'" class="role-tag">
          {{ userStore.loginUser?.userRole === 'admin' ? '系统管理员' : '普通用户' }}
        </a-tag>
      </div>

      <div class="profile-right">
        <a-descriptions title="基本信息" :column="1" bordered class="glass-descriptions">
          <a-descriptions-item>
            <template #label><span class="desc-label"><IdcardOutlined /> 账号</span></template>
            <span class="desc-val">{{ userStore.loginUser?.userAccount }}</span>
          </a-descriptions-item>
          <a-descriptions-item>
            <template #label><span class="desc-label"><SolutionOutlined /> 个人简介</span></template>
            <span class="desc-val profile-text">{{ userStore.loginUser?.userProfile || '这个人很懒，什么都没写...' }}</span>
          </a-descriptions-item>
          <a-descriptions-item>
            <template #label><span class="desc-label"><CalendarOutlined /> 注册时间</span></template>
            <span class="desc-val">{{ formatDate(userStore.loginUser?.createTime) }}</span>
          </a-descriptions-item>
        </a-descriptions>

        <div class="action-group">
          <a-button type="primary" size="large" class="edit-btn" @click="router.push('/user/settings')">
            <template #icon><EditOutlined /></template>
            修改个人设置
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-profile-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
  padding-bottom: 16px;
}

.profile-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: #1f1f1f;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 0;
}

.profile-card {
  display: flex;
  gap: 40px;
  padding: 24px 0;
}

.profile-left {
  width: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  padding-right: 40px;
}

.user-name {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0;
}

.role-tag {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 99px;
}

.profile-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.desc-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #4b5563;
}

.desc-val {
  font-size: 14px;
  color: #1f2937;
}

.profile-text {
  font-style: italic;
  color: #4b5563;
}

.glass-descriptions :deep(.ant-descriptions-header) {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-descriptions :deep(.ant-descriptions-view) {
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.2) !important;
}

.glass-descriptions :deep(.ant-descriptions-row > th) {
  background: rgba(255, 255, 255, 0.4) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.glass-descriptions :deep(.ant-descriptions-row > td) {
  background: rgba(255, 255, 255, 0.2) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.action-group {
  margin-top: 12px;
}

.edit-btn {
  border-radius: 99px;
  background: linear-gradient(135deg, #1890ff 0%, #0050b3 100%);
  border: none;
  box-shadow: 0 4px 10px rgba(24, 144, 255, 0.2);
  height: 44px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 600;
}

.edit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(24, 144, 255, 0.3);
}

@media (max-width: 768px) {
  .profile-card {
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .profile-left {
    width: 100%;
    border-right: none;
    padding-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 24px;
  }
}
</style>
