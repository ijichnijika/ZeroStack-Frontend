<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { userLogin } from '@/api/userController'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)

const formState = reactive<API.UserLoginRequest>({
  userAccount: '',
  userPassword: '',
})

const handleSubmit = async () => {
  if (!formState.userAccount || !formState.userPassword) {
    message.warning('请输入账号和密码')
    return
  }
  
  loading.value = true
  try {
    const res = await userLogin(formState)
    if (res.data?.code === 0 && res.data?.data) {
      message.success('登录成功！')
      userStore.setLoginUser(res.data.data)
      
      const redirect = route.query.redirect as string
      router.replace(redirect || '/')
    } else {
      message.error(res.data?.message || '登录失败，请检查账号和密码')
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
  ]
}
</script>

<template>
  <div class="login-container">
    <div class="glass-card animate-fade-in">
      <!-- 左侧 3D 插画区域 -->
      <div class="left-section">
        <div class="illustration-overlay"></div>
      </div>

      <!-- 右侧表单操作区域 -->
      <div class="right-section">
        <div class="form-wrapper">
          <!-- 探头智能机器人吉祥物 -->
          <div class="mascot-wrapper">
            <svg class="mascot-robot" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <!-- 天线 -->
              <rect x="47" y="10" width="6" height="15" fill="#3b82f6" rx="2" />
              <circle cx="50" cy="10" r="6" fill="#f59e0b" />
              <!-- 头部 -->
              <rect x="20" y="25" width="60" height="50" fill="#e0f2fe" rx="18" stroke="#bae6fd" stroke-width="2" />
              <!-- 脸部屏幕 -->
              <rect x="28" y="33" width="44" height="34" fill="#1e293b" rx="10" />
              <!-- 眼睛 -->
              <ellipse cx="41" cy="50" rx="4" ry="6" fill="#38bdf8" />
              <ellipse cx="59" cy="50" rx="4" ry="6" fill="#38bdf8" />
              <!-- 腮红 -->
              <circle cx="34" cy="56" r="3" fill="#fda4af" />
              <circle cx="66" cy="56" r="3" fill="#fda4af" />
              <!-- 嘴巴 -->
              <path d="M47,56 Q50,59 53,56" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>

          <div class="header">
            <h2>欢迎回来</h2>
            <p class="subtitle">输入您的账号密码以登录系统</p>
          </div>

          <a-form
            :model="formState"
            layout="vertical"
            class="login-form"
            @finish="handleSubmit"
          >
            <a-form-item
              name="userAccount"
              :rules="rules.userAccount"
            >
              <a-input
                v-model:value="formState.userAccount"
                placeholder="请输入账号"
                size="large"
                class="pill-input"
              >
                <template #prefix>
                  <UserOutlined class="input-icon" />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item
              name="userPassword"
              :rules="rules.userPassword"
            >
              <a-input-password
                v-model:value="formState.userPassword"
                placeholder="请输入密码"
                size="large"
                class="pill-input"
              >
                <template #prefix>
                  <LockOutlined class="input-icon" />
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
                class="submit-btn"
              >
                登 录
              </a-button>
            </a-form-item>

            <div class="form-footer">
              <router-link to="/user/register" class="footer-link">注册账号</router-link>
              <span class="divider-line">|</span>
              <a href="javascript:;" class="footer-link gray">忘记密码</a>
            </div>
          </a-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: transparent;
  padding: 40px 24px;
}

.glass-card {
  display: flex;
  width: 100%;
  max-width: 920px;
  min-height: 540px;
  background: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(20px) saturate(120%);
  -webkit-backdrop-filter: blur(20px) saturate(120%);
  border-radius: 28px;
  box-shadow: 0 15px 35px rgba(31, 38, 135, 0.08), 0 5px 15px rgba(0, 0, 0, 0.02) !important;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.35) !important;
}

/* 左侧 3D 插画区域 */
.left-section {
  width: 42%;
  position: relative;
  background-image: url('@/assets/login_illustration.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.illustration-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(30, 41, 59, 0.02) 100%);
}

/* 右侧表单操作区域 */
.right-section {
  width: 58%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px;
  background: transparent;
}

.form-wrapper {
  width: 100%;
  max-width: 360px;
  position: relative;
}

/* 探头机器人小吉祥物 */
.mascot-wrapper {
  position: absolute;
  top: -85px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 80px;
  pointer-events: none;
}

.mascot-robot {
  width: 100%;
  height: 100%;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-6px) rotate(2deg);
  }
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.header h2 {
  font-size: 26px;
  color: #111827;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 0;
}

/* 胶囊输入框 */
.pill-input {
  border-radius: 99px !important;
  background-color: rgba(255, 255, 255, 0.35) !important;
  backdrop-filter: blur(4px) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  padding: 10px 20px !important;
  transition: all 0.3s ease !important;
}

.pill-input:hover {
  background-color: rgba(255, 255, 255, 0.5) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.pill-input:focus-within {
  background-color: rgba(255, 255, 255, 0.75) !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
}

.pill-input :deep(.ant-input) {
  background-color: transparent !important;
  font-size: 15px !important;
}

.input-icon {
  color: #9ca3af;
  margin-right: 6px;
  font-size: 16px;
}

/* 胶囊高对比度黑色按钮 */
.submit-btn {
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 99px;
  background-color: #111827;
  border: none;
  box-shadow: 0 4px 12px rgba(17, 24, 39, 0.12);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 6px;
}

.submit-btn:hover, .submit-btn:focus {
  background-color: #1f2937;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(17, 24, 39, 0.18);
}

.submit-btn:active {
  transform: translateY(0px);
}

/* 表单底部 */
.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-top: 24px;
}

.footer-link {
  color: #3b82f6;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #2563eb;
}

.footer-link.gray {
  color: #9ca3af;
  font-weight: 400;
}

.footer-link.gray:hover {
  color: #6b7280;
}

.divider-line {
  color: #e5e7eb;
  user-select: none;
}

/* 动效 */
.animate-fade-in {
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
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
    padding: 56px 32px 40px;
  }
  
  .mascot-wrapper {
    top: -70px;
  }
}
</style>
