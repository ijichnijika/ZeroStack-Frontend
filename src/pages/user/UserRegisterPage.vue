<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { userRegister } from '@/api/userController'
import AuthShell from '@/components/AuthShell.vue'

const router = useRouter()
const loading = ref(false)

const formState = reactive<API.UserRegisterRequest>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
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
  checkPassword: [
    { required: true, message: '请再输入一次密码' },
    {
      validator: async (_rule: unknown, value: string) => {
        if (value && value !== formState.userPassword) throw new Error('两次输入的密码不一致')
      },
    },
  ],
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const res = await userRegister({ ...formState })
    if (res.data?.code === 0 && res.data.data) {
      message.success('注册成功，请登录')
      router.push('/user/login')
    } else {
      message.error(res.data?.message || '注册失败，账号可能已被占用')
    }
  } catch (error: unknown) {
    message.error(error instanceof Error ? error.message : '网络异常，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell title="注册账号" subtitle="注册后就能用一句话生成并部署你的第一个网站。">
    <a-form :model="formState" layout="vertical" :required-mark="false" @finish="handleSubmit">
      <a-form-item name="userAccount" :rules="rules.userAccount">
        <a-input
          v-model:value="formState.userAccount"
          placeholder="账号，至少 4 位"
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
          placeholder="密码，至少 8 位"
          aria-label="密码"
          autocomplete="new-password"
        >
          <template #prefix><LockOutlined /></template>
        </a-input-password>
      </a-form-item>
      <a-form-item name="checkPassword" :rules="rules.checkPassword">
        <a-input-password
          v-model:value="formState.checkPassword"
          placeholder="再输入一次密码"
          aria-label="确认密码"
          autocomplete="new-password"
        >
          <template #prefix><LockOutlined /></template>
        </a-input-password>
      </a-form-item>
      <a-button type="primary" html-type="submit" block :loading="loading" class="auth-submit">注册</a-button>
      <div class="auth-foot">
        <span>已有账号？<router-link to="/user/login">直接登录</router-link></span>
      </div>
    </a-form>
  </AuthShell>
</template>
