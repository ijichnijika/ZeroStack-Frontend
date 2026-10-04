<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { userLogin } from '@/api/userController'
import AuthShell from '@/components/AuthShell.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)

const formState = reactive<API.UserLoginRequest>({
  userAccount: '',
  userPassword: '',
})

const rules = {
  userAccount: [
    { required: true, message: '请输入账号' },
    { min: 4, message: '账号至少 4 位' },
  ],
  userPassword: [
    { required: true, message: '请输入密码' },
    { min: 8, message: '密码至少 8 位' },
  ],
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const res = await userLogin(formState)
    if (res.data?.code === 0 && res.data.data) {
      userStore.setLoginUser(res.data.data)
      message.success('登录成功')
      router.replace((route.query.redirect as string) || '/')
    } else {
      message.error(res.data?.message || '账号或密码不正确')
    }
  } catch (error: unknown) {
    message.error(error instanceof Error ? error.message : '网络异常，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell title="登录" subtitle="欢迎回来，继续做你的网站。">
    <a-form :model="formState" layout="vertical" :required-mark="false" @finish="handleSubmit">
      <a-form-item name="userAccount" :rules="rules.userAccount">
        <a-input
          v-model:value="formState.userAccount"
          placeholder="账号"
          aria-label="账号"
          autocomplete="username"
          :spellcheck="false"
        >
          <template #prefix><UserOutlined /></template>
        </a-input>
      </a-form-item>
      <a-form-item name="userPassword" :rules="rules.userPassword">
        <a-input-password
          v-model:value="formState.userPassword"
          placeholder="密码"
          aria-label="密码"
          autocomplete="current-password"
        >
          <template #prefix><LockOutlined /></template>
        </a-input-password>
      </a-form-item>
      <a-button type="primary" html-type="submit" block :loading="loading" class="auth-submit">登录</a-button>
      <div class="auth-foot">
        <span>还没有账号？<router-link :to="route.query.redirect ? { path: '/user/register', query: { redirect: route.query.redirect } } : '/user/register'">注册一个</router-link></span>
        <a-tooltip title="目前需要联系管理员重置密码">
          <span class="forgot">忘记密码</span>
        </a-tooltip>
      </div>
    </a-form>
  </AuthShell>
</template>

<style scoped>
.forgot {
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
}
</style>
