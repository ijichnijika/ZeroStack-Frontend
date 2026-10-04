<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, SettingOutlined, LogoutOutlined, DownOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import BrandMark from '@/components/BrandMark.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isAdmin = computed(() => userStore.loginUser?.userRole === 'admin')

const menuItems = computed(() => {
  const baseRoute = router.options.routes.find((r) => r.path === '/')
  const children = baseRoute?.children ?? []
  return children
    .filter((r) => !r.meta?.hideInMenu && (!r.meta?.needAdmin || isAdmin.value))
    .map((r) => ({
      path: r.path ? `/${r.path}` : '/',
      label: (r.meta?.title as string) || String(r.name),
    }))
})

const displayName = computed(
  () => userStore.loginUser.userName || userStore.loginUser.userAccount || '未命名用户',
)

const handleMenuClick = async ({ key }: { key: string | number }) => {
  if (key === 'logout') {
    try {
      await userStore.logout()
      message.success('已退出登录')
      router.push('/user/login')
    } catch {
      message.error('退出登录失败，请稍后重试')
    }
    return
  }
  router.push(String(key))
}
</script>

<template>
  <header class="site-header">
    <div class="page header-inner">
      <router-link to="/" class="brand" aria-label="ZeroStack 首页">
        <BrandMark :size="30" />
        <span class="brand-word">ZeroStack</span>
      </router-link>

      <nav class="site-nav" aria-label="主导航">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ 'is-active': route.path === item.path }"
        >
          {{ item.label }}
        </router-link>
      </nav>

      <div class="header-right">
        <a-dropdown v-if="userStore.loginUser?.id" placement="bottomRight" :trigger="['click']">
          <button type="button" class="user-chip" :aria-label="`用户菜单：${displayName}`">
            <a-avatar :size="28" :src="userStore.loginUser.userAvatar" class="user-avatar">
              <template #icon><UserOutlined /></template>
            </a-avatar>
            <span class="user-name">{{ displayName }}</span>
            <DownOutlined class="user-caret" aria-hidden="true" />
          </button>
          <template #overlay>
            <a-menu @click="handleMenuClick">
              <a-menu-item key="/user/profile">
                <template #icon><UserOutlined /></template>
                个人中心
              </a-menu-item>
              <a-menu-item key="/user/settings">
                <template #icon><SettingOutlined /></template>
                个人设置
              </a-menu-item>
              <template v-if="isAdmin">
                <a-menu-divider class="mobile-only-divider" />
                <a-menu-item
                  v-for="item in menuItems.filter((i) => i.path !== '/')"
                  :key="item.path"
                  class="mobile-only-item"
                >
                  {{ item.label }}
                </a-menu-item>
              </template>
              <a-menu-divider />
              <a-menu-item key="logout" danger>
                <template #icon><LogoutOutlined /></template>
                退出登录
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

        <template v-else>
          <router-link to="/user/register" class="btn btn--quiet btn--sm register-link">注册</router-link>
          <router-link to="/user/login" class="btn btn--ink btn--sm">登录</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--paper);
  border-bottom: 1px solid var(--rule);
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 40px;
  height: var(--header-h);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  text-decoration: none;
}

.brand:hover {
  text-decoration: none;
}

.brand-word {
  font-family: var(--font-wide);
  font-stretch: 125%;
  font-weight: 850;
  font-size: 19px;
  letter-spacing: -0.02em;
  line-height: 1;
}

.site-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.nav-link {
  position: relative;
  isolation: isolate;
  padding: 8px 12px;
  color: var(--ink-2);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  transition: color var(--t-fast) var(--ease-out);
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 4px;
  height: 9px;
  z-index: -1;
  background: var(--yellow);
  mix-blend-mode: multiply;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 360ms var(--ease-out);
}

.nav-link:hover {
  color: var(--ink);
  text-decoration: none;
}

.nav-link.is-active {
  color: var(--ink);
}

.nav-link.is-active::after {
  transform: scaleX(1);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 12px 0 5px;
  border: 1.5px solid var(--rule);
  border-radius: var(--pill);
  background: var(--sheet);
  cursor: pointer;
  transition: border-color var(--t-fast) var(--ease-out);
}

.user-chip:hover {
  border-color: var(--ink);
}

.user-avatar {
  background: var(--pink);
  color: var(--ink);
}

.user-name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
}

.user-caret {
  font-size: 10px;
  color: var(--ink-3);
}

:global(.mobile-only-item),
:global(.mobile-only-divider) {
  display: none !important;
}

@media (max-width: 760px) {
  .header-inner {
    gap: 16px;
  }

  .site-nav {
    display: none;
  }

  .user-name {
    display: none;
  }

  .user-chip {
    padding-right: 10px;
  }

  :global(.mobile-only-item) {
    display: flex !important;
  }

  :global(.mobile-only-divider) {
    display: block !important;
  }
}
</style>
