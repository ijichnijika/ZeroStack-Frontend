<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'
import { UserOutlined, SettingOutlined, LogoutOutlined, DownOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

/**
 * 用户下拉菜单的 key 常量
 * 之所以提取：key 字符串同时出现在 handleDropdownClick switch 判断与模板
 * menu-item key 属性中，若直接使用字面量，修改时需要同步两处且极易遗漏。
 */
const USER_MENU_KEY = {
  PROFILE: 'profile',
  SETTINGS: 'settings',
  LOGOUT: 'logout',
} as const

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
  if (key === USER_MENU_KEY.PROFILE) {
    router.push('/user/profile')
  } else if (key === USER_MENU_KEY.SETTINGS) {
    router.push('/user/settings')
  } else if (key === USER_MENU_KEY.LOGOUT) {
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
    <router-link to="/" class="header-left" aria-label="ZeroStack 首页">
      <img src="@/assets/logo.png" alt="ZeroStack Logo" class="logo" width="32" height="32" />
      <span class="title">ZeroStack</span>
    </router-link>

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
          <div
            class="user-profile-trigger"
            role="button"
            tabindex="0"
            :aria-label="`用户菜单: ${userStore.loginUser.userName || userStore.loginUser.userAccount}`"
            @keydown.enter.prevent="($event.currentTarget as HTMLElement)?.click()"
            @keydown.space.prevent="($event.currentTarget as HTMLElement)?.click()"
          >
            <a-avatar
              :src="userStore.loginUser.userAvatar"
              style="background-color: #4f46e5;"
            >
              <template #icon><UserOutlined aria-hidden="true" /></template>
            </a-avatar>
            <span class="username">{{ userStore.loginUser.userName || userStore.loginUser.userAccount }}</span>
            <DownOutlined class="arrow-icon" aria-hidden="true" />
          </div>
          <template #overlay>
            <a-menu @click="handleDropdownClick" class="glass-dropdown">
              <a-menu-item :key="USER_MENU_KEY.PROFILE">
                <template #icon><UserOutlined aria-hidden="true" /></template>
                个人中心
              </a-menu-item>
              <a-menu-item :key="USER_MENU_KEY.SETTINGS">
                <template #icon><SettingOutlined aria-hidden="true" /></template>
                个人设置
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item :key="USER_MENU_KEY.LOGOUT">
                <template #icon><LogoutOutlined aria-hidden="true" /></template>
                退出登录
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </template>
      <template v-else>
        <a-button type="primary" @click="router.push('/user/login')" class="primary-animated-btn header-btn-size">
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
  background: rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 4px 20px -2px rgba(31, 38, 135, 0.05);
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 32px;
  flex-shrink: 0;
  text-decoration: none;
  border-radius: 8px;
}

.header-left:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 4px;
}

.logo {
  height: 32px;
  width: auto;
  margin-right: 10px;
  border-radius: 8px;
  transition: transform 0.25s ease;
}

.header-left:hover .logo {
  transform: scale(1.06);
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, #0f172a 0%, #4338ca 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-center {
  flex: 1;
  min-width: 0;
}

:deep(.ant-menu) {
  border-bottom: none !important;
}

:deep(.ant-menu-item) {
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #475569 !important;
  transition: color 0.2s ease, background-color 0.2s ease !important;
  margin: 0 6px !important;
  border-radius: 8px !important;
}

:deep(.ant-menu-item:hover) {
  color: #4f46e5 !important;
  background: rgba(99, 102, 241, 0.08) !important;
}

:deep(.ant-menu-item-selected) {
  color: #4f46e5 !important;
  background: rgba(99, 102, 241, 0.1) !important;
  font-weight: 600 !important;
}

:deep(.ant-menu-item-selected::after) {
  display: none !important;
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
  padding: 4px 14px 4px 4px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  line-height: normal;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.user-profile-trigger:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12);
  transform: translateY(-0.5px);
}

.user-profile-trigger:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.username {
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
}

.arrow-icon {
  font-size: 10px;
  color: #64748b;
}

.header-btn-size {
  height: 36px !important;
  padding: 0 22px !important;
  font-size: 14px !important;
  border-radius: 9999px !important;
}
</style>

