/**
 * 前端路由与导航守卫配置
 * 统一管理页面路由表、登录鉴权、管理员权限校验以及动态标题更新。
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'
import HomeView from '../pages/HomeView.vue'
import BasicLayout from '../layouts/BasicLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: BasicLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
          meta: {
            title: '首页',
          },
        },
        {
          path: 'admin/user-manage',
          name: 'userManage',
          component: () => import('../pages/admin/UserManagePage.vue'),
          meta: {
            title: '用户管理',
            needAdmin: true,
          },
        },
        {
          path: 'admin/app-manage',
          name: 'appManage',
          component: () => import('../pages/admin/AppManagePage.vue'),
          meta: {
            title: '应用管理',
            needAdmin: true,
          },
        },
        {
          path: 'admin/chat-manage',
          name: 'chatManage',
          component: () => import('../pages/admin/ChatManagePage.vue'),
          meta: {
            title: '对话管理',
            needAdmin: true,
          },
        },

        {
          path: 'app/edit/:id',
          name: 'appEdit',
          component: () => import('../pages/app/AppEditPage.vue'),
          meta: {
            title: '应用编辑',
            hideInMenu: true,
            needLogin: true,
          },
        },
        {
          path: 'user/profile',
          name: 'userProfile',
          component: () => import('../pages/user/UserProfilePage.vue'),
          meta: {
            title: '个人中心',
            hideInMenu: true,
            needLogin: true,
          },
        },
        {
          path: 'user/settings',
          name: 'userSettings',
          component: () => import('../pages/user/UserSettingsPage.vue'),
          meta: {
            title: '个人设置',
            hideInMenu: true,
            needLogin: true,
          },
        },
      ]
    },
    {
      path: '/user/login',
      name: 'userLogin',
      component: () => import('../pages/user/UserLoginPage.vue'),
      meta: {
        title: '用户登录',
        hideInMenu: true,
      },
    },
    {
      path: '/app/chat/:id',
      name: 'appChat',
      component: () => import('../pages/app/AppChatPage.vue'),
      meta: {
        title: '应用生成',
        hideInMenu: true,
        needLogin: true,
      },
    },
    {
      path: '/user/register',
      name: 'userRegister',
      component: () => import('../pages/user/UserRegisterPage.vue'),
      meta: {
        title: '用户注册',
        hideInMenu: true,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../pages/NotFoundPage.vue'),
      meta: {
        title: '页面不存在',
        hideInMenu: true,
      },
    },
  ],
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()

  if (userStore.loginUser && !userStore.loginUser.id) {
    await userStore.fetchLoginUser()
  }

  const { needAdmin, needLogin } = to.meta
  const { loginUser } = userStore

  if (needAdmin || needLogin) {
    if (!loginUser.id) {
      message.warning('请先登录后访问')
      return `/user/login?redirect=${encodeURIComponent(to.fullPath)}`
    }
    if (needAdmin && loginUser.userRole !== 'admin') {
      message.error('权限不足，仅管理员可访问')
      return '/'
    }
  }
})

router.afterEach((to) => {
  const title = to.meta?.title as string | undefined
  document.title = title && to.name !== 'home' ? `${title} · ZeroStack` : 'ZeroStack · 一句话做出能上线的网站'
})

export default router
