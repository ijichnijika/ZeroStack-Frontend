import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getLoginUser, userLogout } from '@/api/userController'

export const useUserStore = defineStore('user', () => {
  const loginUser = ref<API.LoginUserVO>({})

  /**
   * 获取当前登录用户
   */
  async function fetchLoginUser() {
    try {
      const res = await getLoginUser()
      if (res.data?.code === 0 && res.data?.data) {
        loginUser.value = res.data.data
      } else {
        // 未登录或获取失败，置为空对象
        loginUser.value = {}
      }
    } catch {
      loginUser.value = {}
    }
  }

  /**
   * 设置登录用户
   */
  function setLoginUser(user: API.LoginUserVO) {
    loginUser.value = user
  }

  /**
   * 退出登录
   */
  async function logout() {
    try {
      const res = await userLogout()
      if (res.data?.code === 0) {
        loginUser.value = {}
      }
      return res.data
    } catch (error) {
      loginUser.value = {}
      throw error
    }
  }

  return {
    loginUser,
    fetchLoginUser,
    setLoginUser,
    logout,
  }
})
