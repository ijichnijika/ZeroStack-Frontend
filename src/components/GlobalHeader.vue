<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { UserOutlined, SettingOutlined, LogoutOutlined, DownOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const handleMenuClick = ({ key }: { key: string }) => {
  router.push(key)
}

const menuItems = computed(() => {
  return router.options.routes
    .filter((r) => !r.meta?.hideInMenu)
    .map((r) => ({
      key: r.path,
      label: r.name === 'home' ? '首页' : r.name === 'about' ? '关于' : r.name || '页面',
    }))
})

const selectedKeys = ref<string[]>([route.path])

watch(
  () => route.path,
  (newPath) => {
    selectedKeys.value = [newPath]
  },
)
</script>

<template>
  <div class="global-header">
    <div class="header-left" @click="router.push('/')">
      <img src="@/assets/logo.png" alt="logo" class="logo" />
      <span class="title">ZeroStack</span>
    </div>

    <div class="header-center">
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="horizontal"
        :items="menuItems"
        @click="handleMenuClick"
        :style="{ lineHeight: '72px', borderBottom: 'none', width: '100%' }"
      />
    </div>

    <div class="header-right">
      <a-dropdown placement="bottomRight" :trigger="['click']">
        <div class="user-profile-trigger">
          <a-avatar style="background-color: #1890ff">
            <template #icon><UserOutlined /></template>
          </a-avatar>
          <span class="username">nijika</span>
          <DownOutlined class="arrow-icon" />
        </div>
        <template #overlay>
          <a-menu>
            <a-menu-item key="profile">
              <template #icon><UserOutlined /></template>
              个人中心
            </a-menu-item>
            <a-menu-item key="settings">
              <template #icon><SettingOutlined /></template>
              个人设置
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item key="logout">
              <template #icon><LogoutOutlined /></template>
              退出登录
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<style scoped>
.global-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  padding: 0 32px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 32px;
  flex-shrink: 0;
}

.logo {
  height: 42px;
  width: auto;
  margin-right: 12px;
  transition: transform 0.3s ease;
}

.header-left:hover .logo {
  transform: scale(1.05);
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: #1f1f1f;
  white-space: nowrap;
  letter-spacing: -0.3px;
}

.header-center {
  flex: 1;
  min-width: 0;
}

:deep(.ant-menu-item) {
  font-size: 16px !important;
  font-weight: 500 !important;
}

.header-right {
  display: flex;
  align-items: center;
  margin-left: 24px;
  flex-shrink: 0;
}

.user-profile-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.user-profile-trigger:hover {
  background-color: #f5f5f5;
}

.username {
  font-size: 15px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}

.arrow-icon {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
