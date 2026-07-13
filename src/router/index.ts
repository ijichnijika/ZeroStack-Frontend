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
          path: 'user/profile',
          name: 'userProfile',
          component: () => import('../pages/user/UserProfilePage.vue'),
          meta: {
            title: '个人中心',
            needLogin: true,
          },
        },
        {
          path: 'user/settings',
          name: 'userSettings',
          component: () => import('../pages/user/UserSettingsPage.vue'),
          meta: {
            title: '个人设置',
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
      path: '/user/register',
      name: 'userRegister',
      component: () => import('../pages/user/UserRegisterPage.vue'),
      meta: {
        title: '用户注册',
        hideInMenu: true,
      },
    },
  ],
})

// 路由守卫：登录拦截与角色权限验证
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 如果尚未尝试获取用户信息，则先尝试拉取一次
  if (userStore.loginUser && !userStore.loginUser.id) {
    await userStore.fetchLoginUser()
  }

  const { needAdmin, needLogin } = to.meta
  const { loginUser } = userStore

  // 如果访问的目标路由需要管理员权限或需要登录
  if (needAdmin || needLogin) {
    if (!loginUser.id) {
      // 未登录，拦截并跳转到登录页面
      message.warning('请先登录后访问')
      next(`/user/login?redirect=${encodeURIComponent(to.fullPath)}`)
      return
    }
    if (needAdmin && loginUser.userRole !== 'admin') {
      // 已登录但不是管理员
      message.error('权限不足，仅管理员可访问')
      next('/')
      return
    }
  }
  next()
})

export default router
