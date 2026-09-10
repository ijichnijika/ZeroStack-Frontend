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
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  padding-bottom: 16px;
}

.profile-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
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
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  padding-right: 40px;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0;
}

.role-tag {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 6px;
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
  font-weight: 500;
  color: #475569;
}

.desc-val {
  font-size: 14px;
  color: #0f172a;
}

.profile-text {
  color: #64748b;
}

.glass-descriptions :deep(.ant-descriptions-header) {
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.glass-descriptions :deep(.ant-descriptions-view) {
  border: 1px solid rgba(15, 23, 42, 0.08) !important;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff !important;
}

.glass-descriptions :deep(.ant-descriptions-row > th) {
  background: #f8fafc !important;
  border-right: 1px solid #e2e8f0 !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

.glass-descriptions :deep(.ant-descriptions-row > td) {
  background: #ffffff !important;
  border-bottom: 1px solid #f1f5f9 !important;
}

.action-group {
  margin-top: 12px;
}

.edit-btn {
  border-radius: 9999px !important;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4) !important;
  height: 40px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 500;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.edit-btn:hover {
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.55) !important;
  transform: translateY(-1px);
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
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    padding-bottom: 24px;
  }
}
</style>
