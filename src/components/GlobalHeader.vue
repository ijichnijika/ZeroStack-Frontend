<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'
import { UserOutlined, SettingOutlined, LogoutOutlined, DownOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const handleMenuClick = ({ key }: { key: string }) => {
  router.push(key)
}

const menuItems = computed(() => {
  // 寻找到根布局路由下的子路由，如果没配置嵌套则默认使用顶级路由
  const baseRoute = router.options.routes.find((r) => r.path === '/')
  const routesToRender = baseRoute?.children ? baseRoute.children.map(child => ({
    ...child,
    // 将相对子路径转换为绝对路径
    path: child.path.startsWith('/') ? child.path : `/${child.path}`
  })) : router.options.routes

  return routesToRender
    .filter((r) => {
      // 过滤需要隐藏的菜单
      if (r.meta?.hideInMenu) {
        return false
      }
      // 过滤非管理员不可见菜单
      if (r.meta?.needAdmin && userStore.loginUser?.userRole !== 'admin') {
        return false
      }
      return true
    })
    .map((r) => ({
      key: r.path,
      label: (r.meta?.title as string) || r.name || '页面',
    }))
})

const selectedKeys = ref<string[]>([route.path])

watch(
  () => route.path,
  (newPath) => {
    selectedKeys.value = [newPath]
  },
)

const handleDropdownClick = async ({ key }: { key: string }) => {
  if (key === 'profile') {
    router.push('/user/profile')
  } else if (key === 'settings') {
    router.push('/user/settings')
  } else if (key === 'logout') {
    try {
      await userStore.logout()
      message.success('退出登录成功')
      router.push('/user/login')
    } catch (e) {
      message.error('退出登录失败')
    }
  }
}
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
        :style="{ lineHeight: '60px', borderBottom: 'none', width: '100%', background: 'transparent' }"
      />
    </div>

    <div class="header-right">
      <!-- 已登录展示用户信息 -->
      <template v-if="userStore.loginUser?.id">
        <a-dropdown placement="bottomRight" :trigger="['click']">
          <div class="user-profile-trigger">
            <a-avatar
              :src="userStore.loginUser.userAvatar"
              style="background-color: #1890ff;"
            >
              <template #icon><UserOutlined /></template>
            </a-avatar>
            <span class="username">{{ userStore.loginUser.userName || userStore.loginUser.userAccount }}</span>
            <DownOutlined class="arrow-icon" />
          </div>
          <template #overlay>
            <a-menu @click="handleDropdownClick" class="glass-dropdown">
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
      </template>
      <template v-else>
        <a-button type="primary" shape="round" @click="router.push('/user/login')" class="primary-animated-btn header-btn-size">
          登录
        </a-button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.global-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 32px;
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(16px) saturate(120%);
  -webkit-backdrop-filter: blur(16px) saturate(120%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
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
  height: 36px;
  width: auto;
  margin-right: 12px;
  transition: transform 0.3s ease;
}

.header-left:hover .logo {
  transform: scale(1.05);
}

.title {
  font-size: 22px;
  font-weight: 500;
  color: #1a1a1a;
  white-space: nowrap;
  letter-spacing: -0.5px;
  font-family: 'Google Sans', sans-serif;
}

.header-center {
  flex: 1;
  min-width: 0;
}

:deep(.ant-menu) {
  border-bottom: none !important;
}

:deep(.ant-menu-item) {
  font-size: 15px !important;
  font-weight: 500 !important;
  color: #444746 !important;
  transition: all 0.2s ease !important;
  margin: 0 8px !important;
}

:deep(.ant-menu-item:hover) {
  color: #1a73e8 !important;
}

:deep(.ant-menu-item-selected) {
  color: #1a73e8 !important;
  background-color: transparent !important;
}

:deep(.ant-menu-item-selected::after) {
  border-bottom: 2px solid #1a73e8 !important;
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
  padding: 6px 12px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  line-height: normal;
  transition: all 0.3s ease;
}

.user-profile-trigger:hover {
  background-color: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.25);
}

.username {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.8);
  font-weight: 600;
}

.arrow-icon {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.45);
}

.header-btn-size {
  height: 40px !important;
  padding: 0 24px !important;
  font-size: 15px !important;
}
</style>

