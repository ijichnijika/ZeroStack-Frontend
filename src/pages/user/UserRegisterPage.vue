<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { userRegister } from '@/api/userController'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const loading = ref(false)

const formState = reactive<API.UserRegisterRequest & { checkPassword?: string }>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
})

const handleSubmit = async () => {
  if (!formState.userAccount || !formState.userPassword || !formState.checkPassword) {
    message.warning('请填写所有注册信息')
    return
  }
  if (formState.userPassword !== formState.checkPassword) {
    message.error('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    const res = await userRegister({
      userAccount: formState.userAccount,
      userPassword: formState.userPassword,
      checkPassword: formState.checkPassword,
    })
    if (res.data?.code === 0 && res.data?.data) {
      message.success('注册成功！正在为您跳转到登录页面…')
      setTimeout(() => {
        router.push('/user/login')
      }, 1500)
    } else {
      message.error(res.data?.message || '注册失败，请检查账号是否已存在')
    }
  } catch (error: any) {
    message.error(error.message || '网络异常，请重试')
  } finally {
    loading.value = false
  }
}

// 统一表单验证规则
const rules = {
  userAccount: [
    { required: true, message: '请输入账号' },
    { min: 4, message: '账号长度不能少于 4 位' }
  ],
  userPassword: [
    { required: true, message: '请输入密码' },
    { min: 8, message: '密码长度不能少于 8 位' }
  ],
  checkPassword: [
    { required: true, message: '请确认密码' },
    {
      validator: async (_rule: any, value: string) => {
        if (value && value !== formState.userPassword) {
          throw new Error('两次输入的密码不一致')
        }
      }
    }
  ]
}
</script>

<template>
  <div class="register-container">
    <router-link to="/" class="back-home-btn" aria-label="返回主页">
      <ArrowLeftOutlined aria-hidden="true" />
      <span>返回主页</span>
    </router-link>

    <div class="glass-card animate-fade-in">
      <!-- 左侧 3D 插画区域 -->
      <div class="left-section">
        <div class="illustration-overlay"></div>
      </div>

      <!-- 右侧表单操作区域 -->
      <div class="right-section">
        <div class="form-wrapper">
          <!-- 品牌徽标 -->
          <div class="brand-badge-wrapper">
            <div class="brand-badge-icon">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="compiler-core-svg" aria-hidden="true">
                <path d="M24 6L40 15L24 24L8 15L24 6Z" fill="#4F46E5" />
                <path d="M8 21L24 30L40 21" stroke="#6366F1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 27L24 36L40 27" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 33L24 42L40 33" stroke="#312E81" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="24" cy="15" r="2.5" fill="#FFFFFF"/>
              </svg>
            </div>
          </div>

          <div class="header">
            <h2>注册新账号</h2>
            <p class="subtitle">创建您的 ZeroStack 平台账号</p>
          </div>

          <a-form
            :model="formState"
            layout="vertical"
            class="register-form"
            @finish="handleSubmit"
          >
            <a-form-item
              name="userAccount"
              :rules="rules.userAccount"
            >
              <a-input
                v-model:value="formState.userAccount"
                placeholder="请输入账号…"
                size="large"
                class="precision-input"
                name="userAccount"
                aria-label="账号"
                autocomplete="username"
                :spellcheck="false"
              >
                <template #prefix>
                  <UserOutlined class="input-icon" aria-hidden="true" />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item
              name="userPassword"
              :rules="rules.userPassword"
            >
              <a-input-password
                v-model:value="formState.userPassword"
                placeholder="请输入密码…"
                size="large"
                class="precision-input"
                name="userPassword"
                aria-label="密码"
                autocomplete="new-password"
              >
                <template #prefix>
                  <LockOutlined class="input-icon" aria-hidden="true" />
                </template>
              </a-input-password>
            </a-form-item>

            <a-form-item
              name="checkPassword"
              :rules="rules.checkPassword"
            >
              <a-input-password
                v-model:value="formState.checkPassword"
                placeholder="请确认密码…"
                size="large"
                class="precision-input"
                name="checkPassword"
                aria-label="确认密码"
                autocomplete="new-password"
              >
                <template #prefix>
                  <LockOutlined class="input-icon" aria-hidden="true" />
                </template>
              </a-input-password>
            </a-form-item>

            <a-form-item>
              <a-button
                type="primary"
                html-type="submit"
                size="large"
                block
                :loading="loading"
                class="primary-animated-btn"
                style="width: 100%; height: 44px; margin-top: 6px;"
              >
                注册
              </a-button>
            </a-form-item>

            <div class="form-footer">
              <span>已经有账号？</span>
              <router-link to="/user/login" class="footer-link">立即登录</router-link>
            </div>
          </a-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: transparent;
  padding: 40px 24px;
  position: relative;
}

.back-home-btn {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 9999px;
  text-decoration: none;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.back-home-btn:hover {
  color: #4f46e5;
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(99, 102, 241, 0.35);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.15);
}

.back-home-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #6366f1;
}

.glass-card {
  display: flex;
  width: 100%;
  max-width: 960px;
  min-height: 600px;
  background: rgba(255, 255, 255, 0.78) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(31, 38, 135, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95) !important;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.9) !important;
}

/* 左侧 3D 插画区域 */
.left-section {
  width: 44%;
  position: relative;
  background-image: url('@/assets/login_illustration.png');
  background-size: cover;
  background-position: center 20%;
  background-repeat: no-repeat;
  border-right: 1px solid rgba(15, 23, 42, 0.06);
}

.illustration-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(15, 23, 42, 0.03) 100%);
}

/* 右侧表单操作区域 */
.right-section {
  width: 56%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
}

.form-wrapper {
  width: 100%;
  max-width: 360px;
  position: relative;
}

/* 品牌徽标 */
.brand-badge-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.brand-badge-icon {
  width: 52px;
  height: 52px;
  padding: 6px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.compiler-core-svg {
  width: 100%;
  height: 100%;
}

.header {
  text-align: center;
  margin-bottom: 28px;
}

.header h2 {
  font-size: 24px;
  color: #0f172a;
  font-weight: 700;
  letter-spacing: -0.4px;
  margin-bottom: 6px;
  text-wrap: balance;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 0;
}

/* 表单输入框 */
.precision-input {
  border-radius: 10px !important;
  background-color: rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(8px) !important;
  border: 1px solid rgba(226, 232, 240, 0.9) !important;
  padding: 8px 14px !important;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.03) !important;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease !important;
}

.precision-input:hover {
  border-color: rgba(99, 102, 241, 0.4) !important;
  background-color: rgba(255, 255, 255, 0.88) !important;
}

.precision-input:focus-within {
  border-color: #6366f1 !important;
  background-color: #ffffff !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2), 0 4px 12px rgba(99, 102, 241, 0.1) !important;
}

.precision-input :deep(.ant-input) {
  background-color: transparent !important;
  font-size: 14px !important;
  color: #0f172a !important;
}

.input-icon {
  color: #94a3af;
  margin-right: 6px;
  font-size: 15px;
}

/* 表单底部 */
.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-top: 24px;
  color: #64748b;
}

.footer-link {
  color: #4f46e5;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #4338ca;
}

/* 动效 */
.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .glass-card {
    max-width: 440px;
    min-height: auto;
  }
  
  .left-section {
    display: none;
  }
  
  .right-section {
    width: 100%;
    padding: 40px 24px 32px;
  }
}
</style>
